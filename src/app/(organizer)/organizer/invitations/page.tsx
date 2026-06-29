import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { InvitationsClient } from "./InvitationsClient";

export default async function InvitationsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [
    { data: myEvents },
    { data: allExhibitors },
    { data: sentInvitations },
  ] = await Promise.all([
    // Organizatörün etkinlikleri
    supabase
      .from("events")
      .select("id, name, start_date, location, status")
      .eq("organizer_id", profile.id)
      .in("status", ["published", "active", "draft"])
      .order("start_date", { ascending: false }),

    // Tüm approved exhibitor profilleri (firma keşfetmek için)
    supabase
      .from("exhibitors")
      .select(`
        id, company_name, city, tags,
        owner:profiles!exhibitors_owner_id_fkey(id, full_name, email)
      `)
      .eq("status", "approved")
      .not("event_id", "is", null)
      .order("company_name"),

    // Organizatörün gönderdiği davetler
    supabase
      .from("exhibitor_invitations")
      .select(`
        id, event_id, to_user_id, message, status, created_at,
        event:events(id, name),
        to_user:profiles!exhibitor_invitations_to_user_id_fkey(full_name, email)
      `)
      .eq("from_organizer_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <InvitationsClient
      profile={profile}
      myEvents={myEvents ?? []}
      allExhibitors={allExhibitors ?? []}
      sentInvitations={sentInvitations ?? []}
    />
  );
}
