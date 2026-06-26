import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { OrganizerDashboard } from "./OrganizerDashboard";

export default async function OrganizerPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: myEventsRaw } = await supabase
    .from("events")
    .select("id, name, status, start_date, end_date")
    .eq("organizer_id", profile.id)
    .order("created_at", { ascending: false });

  const myEvents = myEventsRaw ?? [];
  const eventIds = myEvents.map((e) => e.id);

  const [
    { data: exhibitors },
    { count: visitorCount },
    { count: qrScanCount },
    { count: pendingApprovalCount },
  ] = await Promise.all([
    eventIds.length > 0
      ? supabase.from("exhibitors").select("id").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase.from("event_registrations").select("id", { count: "exact", head: true }).in("event_id", eventIds)
      : Promise.resolve({ count: 0 }),
    eventIds.length > 0
      ? supabase.from("qr_scans").select("id", { count: "exact", head: true }).in("event_id", eventIds)
      : Promise.resolve({ count: 0 }),
    eventIds.length > 0
      ? supabase.from("event_registrations").select("id", { count: "exact", head: true })
          .in("event_id", eventIds).eq("status", "pending")
      : Promise.resolve({ count: 0 }),
  ]);

  return (
    <OrganizerDashboard
      profile={profile}
      events={myEvents}
      pendingApprovals={pendingApprovalCount ?? 0}
      stats={{
        eventCount: myEvents.length,
        exhibitorCount: exhibitors?.length ?? 0,
        qrScanCount: qrScanCount ?? 0,
        visitorCount: visitorCount ?? 0,
      }}
    />
  );
}
