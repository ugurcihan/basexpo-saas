import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { getExhibitorMeetingRequests } from "@/features/connections/actions";
import { FairsClient } from "./FairsClient";

export default async function FairsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [
    { data: myExhibitors },
    { data: upcomingEvents },
    meetingRequests,
  ] = await Promise.all([
    supabase
      .from("exhibitors")
      .select(`
        id, company_name, qr_token,
        event:events(id, name, location, start_date, end_date, status),
        booths:booths(id, code)
      `)
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, name, location, start_date, end_date, status, capacity")
      .in("status", ["published", "active"])
      .order("start_date", { ascending: true }),
    getExhibitorMeetingRequests(),
  ]);

  return (
    <FairsClient
      profile={profile}
      myExhibitors={myExhibitors ?? []}
      upcomingEvents={upcomingEvents ?? []}
      meetingRequests={meetingRequests}
    />
  );
}
