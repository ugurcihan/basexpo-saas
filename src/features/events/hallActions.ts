"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function createHall(eventId: string, name: string, floor: number = 1) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  // Yetki: bu fuarın organizatörü müyüz?
  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", eventId)
    .single();

  if (event?.organizer_id !== user.id) return { error: "Yetkisiz." };

  const { data, error } = await supabase
    .from("halls")
    .insert({ event_id: eventId, name, floor })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/organizer/events/${eventId}`);
  return { data };
}

export async function deleteHall(hallId: string, eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase
    .from("halls")
    .delete()
    .eq("id", hallId);

  if (error) return { error: error.message };

  revalidatePath(`/organizer/events/${eventId}`);
  return { success: true };
}

export async function createBooth(hallId: string, code: string, eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { data, error } = await supabase
    .from("booths")
    .insert({ hall_id: hallId, code })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Bu salon için stand kodu zaten mevcut." };
    return { error: error.message };
  }

  revalidatePath(`/organizer/events/${eventId}`);
  return { data };
}

export async function deleteBooth(boothId: string, eventId: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("booths")
    .delete()
    .eq("id", boothId);

  if (error) return { error: error.message };

  revalidatePath(`/organizer/events/${eventId}`);
  return { success: true };
}
