import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getExhibitorMeetingRequests } from "@/features/connections/actions";
import { MeetingRequestsClient } from "./MeetingRequestsClient";

export default async function MeetingRequestsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const requests = await getExhibitorMeetingRequests();

  return <MeetingRequestsClient profile={profile} requests={requests} />;
}
