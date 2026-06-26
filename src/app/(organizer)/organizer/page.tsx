import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { OrganizerDashboard } from "./OrganizerDashboard";

export default async function OrganizerPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: myEventsRaw } = await supabase
    .from("events")
    .select("id, name, status, start_date, end_date")
    .eq("organizer_id", profile.id)
    .order("created_at", { ascending: false });

  const myEvents = myEventsRaw ?? [];
  const eventIds = myEvents.map((e) => e.id);

  const [
    { data: exhibitors },
    { data: leads },
    { count: visitorCount },
  ] = await Promise.all([
    eventIds.length > 0
      ? supabase.from("exhibitors").select("id").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase.from("leads").select("id, visitor_id").in("exhibitor_id",
          (await supabase.from("exhibitors").select("id").in("event_id", eventIds)).data?.map((e) => e.id) ?? []
        )
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase.from("event_registrations").select("id", { count: "exact", head: true }).in("event_id", eventIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const uniqueVisitors = new Set((leads ?? []).map((r) => r.visitor_id)).size;

  return (
    <OrganizerDashboard
      profile={profile}
      events={myEvents}
      stats={{
        eventCount: myEvents.length,
        exhibitorCount: exhibitors?.length ?? 0,
        leadCount: leads?.length ?? 0,
        visitorCount: visitorCount ?? uniqueVisitors,
      }}
    />
  );
}
