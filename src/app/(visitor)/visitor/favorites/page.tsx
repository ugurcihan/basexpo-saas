import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getMyFavorites } from "@/features/favorites/actions";
import { FavoritesClient } from "./FavoritesClient";

export default async function FavoritesPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");

  const favorites = await getMyFavorites();

  return <FavoritesClient profile={profile} favorites={favorites} />;
}
