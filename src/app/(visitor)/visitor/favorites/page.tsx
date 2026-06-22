import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { FavoritesClient } from "./FavoritesClient";

export default async function FavoritesPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");
  return <FavoritesClient profile={profile} />;
}
