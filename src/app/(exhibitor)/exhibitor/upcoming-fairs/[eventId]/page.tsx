import { redirect, notFound } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { FairDetailClient } from "@/app/(visitor)/visitor/upcoming-fairs/[eventId]/FairDetailClient";

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function ExhibitorFairDetailPage({ params }: Props) {
  const { eventId } = await params;
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [{ data: event }, { data: sponsorsRaw }, { data: participantsRaw }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, description, location, start_date, end_date, status, capacity, cover_url, gallery_urls, maps_url, youtube_url, social_links, tags, category")
      .eq("id", eventId)
      .in("status", ["published", "active", "ended"])
      .single(),
    supabase
      .from("event_sponsors")
      .select("id, tier, tier_name, exhibitor:exhibitors(id, company_name, logo_url, tags)")
      .eq("event_id", eventId)
      .order("tier"),
    supabase
      .from("exhibitors")
      .select("id, company_name, tags, booths(code, hall:halls(name))")
      .eq("event_id", eventId),
  ]);

  if (!event) notFound();

  return (
    <FairDetailClient
      role="exhibitor"
      userName={profile.full_name || profile.email}
      event={event as unknown as Parameters<typeof FairDetailClient>[0]["event"]}
      sponsors={(sponsorsRaw ?? []) as unknown as Parameters<typeof FairDetailClient>[0]["sponsors"]}
      participants={(participantsRaw ?? []) as unknown as Parameters<typeof FairDetailClient>[0]["participants"]}
      backHref="/exhibitor/upcoming-fairs"
    />
  );
}
