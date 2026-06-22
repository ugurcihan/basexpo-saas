import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { ExhibitorDashboard } from "./ExhibitorDashboard";

export default async function ExhibitorPage() {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "exhibitor") redirect("/login");

  return <ExhibitorDashboard profile={profile} />;
}
