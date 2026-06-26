import { notFound } from "next/navigation";
import { getExhibitorByToken, checkExistingLead } from "@/features/leads/actions";
import { getProfile } from "@/lib/supabase-server";
import { getPublicEventRewardTiers, getMyEventTotalPoints } from "@/features/loyalty/actions";
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

  const [alreadyCheckedIn, rewardTiers, visitorPoints] = await Promise.all([
    profile?.role === "visitor" ? checkExistingLead(exhibitor.id) : Promise.resolve(false),
    ev ? getPublicEventRewardTiers(ev.id) : Promise.resolve([]),
    profile?.role === "visitor" && ev ? getMyEventTotalPoints(ev.id) : Promise.resolve(0),
  ]);

  return (
    <ScanClient
      exhibitor={exhibitor}
      visitorRole={profile?.role ?? null}
      alreadyCheckedIn={alreadyCheckedIn}
      rewardTiers={rewardTiers}
      visitorPoints={visitorPoints}
    />
  );
}
