"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { earnPoints } from "@/features/loyalty/actions";

export async function getExhibitorByToken(token: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("exhibitors")
    .select(`
      id, company_name, description, logo_url, tags, qr_token, event_id,
      event:events(id, name, location, start_date, end_date, gallery_urls),
      products(id, name, description, image_url)
    `)
    .eq("qr_token", token)
    .single();
  return data;
}

export async function checkExistingLead(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("leads")
    .select("id")
    .eq("exhibitor_id", exhibitorId)
    .eq("visitor_id", user.id)
    .maybeSingle();

  return !!data;
}

export async function createLeadFromScan(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "login_required" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "visitor") return { error: "visitor_only" };

  const { error } = await supabase.from("leads").insert({
    exhibitor_id: exhibitorId,
    visitor_id: user.id,
    source: "qr",
  });

  if (error) {
    if (error.code === "23505") return { error: null, alreadyExists: true };
    return { error: error.message };
  }

  // Heatmap için ayrıca qr_scans'a kayıt at (booth_id + event_id'yi exhibitor'dan çek)
  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("event_id, booths:booths(id)")
    .eq("id", exhibitorId)
    .single();

  if (exhibitor) {
    const boothId = (exhibitor.booths as { id: string }[] | null)?.[0]?.id ?? null;
    await supabase.from("qr_scans").insert({
      exhibitor_id: exhibitorId,
      booth_id: boothId,
      visitor_id: user.id,
      event_id: exhibitor.event_id,
    });

    // Puan: her unique exhibitor ziyaretine +20 (duplicate index ile korunuyor)
    if (exhibitor.event_id) {
      await earnPoints(exhibitor.event_id, "booth_visit", 20, exhibitorId);
    }
  }

  revalidatePath("/visitor");
  revalidatePath("/exhibitor/leads");
  revalidatePath("/organizer/booth-tracking");
  return { error: null, alreadyExists: false };
}

// ─── Booth QR Scan ───────────────────────────────────────────
export async function getBoothByQrToken(token: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("booths")
    .select(`
      id, code, qr_token, is_golden, golden_bonus_points,
      hall:halls(id, name, event_id,
        event:events(id, name, location, start_date, end_date, gallery_urls)
      ),
      exhibitor:exhibitors(id, company_name, description, logo_url, tags,
        products(id, name, description, image_url)
      )
    `)
    .eq("qr_token", token)
    .single();
  return data;
}

export async function checkInToBoothScan(boothId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "login_required", isGolden: false, bonusPoints: 0 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "visitor") return { error: "visitor_only", isGolden: false, bonusPoints: 0 };

  const { data: booth } = await supabase
    .from("booths")
    .select("id, is_golden, golden_bonus_points, exhibitor_id, hall:halls(event_id)")
    .eq("id", boothId)
    .single();

  if (!booth) return { error: "Stant bulunamadı.", isGolden: false, bonusPoints: 0 };

  const isGolden = booth.is_golden as boolean;
  const bonusPoints = (booth.golden_bonus_points as number) ?? 50;
  const eventId = (booth.hall as unknown as { event_id: string } | null)?.event_id ?? null;
  const exhibitorId = booth.exhibitor_id as string | null;

  // Exhibitor varsa lead oluştur
  if (exhibitorId) {
    const { error: leadError } = await supabase.from("leads").insert({
      exhibitor_id: exhibitorId,
      visitor_id: user.id,
      source: "qr",
    });
    if (leadError && leadError.code !== "23505") {
      return { error: leadError.message, isGolden: false, bonusPoints: 0 };
    }
  }

  // QR scan kaydı
  if (eventId) {
    await supabase.from("qr_scans").insert({
      exhibitor_id: exhibitorId,
      booth_id: boothId,
      visitor_id: user.id,
      event_id: eventId,
    });

    // Normal ziyaret puanı
    await earnPoints(eventId, "booth_visit", 20, exhibitorId ?? undefined);

    // Altın QR bonus puanı
    if (isGolden && bonusPoints > 0) {
      await earnPoints(eventId, "booth_visit", bonusPoints, boothId);
    }
  }

  revalidatePath("/visitor");
  if (exhibitorId) revalidatePath("/exhibitor/leads");
  return { error: null, isGolden, bonusPoints };
}

export async function getExhibitorLeads(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("leads")
    .select(`
      id, source, score, note, created_at,
      visitor:profiles!leads_visitor_id_fkey(id, full_name, email, interests, avatar_url)
    `)
    .eq("exhibitor_id", exhibitorId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getVisitorLeads() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("leads")
    .select(`
      id, source, created_at,
      exhibitor:exhibitors(id, company_name, logo_url, tags,
        event:events(name, location)
      )
    `)
    .eq("visitor_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}
