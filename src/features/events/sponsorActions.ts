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

  const { error } = await supabase.from("event_sponsors").insert({
    event_id: eventId,
    exhibitor_id: exhibitorId,
    tier,
    tier_name: tierName,
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
      exhibitor:exhibitors (
        id,
        company_name,
        logo_url,
        tags
      )
    `)
    .eq("event_id", eventId)
    .order("tier", { ascending: true });

  return data ?? [];
}
