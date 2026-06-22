import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { ExhibitorSettingsClient } from "./ExhibitorSettingsClient";

export default async function ExhibitorSettingsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");
  return <ExhibitorSettingsClient />;
}
