import { notFound } from "next/navigation";
import { getExhibitorByToken, checkExistingLead } from "@/features/leads/actions";
import { getProfile } from "@/lib/supabase-server";
import { ScanClient } from "./ScanClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ScanPage({ params }: Props) {
  const { token } = await params;

  const exhibitor = await getExhibitorByToken(token);
  if (!exhibitor) notFound();

  const profile = await getProfile();
  const alreadyCheckedIn = profile?.role === "visitor"
    ? await checkExistingLead(exhibitor.id)
    : false;

  return (
    <ScanClient
      exhibitor={exhibitor}
      visitorRole={profile?.role ?? null}
      alreadyCheckedIn={alreadyCheckedIn}
    />
  );
}
