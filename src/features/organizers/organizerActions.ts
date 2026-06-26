"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export type OrganizerProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  org_name: string | null;
  website: string | null;
  city: string | null;
  follower_count: number;
  event_count: number;
};

export type OrganizerEvent = {
  id: string;
  name: string;
  cover_url: string | null;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  category: string | null;
};

export async function getOrganizerProfile(organizerId: string): Promise<OrganizerProfile | null> {
  const supabase = await createSupabaseServerClient();

  const [{ data: profile }, { count: followerCount }, { count: eventCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio, org_name, website, city")
      .eq("id", organizerId)
      .eq("role", "organizer")
      .maybeSingle(),
    supabase
      .from("organizer_follows")
      .select("*", { count: "exact", head: true })
      .eq("organizer_id", organizerId),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("organizer_id", organizerId)
      .in("status", ["published", "active", "ended"]),
  ]);

  if (!profile) return null;

  return {
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url ?? null,
    bio: (profile as Record<string, unknown>).bio as string | null ?? null,
    org_name: (profile as Record<string, unknown>).org_name as string | null ?? null,
    website: (profile as Record<string, unknown>).website as string | null ?? null,
    city: (profile as Record<string, unknown>).city as string | null ?? null,
    follower_count: followerCount ?? 0,
    event_count: eventCount ?? 0,
  };
}

export async function getOrganizerEvents(organizerId: string): Promise<OrganizerEvent[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("events")
    .select("id, name, cover_url, location, start_date, end_date, status, category")
    .eq("organizer_id", organizerId)
    .in("status", ["published", "active", "ended"])
    .order("start_date", { ascending: false });

  return (data ?? []) as OrganizerEvent[];
}

export async function getFollowStatus(organizerId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("organizer_follows")
    .select("id")
    .eq("organizer_id", organizerId)
    .eq("follower_id", user.id)
    .maybeSingle();

  return !!data;
}

export async function followOrganizer(organizerId: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmanız gerekiyor." };

  const { error } = await supabase
    .from("organizer_follows")
    .insert({ follower_id: user.id, organizer_id: organizerId });

  if (error && !error.message.includes("duplicate")) return { error: error.message };

  revalidatePath(`/o/${organizerId}`);
  return {};
}

export async function unfollowOrganizer(organizerId: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmanız gerekiyor." };

  const { error } = await supabase
    .from("organizer_follows")
    .delete()
    .eq("organizer_id", organizerId)
    .eq("follower_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/o/${organizerId}`);
  return {};
}
