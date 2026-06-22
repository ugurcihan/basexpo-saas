import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { OrganizerDashboard } from "./OrganizerDashboard";

export default async function OrganizerPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  // Fetch exhibitor IDs for this organizer's events
  const { data: myExhibitors } = await supabase
    .from("exhibitors")
    .select("id, paid_at, booth_fee_cents, event_id")
    .in(
      "event_id",
      (
        await supabase
          .from("events")
          .select("id")
          .eq("organizer_id", profile.id)
      ).data?.map((e) => e.id) ?? []
    );

  const exhibitorIds = myExhibitors?.map((e) => e.id) ?? [];

  const [{ count: eventCount }, { data: leadRows }] = await Promise.all([
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("organizer_id", profile.id),
    exhibitorIds.length > 0
      ? supabase.from("leads").select("id, visitor_id").in("exhibitor_id", exhibitorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const paidCount = myExhibitors?.filter((e) => e.paid_at).length ?? 0;
  const totalRevenueCents =
    myExhibitors?.filter((e) => e.paid_at).reduce((s, e) => s + (e.booth_fee_cents ?? 0), 0) ?? 0;
  const uniqueVisitors = new Set((leadRows ?? []).map((r) => r.visitor_id)).size;

  return (
    <OrganizerDashboard
      profile={profile}
      stats={{
        eventCount: eventCount ?? 0,
        exhibitorCount: myExhibitors?.length ?? 0,
        paidCount,
        totalRevenueCents,
        leadCount: leadRows?.length ?? 0,
        visitorCount: uniqueVisitors,
      }}
    />
  );
}
