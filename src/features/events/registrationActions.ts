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
    .select("capacity")
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

  if (event.capacity !== null && event.capacity <= 0) {
    return joinWaitlist(eventId);
  }

  const ticketCode = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    visitor_id: profile.id,
    status: "confirmed",
    ticket_code: ticketCode,
  });

  if (error) return { error: "Kayıt sırasında hata oluştu." };

  if (event.capacity !== null) {
    await supabase
      .from("events")
      .update({ capacity: event.capacity - 1 })
      .eq("id", eventId);
  }

  revalidatePath("/visitor/upcoming-fairs");
  return { success: true, ticketCode };
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
  });

  if (error) return { error: "Bekleme listesine eklenirken hata oluştu." };

  return { success: true };
}
