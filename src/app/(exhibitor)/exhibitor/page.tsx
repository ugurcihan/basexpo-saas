import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getExhibitorDashboardStats } from "@/features/exhibitors/actions";
import { ExhibitorDashboard } from "./ExhibitorDashboard";

export default async function ExhibitorPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "exhibitor") redirect("/login");

  const stats = await getExhibitorDashboardStats();
  return <ExhibitorDashboard profile={profile} stats={stats} />;
}
