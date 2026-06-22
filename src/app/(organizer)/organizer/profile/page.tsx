import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { OrganizerProfileClient } from "./OrganizerProfileClient";

export default async function OrganizerProfilePage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");
  return <OrganizerProfileClient profile={profile} />;
}
