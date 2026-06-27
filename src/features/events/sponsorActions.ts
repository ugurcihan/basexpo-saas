"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function addSponsor(
  eventId: string,
  exhibitorId: string,
  tier: number,
  tierName: string,
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const tierDefaults: Record<number, { width_pct: number; height_px: number }> = {
    1: { width_pct: 100, height_px: 160 },
    2: { width_pct: 48,  height_px: 110 },
    3: { width_pct: 31,  height_px: 85  },
    4: { width_pct: 23,  height_px: 70  },
  };
  const defaults = tierDefaults[tier] ?? tierDefaults[4];

  const { error } = await supabase.from("event_sponsors").insert({
    event_id: eventId,
    exhibitor_id: exhibitorId,
    tier,
    tier_name: tierName,
    width_pct: defaults.width_pct,
    height_px:  defaults.height_px,
  });

  if (error) return { error: error.message };

  revalidatePath(`/organizer/events/${eventId}`);
  return { success: true };
}

export async function removeSponsor(sponsorId: string, eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase
    .from("event_sponsors")
    .delete()
    .eq("id", sponsorId);

  if (error) return { error: error.message };

  revalidatePath(`/organizer/events/${eventId}`);
  return { success: true };
}

export async function getEventSponsors(eventId: string) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("event_sponsors")
    .select(`
      id,
      tier,
      tier_name,
      width_pct,
      height_px,
      sort_order,
      custom_logo_url,
      exhibitor:exhibitors (
        id,
        company_name,
        logo_url,
        tags
      )
    `)
    .eq("event_id", eventId)
    .order("tier", { ascending: true })
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function updateSponsorLayouts(
  updates: { id: string; width_pct: number; height_px: number; sort_order: number }[],
  eventId: string,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  for (const u of updates) {
    const { error } = await supabase
      .from("event_sponsors")
      .update({ width_pct: u.width_pct, height_px: u.height_px, sort_order: u.sort_order })
      .eq("id", u.id);
    if (error) return { error: error.message };
  }

  revalidatePath(`/organizer/events/${eventId}`);
  return {};
}

export async function updateSponsorLogo(
  sponsorId: string,
  logoUrl: string | null,
  eventId: string,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase
    .from("event_sponsors")
    .update({ custom_logo_url: logoUrl })
    .eq("id", sponsorId);

  if (error) return { error: error.message };

  revalidatePath(`/organizer/events/${eventId}`);
  return {};
}
