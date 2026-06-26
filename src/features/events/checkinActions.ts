"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { earnPoints } from "@/features/loyalty/actions";

export type CheckinRecord = {
  id: string;
  visitor_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
};

export type CheckinResult =
  | { status: "checked_in";  visitor: { full_name: string | null; email: string } }
  | { status: "checked_out"; visitor: { full_name: string | null; email: string } }
  | { status: "not_registered" }
  | { status: "error"; message: string };

export async function checkinOrCheckout(
  eventId: string,
  visitorId: string,
): Promise<CheckinResult> {
  const supabase = await createSupabaseServerClient();

  // 1. Visitor bu fuara kayıtlı mı?
  const { data: reg } = await supabase
    .from("event_registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (!reg) return { status: "not_registered" };

  // 2. Visitor profil bilgisi
  const { data: visitorProfile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", visitorId)
    .single();

  if (!visitorProfile) return { status: "error", message: "Profil bulunamadı." };

  // 3. Son check-in kaydı
  const { data: lastCheckin } = await supabase
    .from("fair_checkins")
    .select("id, checked_out_at")
    .eq("event_id", eventId)
    .eq("visitor_id", visitorId)
    .order("checked_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastCheckin || lastCheckin.checked_out_at !== null) {
    // Yeni giriş
    await supabase.from("fair_checkins").insert({
      event_id: eventId,
      visitor_id: visitorId,
    });

    // Puan: check-in başına 1 kez (duplicate index ile korunuyor)
    await earnPoints(eventId, "checkin", 50);

    revalidatePath(`/organizer/events/${eventId}`);
    return { status: "checked_in", visitor: visitorProfile };
  } else {
    // Check-out
    await supabase
      .from("fair_checkins")
      .update({ checked_out_at: new Date().toISOString() })
      .eq("id", lastCheckin.id);

    revalidatePath(`/organizer/events/${eventId}`);
    return { status: "checked_out", visitor: visitorProfile };
  }
}

export type RegistrantRow = {
  registration_id: string;
  visitor_id: string;
  full_name: string | null;
  email: string;
  ticket_code: string | null;
  status: string;
  registered_at: string;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_out_at: string | null;
};

export async function getEventRegistrantsWithCheckins(eventId: string): Promise<RegistrantRow[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: regs }, { data: checkins }] = await Promise.all([
    supabase
      .from("event_registrations")
      .select("id, visitor_id, ticket_code, status, created_at, profiles(full_name, email)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase
      .from("fair_checkins")
      .select("visitor_id, checked_in_at, checked_out_at")
      .eq("event_id", eventId)
      .order("checked_in_at", { ascending: false }),
  ]);

  const checkinMap = new Map<string, { checked_in_at: string; checked_out_at: string | null }>();
  for (const c of (checkins ?? [])) {
    if (!checkinMap.has(c.visitor_id)) {
      checkinMap.set(c.visitor_id, { checked_in_at: c.checked_in_at, checked_out_at: c.checked_out_at });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (regs ?? []).map((r: any) => {
    const profile = Array.isArray(r.profiles) ? (r.profiles[0] ?? null) : (r.profiles ?? null);
    const checkin = checkinMap.get(r.visitor_id);
    return {
      registration_id: r.id,
      visitor_id: r.visitor_id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? "—",
      ticket_code: r.ticket_code ?? null,
      status: r.status ?? "pending",
      registered_at: r.created_at,
      checked_in: !!checkin,
      checked_in_at: checkin?.checked_in_at ?? null,
      checked_out_at: checkin?.checked_out_at ?? null,
    };
  });
}

export async function getCheckins(eventId: string): Promise<CheckinRecord[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("fair_checkins")
    .select(`
      id, visitor_id, checked_in_at, checked_out_at,
      profiles ( full_name, email, avatar_url )
    `)
    .eq("event_id", eventId)
    .order("checked_in_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    visitor_id: r.visitor_id,
    checked_in_at: r.checked_in_at,
    checked_out_at: r.checked_out_at ?? null,
    profile: Array.isArray(r.profiles) ? (r.profiles[0] ?? null) : (r.profiles ?? null),
  }));
}
