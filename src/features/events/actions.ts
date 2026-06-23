"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { EventStatus } from "@/types";

export interface CreateEventInput {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
}

export interface UpdateEventInput extends CreateEventInput {
  id: string;
  status?: EventStatus;
}

export async function createEvent(input: CreateEventInput) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { data, error } = await supabase
    .from("events")
    .insert({ ...input, organizer_id: user.id, status: "published" as const })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/organizer/events");
  return { data };
}

export async function updateEvent(input: UpdateEventInput) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { id, ...fields } = input;
  const { data, error } = await supabase
    .from("events")
    .update(fields)
    .eq("id", id)
    .eq("organizer_id", user.id) // RLS ek doğrulama
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/organizer/events");
  revalidatePath(`/organizer/events/${id}`);
  return { data };
}

export async function deleteEvent(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/organizer/events");
  return { success: true };
}

export async function getOrganizerEvents() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function updateEventGallery(eventId: string, galleryUrls: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase
    .from("events")
    .update({ gallery_urls: galleryUrls })
    .eq("id", eventId)
    .eq("organizer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/organizer/events/${eventId}`);
  return { success: true };
}

export interface EventDetailsInput {
  id: string;
  maps_url?: string;
  category?: string;
  tags?: string[];
  youtube_url?: string;
  social_links?: { website?: string; instagram?: string; twitter?: string; linkedin?: string };
  banner_url?: string;
}

export async function updateEventDetails(input: EventDetailsInput) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { id, ...fields } = input;
  const { error } = await supabase
    .from("events")
    .update(fields)
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/organizer/events");
  revalidatePath(`/organizer/events/${id}`);
  return { success: true };
}

export async function getEventWithHalls(eventId: string) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("events")
    .select(`
      *,
      halls (
        *,
        booths (*)
      )
    `)
    .eq("id", eventId)
    .single();

  return data;
}
