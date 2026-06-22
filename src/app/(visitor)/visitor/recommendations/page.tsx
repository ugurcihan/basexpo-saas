import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getAIRecommendations } from "@/features/ai/actions";
import { RecommendationsClient } from "./RecommendationsClient";

export default async function RecommendationsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");

  const { recommendations, error, hasEmbedding } = await getAIRecommendations();

  return (
    <RecommendationsClient
      profile={profile}
      recommendations={recommendations}
      hasEmbedding={hasEmbedding}
      serverError={error}
    />
  );
}
