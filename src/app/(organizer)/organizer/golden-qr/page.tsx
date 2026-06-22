import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { getGoldenQRsForOrganizer } from "@/features/events/goldenQRActions";
import { GoldenQRClient } from "./GoldenQRClient";

export default async function GoldenQRPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [goldenQRs, { data: events }] = await Promise.all([
    getGoldenQRsForOrganizer(),
    supabase
      .from("events")
      .select("id, name, halls(id, name, booths(id, code))")
      .eq("organizer_id", profile.id)
      .in("status", ["published", "active"])
      .order("created_at", { ascending: false }),
  ]);

  return (
    <GoldenQRClient
      profile={profile}
      goldenQRs={goldenQRs as unknown as Parameters<typeof GoldenQRClient>[0]["goldenQRs"]}
      events={(events ?? []) as unknown as Parameters<typeof GoldenQRClient>[0]["events"]}
    />
  );
}
