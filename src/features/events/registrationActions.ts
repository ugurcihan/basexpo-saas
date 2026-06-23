"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProfile } from "@/lib/supabase-server";

export async function registerForEvent(eventId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Oturum açmanız gerekiyor." };

  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("capacity, requires_approval")
    .eq("id", eventId)
    .single();

  if (!event) return { error: "Fuar bulunamadı." };

  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("visitor_id", profile.id)
    .maybeSingle();

  if (existing) return { error: "Bu fuara zaten kayıtlısınız." };

  // Organizatör onayı gerekiyorsa → pending_approval
  if (event.requires_approval) {
    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      visitor_id: profile.id,
      status: "pending_approval",
      ticket_code: null,
      kvkk_consent: true,
    });

    if (error) return { error: "Başvuru sırasında hata oluştu." };

    revalidatePath("/visitor/upcoming-fairs");
    revalidatePath("/visitor/tickets");
    return { success: true, status: "pending_approval" };
  }

  // Kapasite doluysa → bekleme listesi
  if (event.capacity !== null && event.capacity <= 0) {
    return joinWaitlist(eventId);
  }

  const ticketCode = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    visitor_id: profile.id,
    status: "confirmed",
    ticket_code: ticketCode,
    kvkk_consent: true,
  });

  if (error) return { error: "Kayıt sırasında hata oluştu." };

  if (event.capacity !== null) {
    await supabase
      .from("events")
      .update({ capacity: event.capacity - 1 })
      .eq("id", eventId);
  }

  revalidatePath("/visitor/upcoming-fairs");
  revalidatePath("/visitor/tickets");
  return { success: true, ticketCode, status: "confirmed" };
}

export async function joinWaitlist(eventId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Oturum açmanız gerekiyor." };

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("visitor_id", profile.id)
    .maybeSingle();

  if (existing) return { error: "Bu fuar için zaten kayıt isteğiniz var." };

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    visitor_id: profile.id,
    status: "waitlisted",
    ticket_code: null,
    kvkk_consent: true,
  });

  if (error) return { error: "Bekleme listesine eklenirken hata oluştu." };

  revalidatePath("/visitor/upcoming-fairs");
  revalidatePath("/visitor/tickets");
  return { success: true, status: "waitlisted" };
}

// Organizatör: pending_approval kayıtları onayla/reddet
export async function approveRegistration(registrationId: string) {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") return { error: "Yetkiniz yok." };

  const supabase = await createSupabaseServerClient();
  const ticketCode = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "confirmed", ticket_code: ticketCode })
    .eq("id", registrationId);

  if (error) return { error: error.message };

  revalidatePath("/organizer/participation-requests");
  return { success: true, ticketCode };
}

export async function rejectRegistration(registrationId: string) {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") return { error: "Yetkiniz yok." };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("id", registrationId);

  if (error) return { error: error.message };

  revalidatePath("/organizer/participation-requests");
  return { success: true };
}

export async function getPendingRegistrationsForOrganizer() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") return [];

  const supabase = await createSupabaseServerClient();

  const { data: myEvents } = await supabase
    .from("events")
    .select("id")
    .eq("organizer_id", profile.id);

  const eventIds = (myEvents ?? []).map((e) => e.id);
  if (eventIds.length === 0) return [];

  const { data } = await supabase
    .from("event_registrations")
    .select(`
      id, status, created_at,
      event:events(id, name, start_date),
      visitor:profiles!event_registrations_visitor_id_fkey(id, full_name, email, phone_number)
    `)
    .in("event_id", eventIds)
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  return data ?? [];
}
