import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getLeadConversions } from "@/features/leads/roiActions";
import { getExhibitorMeetingRequests } from "@/features/connections/actions";
import { PipelineClient } from "./PipelineClient";

export default async function PipelinePage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const [{ conversions }, meetings] = await Promise.all([
    getLeadConversions(),
    getExhibitorMeetingRequests(),
  ]);

  return <PipelineClient profile={profile} conversions={conversions} meetings={meetings} />;
}
