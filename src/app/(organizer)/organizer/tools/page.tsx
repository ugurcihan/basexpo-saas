import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { getGoldenQRsForOrganizer } from "@/features/events/goldenQRActions";
import { OrganizerToolsClient } from "./OrganizerToolsClient";

export default async function ToolsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [goldenQRs, eventsRes] = await Promise.all([
    getGoldenQRsForOrganizer(),
    supabase
      .from("events")
      .select("id, name, halls(id, name, booths(id, code))")
      .eq("organizer_id", profile.id)
      .in("status", ["published", "active"])
      .order("created_at", { ascending: false }),
  ]);

  return (
    <OrganizerToolsClient
      profile={profile}
      goldenQRs={goldenQRs as unknown as Parameters<typeof OrganizerToolsClient>[0]["goldenQRs"]}
      events={(eventsRes.data ?? []) as unknown as Parameters<typeof OrganizerToolsClient>[0]["events"]}
    />
  );
}
