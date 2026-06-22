import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { VisitorSettingsClient } from "./VisitorSettingsClient";

export default async function VisitorSettingsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");
  return <VisitorSettingsClient profile={profile} />;
}
