import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getMyMeetings, getMyConnections } from "@/features/connections/actions";
import { MeetingsClient } from "./MeetingsClient";

interface Props {
  searchParams: Promise<{ with?: string; name?: string }>;
}

export default async function MeetingsPage({ searchParams }: Props) {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");

  const params = await searchParams;
  const [meetings, { accepted }] = await Promise.all([
    getMyMeetings(),
    getMyConnections(),
  ]);

  return (
    <MeetingsClient
      profile={profile}
      meetings={meetings}
      connections={accepted}
      preselectedId={params.with}
      preselectedName={params.name}
    />
  );
}
