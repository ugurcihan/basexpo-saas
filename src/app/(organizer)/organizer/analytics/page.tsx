import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { OrganizerAnalyticsClient } from "./OrganizerAnalyticsClient";

export default async function OrganizerAnalyticsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, name, status")
    .eq("organizer_id", profile.id);

  const eventIds = (events ?? []).map((e) => e.id);

  const [
    { data: scans },
    { count: registrationCount },
    { data: boothScanGroups },
    { data: exhibitors },
  ] = await Promise.all([
    eventIds.length > 0
      ? supabase.from("qr_scans").select("booth_id, scanned_at, event_id").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase.from("event_registrations").select("id", { count: "exact", head: true }).in("event_id", eventIds)
      : Promise.resolve({ count: 0 }),
    eventIds.length > 0
      ? supabase.from("qr_scans").select("booth_id").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase.from("exhibitors").select("id, company_name, booths(id, code)").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Booth scan count map
  const boothScanCount: Record<string, number> = {};
  (boothScanGroups ?? []).forEach((s) => {
    if (s.booth_id) boothScanCount[s.booth_id] = (boothScanCount[s.booth_id] ?? 0) + 1;
  });

  // Top 5 booths
  const boothIdToCompany: Record<string, string> = {};
  (exhibitors ?? []).forEach((ex) => {
    (ex.booths as { id: string; code: string }[]).forEach((b) => {
      boothIdToCompany[b.id] = `${ex.company_name} (${b.code})`;
    });
  });

  const topBooths = Object.entries(boothScanCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({ label: boothIdToCompany[id] ?? id, count }));

  // Hourly distribution
  const hourly: Record<number, number> = {};
  (scans ?? []).forEach((s) => {
    const h = new Date(s.scanned_at).getHours();
    hourly[h] = (hourly[h] ?? 0) + 1;
  });

  const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourly[h] ?? 0 }));

  return (
    <OrganizerAnalyticsClient
      profile={profile}
      totalScans={scans?.length ?? 0}
      registrationCount={registrationCount ?? 0}
      exhibitorCount={exhibitors?.length ?? 0}
      topBooths={topBooths}
      hourlyData={hourlyData}
      events={events ?? []}
    />
  );
}
