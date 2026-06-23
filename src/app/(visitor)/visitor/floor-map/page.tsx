import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { getEventHallsWithMaps } from "@/features/events/hallMapActions";
import { VisitorFloorMapClient } from "./VisitorFloorMapClient";

export default async function VisitorFloorMapPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  // Most recent event the visitor is registered for
  const { data: reg } = await supabase
    .from("event_registrations")
    .select("event_id, events(title)")
    .eq("visitor_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let halls: Awaited<ReturnType<typeof getEventHallsWithMaps>> = [];
  let eventName = "";

  if (reg?.event_id) {
    halls = await getEventHallsWithMaps(reg.event_id);
    const eventData = reg.events as { title?: string } | null;
    eventName = eventData?.title ?? "";
  }

  return (
    <VisitorFloorMapClient
      profile={profile}
      halls={halls}
      eventName={eventName}
    />
  );
}
