export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getExhibitorByToken, checkExistingLead } from "@/features/leads/actions";
import { getProfile } from "@/lib/supabase-server";
import { getPublicEventRewardTiers, getMyEventTotalPoints } from "@/features/loyalty/actions";
import { getMyActiveSurvey } from "@/features/surveys/actions";
import { ScanClient } from "./ScanClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ScanPage({ params }: Props) {
  const { token } = await params;

  const exhibitor = await getExhibitorByToken(token);
  if (!exhibitor) notFound();

  const profile = await getProfile();
  const ev = Array.isArray(exhibitor.event) ? exhibitor.event[0] : exhibitor.event;
  const eventId = ev?.id ?? (exhibitor as unknown as { event_id?: string }).event_id ?? null;

  const [alreadyCheckedIn, rewardTiers, visitorPoints, survey] = await Promise.all([
    profile?.role === "visitor" ? checkExistingLead(exhibitor.id) : Promise.resolve(false),
    eventId ? getPublicEventRewardTiers(eventId) : Promise.resolve([]),
    profile?.role === "visitor" && eventId ? getMyEventTotalPoints(eventId) : Promise.resolve(0),
    getMyActiveSurvey(exhibitor.id),
  ]);

  return (
    <ScanClient
      exhibitor={exhibitor as Parameters<typeof ScanClient>[0]["exhibitor"]}
      visitorRole={profile?.role ?? null}
      alreadyCheckedIn={alreadyCheckedIn}
      rewardTiers={rewardTiers}
      visitorPoints={visitorPoints}
      survey={survey}
    />
  );
}
