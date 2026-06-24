import { notFound } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import {
  getOrganizerProfile,
  getOrganizerEvents,
  getFollowStatus,
} from "@/features/organizers/organizerActions";
import { OrganizerProfileClient } from "./OrganizerProfileClient";

interface PageProps { params: Promise<{ organizerId: string }> }

export default async function OrganizerProfilePage({ params }: PageProps) {
  const { organizerId } = await params;

  const [organizer, events, viewerProfile] = await Promise.all([
    getOrganizerProfile(organizerId),
    getOrganizerEvents(organizerId),
    getProfile().catch(() => null),
  ]);

  if (!organizer) notFound();

  const isFollowing = viewerProfile
    ? await getFollowStatus(organizerId)
    : false;

  return (
    <OrganizerProfileClient
      organizer={organizer}
      events={events}
      viewerProfile={viewerProfile}
      initialIsFollowing={isFollowing}
    />
  );
}
