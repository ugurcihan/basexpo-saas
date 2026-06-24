"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export type BoothOnMap = {
  id: string;
  code: string;
  x_pct: number | null;
  y_pct: number | null;
  width_pct: number;
  height_pct: number;
  exhibitor_id: string | null;
  exhibitor?: {
    company_name: string;
    logo_url: string | null;
    tags: string[];
    description: string | null;
    owner_id: string;
  } | null;
};

export type HallWithMap = {
  id: string;
  name: string;
  floor: number;
  map_url: string | null;
  map_width: number | null;
  map_height: number | null;
  event_id: string;
  entrance_x: number | null;
  entrance_y: number | null;
  exit_x: number | null;
  exit_y: number | null;
  booths: BoothOnMap[];
};

type ExhibitorData = { owner_id: string; company_name: string; logo_url: string | null; tags: string[]; description: string | null };

async function fetchExhibitorMap(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, profileIds: string[]): Promise<Record<string, ExhibitorData>> {
  if (profileIds.length === 0) return {};
  const { data } = await supabase
    .from("exhibitors")
    .select("owner_id, company_name, logo_url, tags, description")
    .in("owner_id", profileIds);
  const map: Record<string, ExhibitorData> = {};
  (data ?? []).forEach((e: ExhibitorData) => { map[e.owner_id] = e; });
  return map;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBoothWithExhibitor(b: any, exhibitorMap: Record<string, ExhibitorData>): BoothOnMap {
  return {
    id: b.id,
    code: b.code,
    x_pct: b.x_pct ?? null,
    y_pct: b.y_pct ?? null,
    width_pct: b.width_pct ?? 3,
    height_pct: b.height_pct ?? 3,
    exhibitor_id: b.exhibitor_id ?? null,
    exhibitor: b.exhibitor_id ? (exhibitorMap[b.exhibitor_id] ?? null) : null,
  };
}

export async function getHallWithMap(hallId: string): Promise<{ hall: HallWithMap | null; error?: string }> {
  const supabase = await createSupabaseServerClient();

  // booths.exhibitor_id → profiles.id (not exhibitors.id), so we cannot use nested join
  const { data, error } = await supabase
    .from("halls")
    .select(`
      id, name, floor, map_url, map_width, map_height, event_id,
      entrance_x, entrance_y, exit_x, exit_y,
      booths (id, code, x_pct, y_pct, width_pct, height_pct, exhibitor_id)
    `)
    .eq("id", hallId)
    .single();

  if (error) return { hall: null, error: error.message };
  if (!data) return { hall: null, error: "Salon bulunamadı." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const occupiedIds = (data.booths ?? []).filter((b: any) => b.exhibitor_id).map((b: any) => b.exhibitor_id as string);
  const exhibitorMap = await fetchExhibitorMap(supabase, occupiedIds);

  return {
    hall: {
      ...data,
      entrance_x: (data as Record<string, unknown>).entrance_x as number | null ?? null,
      entrance_y: (data as Record<string, unknown>).entrance_y as number | null ?? null,
      exit_x: (data as Record<string, unknown>).exit_x as number | null ?? null,
      exit_y: (data as Record<string, unknown>).exit_y as number | null ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      booths: (data.booths ?? []).map((b: any) => mapBoothWithExhibitor(b, exhibitorMap)),
    } as HallWithMap,
  };
}

export async function getEventHallsWithMaps(eventId: string): Promise<HallWithMap[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("halls")
    .select(`
      id, name, floor, map_url, map_width, map_height, event_id,
      entrance_x, entrance_y, exit_x, exit_y,
      booths (id, code, x_pct, y_pct, width_pct, height_pct, exhibitor_id)
    `)
    .eq("event_id", eventId)
    .order("floor", { ascending: true });

  // Collect all occupying profile IDs across all halls
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allProfileIds = [...new Set((data ?? []).flatMap((h: any) =>
    (h.booths ?? []).filter((b: any) => b.exhibitor_id).map((b: any) => b.exhibitor_id as string)
  ))];
  const exhibitorMap = await fetchExhibitorMap(supabase, allProfileIds);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((h: any) => ({
    id: h.id,
    name: h.name,
    floor: h.floor,
    map_url: h.map_url ?? null,
    map_width: h.map_width ?? null,
    map_height: h.map_height ?? null,
    event_id: h.event_id,
    entrance_x: h.entrance_x ?? null,
    entrance_y: h.entrance_y ?? null,
    exit_x: h.exit_x ?? null,
    exit_y: h.exit_y ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    booths: (h.booths ?? []).map((b: any) => mapBoothWithExhibitor(b, exhibitorMap)),
  })) as HallWithMap[];
}

export async function updateHallMap(
  hallId: string,
  mapUrl: string,
  mapWidth: number,
  mapHeight: number,
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase
    .from("halls")
    .update({ map_url: mapUrl, map_width: mapWidth, map_height: mapHeight })
    .eq("id", hallId);

  if (error) return { error: error.message };

  revalidatePath("/organizer/events");
  return { success: true };
}

export async function updateBoothPositions(
  positions: { boothId: string; x_pct: number; y_pct: number }[],
  eventId: string,
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const updates = positions.map(({ boothId, x_pct, y_pct }) =>
    supabase
      .from("booths")
      .update({ x_pct, y_pct })
      .eq("id", boothId)
  );

  await Promise.all(updates);

  revalidatePath(`/organizer/events/${eventId}`);
  revalidatePath("/exhibitor/floor-map");
  revalidatePath("/visitor/floor-map");
  return { success: true };
}

export type ExhibitorOption = {
  profile_id: string;
  company_name: string;
  logo_url: string | null;
};

export async function getEventExhibitors(eventId: string): Promise<ExhibitorOption[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("exhibitors")
    .select("owner_id, company_name, logo_url")
    .eq("event_id", eventId)
    .order("company_name");

  return (data ?? []).map(e => ({
    profile_id: e.owner_id,
    company_name: e.company_name,
    logo_url: e.logo_url ?? null,
  }));
}

export async function assignExhibitorToBooth(
  boothId: string,
  exhibitorProfileId: string | null,
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase
    .from("booths")
    .update({ exhibitor_id: exhibitorProfileId })
    .eq("id", boothId);

  if (error) return { error: error.message };

  revalidatePath("/organizer/events");
  revalidatePath("/exhibitor/floor-map");
  revalidatePath("/visitor/floor-map");
  return { success: true };
}

export async function updateEntranceExit(
  hallId: string,
  entrance_x: number | null,
  entrance_y: number | null,
  exit_x: number | null,
  exit_y: number | null,
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase
    .from("halls")
    .update({ entrance_x, entrance_y, exit_x, exit_y })
    .eq("id", hallId);

  if (error) return { error: error.message };

  revalidatePath("/organizer/events");
  revalidatePath("/exhibitor/floor-map");
  revalidatePath("/visitor/floor-map");
  return { success: true };
}
