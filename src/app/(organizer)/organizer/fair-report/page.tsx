import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { FairReportClient } from "./FairReportClient";

export default async function FairReportPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  // Get all events by organizer
  const { data: events } = await supabase
    .from("events")
    .select("id, name, status, start_date, end_date, location, capacity, budget_tl")
    .eq("organizer_id", profile.id)
    .order("start_date", { ascending: false });

  // Revenue and exhibitor stats per event
  const { data: exhibitors } = await supabase
    .from("exhibitors")
    .select("event_id, booth_fee_cents, paid_at")
    .in(
      "event_id",
      (events ?? []).map((e) => e.id).filter(Boolean)
    );

  // Registration counts per event
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("event_id")
    .in(
      "event_id",
      (events ?? []).map((e) => e.id).filter(Boolean)
    );

  // Lead counts per event (via qr_scans)
  const { data: scans } = await supabase
    .from("qr_scans")
    .select("event_id")
    .in(
      "event_id",
      (events ?? []).map((e) => e.id).filter(Boolean)
    );

  return (
    <FairReportClient
      profile={profile}
      events={events ?? []}
      exhibitors={exhibitors ?? []}
      registrations={registrations ?? []}
      scans={scans ?? []}
    />
  );
}
