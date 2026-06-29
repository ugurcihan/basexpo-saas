import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { getExhibitorMeetingRequests } from "@/features/connections/actions";
import { getMyInvitations } from "@/features/exhibitors/actions";
import { FairsClient } from "./FairsClient";

export default async function FairsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [
    { data: myExhibitors },
    { data: upcomingEvents },
    meetingRequests,
    invitations,
  ] = await Promise.all([
    supabase
      .from("exhibitors")
      .select(`
        id, company_name, qr_token, status,
        event:events(id, name, location, start_date, end_date, status)
      `)
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select(`
        id, name, location, start_date, end_date, status, capacity,
        description, cover_url, category,
        organizer:profiles!events_organizer_id_fkey(full_name, email)
      `)
      .in("status", ["published", "active"])
      .order("start_date", { ascending: true }),
    getExhibitorMeetingRequests(),
    getMyInvitations(),
  ]);

  return (
    <FairsClient
      profile={profile}
      myExhibitors={myExhibitors ?? []}
      upcomingEvents={upcomingEvents ?? []}
      meetingRequests={meetingRequests}
      invitations={invitations}
    />
  );
}
