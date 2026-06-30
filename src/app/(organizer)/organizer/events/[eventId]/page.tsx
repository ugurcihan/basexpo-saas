import { redirect, notFound } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { getEventWithHalls } from "@/features/events/actions";
import { getEventSponsors } from "@/features/events/sponsorActions";
import { EventDetailClient } from "./EventDetailClient";

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { eventId } = await params;
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const event = await getEventWithHalls(eventId);
  if (!event) notFound();

  if (event.organizer_id !== profile.id) redirect("/organizer/events");

  const supabase = await createSupabaseServerClient();
  const [sponsors, { data: exhibitors }] = await Promise.all([
    getEventSponsors(eventId),
    supabase
      .from("exhibitors")
      .select("id, company_name")
      .eq("event_id", eventId)
      .eq("status", "approved")
      .order("company_name"),
  ]);

  return (
    <EventDetailClient
      event={event as unknown as Parameters<typeof EventDetailClient>[0]["event"]}
      sponsors={sponsors as unknown as Parameters<typeof EventDetailClient>[0]["sponsors"]}
      eventExhibitors={exhibitors ?? []}
    />
  );
}
