import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { ExhibitorUpcomingFairsClient } from "./ExhibitorUpcomingFairsClient";

export default async function ExhibitorUpcomingFairsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, name, location, start_date, end_date, status, capacity, organizer_id")
    .in("status", ["published", "active"])
    .order("start_date", { ascending: true });

  // Check if exhibitor has a booth in each event
  const { data: myBooths } = await supabase
    .from("booths")
    .select("id, code, hall:halls(event_id)")
    .eq("exhibitor_id", profile.id);

  const myEventIds = new Set(
    (myBooths ?? [])
      .map((b) => (b.hall as unknown as { event_id: string } | null)?.event_id)
      .filter(Boolean)
  );

  return (
    <ExhibitorUpcomingFairsClient
      profile={profile}
      events={events ?? []}
      myEventIds={Array.from(myEventIds) as string[]}
    />
  );
}
