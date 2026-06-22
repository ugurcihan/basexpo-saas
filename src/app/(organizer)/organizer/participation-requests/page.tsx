import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { ParticipationRequestsClient } from "./ParticipationRequestsClient";

export default async function ParticipationRequestsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, name")
    .eq("organizer_id", profile.id);

  const eventIds = (events ?? []).map((e) => e.id);

  const { data: exhibitors } = eventIds.length > 0
    ? await supabase
        .from("exhibitors")
        .select("id, company_name, tags, created_at, event:events(id, name), booths(id, code)")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <ParticipationRequestsClient
      profile={profile}
      exhibitors={(exhibitors ?? []) as unknown as Parameters<typeof ParticipationRequestsClient>[0]["exhibitors"]}
    />
  );
}
