import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import {
  getAIRecommendations,
  getAIEventRecommendations,
} from "@/features/ai/actions";
import { getMyFavoriteIds } from "@/features/favorites/actions";
import { RecommendationsClient } from "./RecommendationsClient";

export default async function RecommendationsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");

  const [
    { recommendations, error, hasEmbedding },
    { events: eventRecommendations },
    favoriteIds,
  ] = await Promise.all([
    getAIRecommendations(),
    getAIEventRecommendations(),
    getMyFavoriteIds(),
  ]);

  return (
    <RecommendationsClient
      profile={profile}
      recommendations={recommendations}
      hasEmbedding={hasEmbedding}
      serverError={error}
      eventRecommendations={eventRecommendations}
      favoriteIds={favoriteIds}
    />
  );
}
