import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { OrganizerSettingsClient } from "./OrganizerSettingsClient";

export default async function OrganizerSettingsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");
  return <OrganizerSettingsClient />;
}
