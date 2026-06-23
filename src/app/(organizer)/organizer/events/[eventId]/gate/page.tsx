import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { getCheckins } from "@/features/events/checkinActions";
import { GateClient } from "./GateClient";

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function GatePage({ params }: Props) {
  const { eventId } = await params;

  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, organizer_id")
    .eq("id", eventId)
    .single();

  if (!event || event.organizer_id !== profile.id) redirect("/organizer/events");

  const checkins = await getCheckins(eventId);

  return <GateClient eventId={eventId} eventTitle={event.name} checkins={checkins} />;
}
