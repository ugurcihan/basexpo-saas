import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getHallWithMap, getEventExhibitors } from "@/features/events/hallMapActions";
import { MapEditorClient } from "./MapEditorClient";

interface Props {
  params: Promise<{ hallId: string }>;
}

export default async function MapEditorPage({ params }: Props) {
  const { hallId } = await params;

  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");

  const { hall, error } = await getHallWithMap(hallId);
  if (error || !hall) redirect("/organizer/events");

  const exhibitors = await getEventExhibitors(hall.event_id);

  return <MapEditorClient profile={profile} hall={hall} exhibitors={exhibitors} />;
}
