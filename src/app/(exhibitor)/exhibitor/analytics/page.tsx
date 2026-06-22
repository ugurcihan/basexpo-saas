import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { ExhibitorAnalyticsClient } from "./ExhibitorAnalyticsClient";

export default async function ExhibitorAnalyticsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("id, event_id, booths(id)")
    .eq("owner_id", profile.id)
    .maybeSingle();

  const exhibitorId = exhibitor?.id;
  const boothId = (exhibitor?.booths as { id: string }[] | null)?.[0]?.id;

  const [
    { count: totalLeads },
    { data: scans },
    { data: leads },
    { count: productCount },
  ] = await Promise.all([
    exhibitorId
      ? supabase.from("leads").select("id", { count: "exact", head: true }).eq("exhibitor_id", exhibitorId)
      : Promise.resolve({ count: 0 }),
    boothId
      ? supabase.from("qr_scans").select("scanned_at").eq("booth_id", boothId)
      : Promise.resolve({ data: [] }),
    exhibitorId
      ? supabase.from("leads").select("visitor:profiles(interests)").eq("exhibitor_id", exhibitorId)
      : Promise.resolve({ data: [] }),
    exhibitorId
      ? supabase.from("exhibitor_products").select("id", { count: "exact", head: true }).eq("exhibitor_id", exhibitorId)
      : Promise.resolve({ count: 0 }),
  ]);

  const hourly: Record<number, number> = {};
  (scans ?? []).forEach((s) => {
    const h = new Date(s.scanned_at).getHours();
    hourly[h] = (hourly[h] ?? 0) + 1;
  });
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourly[h] ?? 0 }));

  const now = new Date();
  const todayScans = (scans ?? []).filter((s) => new Date(s.scanned_at).toDateString() === now.toDateString()).length;
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
  const weekScans = (scans ?? []).filter((s) => new Date(s.scanned_at) >= weekStart).length;

  const tagCounts: Record<string, number> = {};
  (leads ?? []).forEach((lead) => {
    const interests = (lead.visitor as { interests?: string[] } | null)?.interests ?? [];
    interests.forEach((tag) => { tagCounts[tag] = (tagCounts[tag] ?? 0) + 1; });
  });
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));

  return (
    <ExhibitorAnalyticsClient
      profile={profile}
      totalLeads={totalLeads ?? 0}
      totalScans={scans?.length ?? 0}
      todayScans={todayScans}
      weekScans={weekScans}
      productCount={productCount ?? 0}
      hourlyData={hourlyData}
      topTags={topTags}
    />
  );
}
