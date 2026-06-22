import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { TicketsClient } from "./TicketsClient";

export default async function TicketsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("id, status, ticket_code, created_at, event:events(id, name, location, start_date, end_date)")
    .eq("visitor_id", profile.id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <TicketsClient profile={profile} registrations={(registrations ?? []) as any} />;
}
