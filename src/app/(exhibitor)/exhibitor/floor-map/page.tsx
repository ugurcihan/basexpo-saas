import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { getEventHallsWithMaps } from "@/features/events/hallMapActions";
import { FloorMapPageClient } from "./FloorMapPageClient";

export default async function ExhibitorFloorMapPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  // Find the exhibitor's current / most recent event
  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("event_id, company_name")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let halls: Awaited<ReturnType<typeof getEventHallsWithMaps>> = [];
  let eventName = "";

  if (exhibitor?.event_id) {
    halls = await getEventHallsWithMaps(exhibitor.event_id);

    const { data: event } = await supabase
      .from("events")
      .select("name")
      .eq("id", exhibitor.event_id)
      .single();

    eventName = event?.name ?? "";
  }

  return (
    <FloorMapPageClient
      profile={profile}
      halls={halls}
      eventName={eventName}
      currentUserId={profile.id}
    />
  );
}
