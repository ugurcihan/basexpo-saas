export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getBoothByQrToken } from "@/features/leads/actions";
import { getProfile } from "@/lib/supabase-server";
import { getPublicEventRewardTiers } from "@/features/loyalty/actions";
import { BoothScanClient } from "./BoothScanClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function BoothScanPage({ params }: Props) {
  const { token } = await params;

  const booth = await getBoothByQrToken(token);
  if (!booth) notFound();

  const profile = await getProfile();

  const hall = booth.hall as unknown as { id: string; name: string; event_id: string; event: { id: string; name: string; location: string; start_date: string; end_date: string; gallery_urls?: string[] } | null } | null;
  const exhibitor = booth.exhibitor as unknown as { id: string; company_name: string; description: string; logo_url: string | null; tags: string[]; products: { id: string; name: string; description: string; image_url: string | null }[] } | null;

  const eventId = hall?.event_id ?? null;
  const rewardTiers = eventId ? await getPublicEventRewardTiers(eventId) : [];

  return (
    <BoothScanClient
      boothId={booth.id}
      boothCode={booth.code}
      qrToken={booth.qr_token}
      event={hall?.event ?? null}
      exhibitor={exhibitor}
      visitorRole={profile?.role ?? null}
      rewardTiers={rewardTiers}
      visitorPoints={0}
    />
  );
}
