import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getMyLoyaltyStats, getVisitorEventsWithPoints } from "@/features/loyalty/actions";
import { LoyaltyClient } from "./LoyaltyClient";

export default async function LoyaltyPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");

  const { event: eventId } = await searchParams;

  const eventsWithPoints = await getVisitorEventsWithPoints();

  // Seçili fuar yoksa en son fuar
  const selectedEventId = eventId ?? eventsWithPoints[0]?.event_id ?? null;

  const stats = selectedEventId
    ? await getMyLoyaltyStats(selectedEventId)
    : null;

  return (
    <LoyaltyClient
      profile={profile}
      eventsWithPoints={eventsWithPoints}
      selectedEventId={selectedEventId}
      stats={stats}
    />
  );
}
