import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { VisitorDashboard } from "./VisitorDashboard";

export default async function VisitorPage() {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "visitor") redirect("/login");

  return <VisitorDashboard profile={profile} />;
}
