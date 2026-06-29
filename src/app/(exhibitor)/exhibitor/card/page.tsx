import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getAllMyExhibitorProfiles, getAvailableEvents } from "@/features/exhibitors/actions";
import { getExhibitorSurvey } from "@/features/surveys/actions";
import { CardClient } from "./CardClient";

export default async function DigitalCardPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; tab?: string }>;
}) {
  const { id: primaryId, tab: initialTab } = await searchParams;

  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "exhibitor") redirect("/login");

  const exhibitors = await getAllMyExhibitorProfiles();
  const availableEvents = await getAvailableEvents();

  const targetExhibitor = primaryId
    ? (exhibitors.find(e => e.id === primaryId) ?? exhibitors[0] ?? null)
    : exhibitors[0] ?? null;
  const survey = targetExhibitor ? await getExhibitorSurvey(targetExhibitor.id) : null;

  return (
    <CardClient
      profile={profile}
      exhibitors={exhibitors}
      availableEvents={availableEvents}
      initialSurvey={survey}
      primaryId={primaryId ?? null}
      initialTab={initialTab ?? null}
    />
  );
}
