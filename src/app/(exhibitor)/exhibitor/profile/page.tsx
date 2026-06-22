import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getMyExhibitorProfile, getAvailableEvents } from "@/features/exhibitors/actions";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const [exhibitor, events] = await Promise.all([
    getMyExhibitorProfile(),
    getAvailableEvents(),
  ]);

  return <ProfileClient exhibitor={exhibitor} availableEvents={events} />;
}
