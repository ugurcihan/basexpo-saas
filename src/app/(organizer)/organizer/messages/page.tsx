import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { getSentNotifications } from "@/features/notifications/notificationActions";
import { OrganizerMessagesClient } from "./OrganizerMessagesClient";

export default async function OrganizerMessagesPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [{ data: events }, sent] = await Promise.all([
    supabase
      .from("events")
      .select("id, name")
      .eq("organizer_id", profile.id)
      .in("status", ["published", "active"])
      .order("created_at", { ascending: false }),
    getSentNotifications(20),
  ]);

  return (
    <OrganizerMessagesClient
      profile={profile}
      events={(events ?? []) as { id: string; name: string }[]}
      sentNotifications={sent as unknown as Parameters<typeof OrganizerMessagesClient>[0]["sentNotifications"]}
    />
  );
}
