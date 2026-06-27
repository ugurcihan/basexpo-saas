import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { ParticipantsClient } from "./ParticipantsClient";

export default async function ParticipantsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: myEvents } = await supabase
    .from("events")
    .select("id, name")
    .eq("organizer_id", profile.id);

  const eventIds = (myEvents ?? []).map((e) => e.id);

  const [visitorsRes, firmsRes] = await Promise.all([
    eventIds.length > 0
      ? supabase
          .from("event_registrations")
          .select(`
            id, status, ticket_code, created_at,
            event:events(id, name),
            visitor:profiles!event_registrations_visitor_id_fkey(id, full_name, email, phone_number)
          `)
          .in("event_id", eventIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase
          .from("exhibitors")
          .select("id, company_name, tags, created_at, contact_email, city, status, event:events(id, name), booths(id, code), owner:profiles!exhibitors_owner_id_fkey(full_name, email, phone_number)")
          .in("event_id", eventIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <ParticipantsClient
      profile={profile}
      visitors={(visitorsRes.data ?? []) as unknown as Parameters<typeof ParticipantsClient>[0]["visitors"]}
      firms={(firmsRes.data ?? []) as unknown as Parameters<typeof ParticipantsClient>[0]["firms"]}
    />
  );
}
