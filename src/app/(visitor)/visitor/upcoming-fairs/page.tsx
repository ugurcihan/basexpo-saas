import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { UpcomingFairsClient } from "./UpcomingFairsClient";

export default async function UpcomingFairsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, name, location, start_date, end_date, status, capacity, organizer_id")
    .in("status", ["published", "active"])
    .order("start_date", { ascending: true });

  const { data: myRegistrations } = await supabase
    .from("event_registrations")
    .select("event_id, status, ticket_code")
    .eq("visitor_id", profile.id);

  return (
    <UpcomingFairsClient
      profile={profile}
      events={events ?? []}
      myRegistrations={myRegistrations ?? []}
    />
  );
}
