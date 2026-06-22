import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { BoothTrackingClient } from "./BoothTrackingClient";

export default async function BoothTrackingPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: events } = await supabase
    .from("events")
    .select(`
      id, name, status,
      halls(
        id, name, floor,
        booths(id, code, exhibitor_id)
      )
    `)
    .eq("organizer_id", profile.id)
    .order("start_date", { ascending: false });

  // Tüm event id'leri
  const eventIds = (events ?? []).map((e) => e.id);

  // QR scan sayıları — booth bazında
  const { data: scans } = eventIds.length > 0
    ? await supabase
        .from("qr_scans")
        .select("booth_id, scanned_at")
        .in("event_id", eventIds)
    : { data: [] };

  return (
    <BoothTrackingClient
      profile={profile}
      events={(events ?? []) as unknown as Parameters<typeof BoothTrackingClient>[0]["events"]}
      scans={(scans ?? []) as { booth_id: string | null; scanned_at: string }[]}
    />
  );
}
