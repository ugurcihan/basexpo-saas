import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getMyNotifications } from "@/features/notifications/notificationActions";
import { ExhibitorMessagesClient } from "./ExhibitorMessagesClient";

export default async function ExhibitorMessagesPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const notifications = await getMyNotifications();

  return (
    <ExhibitorMessagesClient
      profile={profile}
      notifications={notifications as unknown as Parameters<typeof ExhibitorMessagesClient>[0]["notifications"]}
    />
  );
}
