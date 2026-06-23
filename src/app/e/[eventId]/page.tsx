import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProfile } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { EventLandingClient } from "./EventLandingClient";

interface PageProps { params: Promise<{ eventId: string }> }

export default async function EventLandingPage({ params }: PageProps) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, description, location, start_date, end_date, capacity, cover_url, gallery_urls, maps_url, youtube_url, social_links, tags, category, requires_approval, status")
    .eq("id", eventId)
    .in("status", ["published", "active"])
    .maybeSingle();

  if (!event) notFound();

  const { data: sponsors } = await supabase
    .from("event_sponsors")
    .select("id, tier, tier_name, exhibitor:exhibitors(id, company_name, logo_url)")
    .eq("event_id", eventId);

  const profile = await getProfile().catch(() => null);

  let registration: { status: string; ticket_code: string | null } | null = null;
  if (profile && profile.role === "visitor") {
    const { data: reg } = await supabase
      .from("event_registrations")
      .select("status, ticket_code")
      .eq("event_id", eventId)
      .eq("visitor_id", profile.id)
      .maybeSingle();
    registration = reg ?? null;
  }

  return (
    <EventLandingClient
      event={event as Parameters<typeof EventLandingClient>[0]["event"]}
      sponsors={(sponsors ?? []) as unknown as Parameters<typeof EventLandingClient>[0]["sponsors"]}
      profile={profile}
      registration={registration}
    />
  );
}
