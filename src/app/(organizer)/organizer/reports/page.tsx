import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { OrganizerReportsClient } from "./OrganizerReportsClient";

export default async function ReportsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, name, status, location, start_date, end_date, capacity, halls(id, name, floor, booths(id, code, exhibitor_id))")
    .eq("organizer_id", profile.id)
    .order("created_at", { ascending: false });

  const eventIds = (events ?? []).map((e) => e.id);

  const [scansRes, exhibitorsRes, registrationsRes] = await Promise.all([
    eventIds.length > 0
      ? supabase.from("qr_scans").select("booth_id, scanned_at, event_id").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase.from("exhibitors").select("id, company_name").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase.from("event_registrations").select("id, event_id, status").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
  ]);

  const scans = scansRes.data ?? [];
  const exhibitors = exhibitorsRes.data ?? [];
  const registrations = registrationsRes.data ?? [];

  // Hourly distribution (for analytics tab)
  const hourly: Record<number, number> = {};
  scans.forEach((s) => {
    const h = new Date(s.scanned_at).getHours();
    hourly[h] = (hourly[h] ?? 0) + 1;
  });
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourly[h] ?? 0 }));

  // Top 5 booths — build exhibitor_id→company map, then booth_id→label from events data
  const boothScanCount: Record<string, number> = {};
  scans.forEach((s) => {
    if (s.booth_id) boothScanCount[s.booth_id] = (boothScanCount[s.booth_id] ?? 0) + 1;
  });
  const exhibitorIdToCompany: Record<string, string> = {};
  exhibitors.forEach((ex) => { exhibitorIdToCompany[ex.id] = ex.company_name; });
  const boothIdToCompany: Record<string, string> = {};
  (events ?? []).forEach((ev) => {
    (ev.halls as { booths: { id: string; code: string; exhibitor_id: string | null }[] }[]).forEach((hall) => {
      (hall.booths ?? []).forEach((b) => {
        const company = b.exhibitor_id ? (exhibitorIdToCompany[b.exhibitor_id] ?? "") : "";
        boothIdToCompany[b.id] = company ? `${company} (${b.code})` : b.code;
      });
    });
  });
  const topBooths = Object.entries(boothScanCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({ label: boothIdToCompany[id] ?? id, count }));

  return (
    <OrganizerReportsClient
      profile={profile}
      events={(events ?? []) as unknown as Parameters<typeof OrganizerReportsClient>[0]["events"]}
      scans={scans as unknown as Parameters<typeof OrganizerReportsClient>[0]["scans"]}
      exhibitorCount={exhibitors.length}
      registrationCount={registrations.length}
      topBooths={topBooths}
      hourlyData={hourlyData}
      registrations={(registrations ?? []) as unknown as Parameters<typeof OrganizerReportsClient>[0]["registrations"]}
    />
  );
}
