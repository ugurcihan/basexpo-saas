import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getAllMyExhibitorProfiles, getAvailableEvents } from "@/features/exhibitors/actions";
import { getExhibitorSurvey } from "@/features/surveys/actions";
import { CardClient } from "./CardClient";

export default async function DigitalCardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "exhibitor") redirect("/login");

  const exhibitors = await getAllMyExhibitorProfiles();
  const availableEvents = await getAvailableEvents();

  const primaryExhibitor = exhibitors[0] ?? null;
  const survey = primaryExhibitor ? await getExhibitorSurvey(primaryExhibitor.id) : null;

  return (
    <CardClient
      profile={profile}
      exhibitors={exhibitors}
      availableEvents={availableEvents}
      initialSurvey={survey}
    />
  );
}
