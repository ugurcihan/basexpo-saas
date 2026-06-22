import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getOrganizerEvents } from "@/features/events/actions";
import { EventsClient } from "./EventsClient";

export default async function EventsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const events = await getOrganizerEvents();

  return <EventsClient events={events} />;
}
