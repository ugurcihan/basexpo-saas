import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { OrganizerVisitorsClient } from "./OrganizerVisitorsClient";

export default async function OrganizerVisitorsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  // Get organizer's events
  const { data: events } = await supabase
    .from("events")
    .select("id, name")
    .eq("organizer_id", profile.id);

  const eventIds = (events ?? []).map((e) => e.id);

  const { data: registrations } = eventIds.length > 0
    ? await supabase
        .from("event_registrations")
        .select("id, status, ticket_code, created_at, event:events(id, name), visitor:profiles(id, full_name, email)")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <OrganizerVisitorsClient
      profile={profile}
      registrations={(registrations ?? []) as unknown as Parameters<typeof OrganizerVisitorsClient>[0]["registrations"]}
    />
  );
}
