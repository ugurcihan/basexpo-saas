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
  booths: BoothOnMap[];
};

export async function getHallWithMap(hallId: string): Promise<{ hall: HallWithMap | null; error?: string }> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("halls")
    .select(`
      id, name, floor, map_url, map_width, map_height, event_id,
      booths (
        id, code, x_pct, y_pct, width_pct, height_pct, exhibitor_id,
        exhibitors ( company_name, logo_url, tags, description, owner_id )
      )
    `)
    .eq("id", hallId)
    .single();

  if (error) return { hall: null, error: error.message };
  if (!data) return { hall: null, error: "Salon bulunamadı." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapBooth = (b: any): BoothOnMap => ({
    id: b.id,
    code: b.code,
    x_pct: b.x_pct ?? null,
    y_pct: b.y_pct ?? null,
    width_pct: b.width_pct ?? 3,
    height_pct: b.height_pct ?? 3,
    exhibitor_id: b.exhibitor_id ?? null,
    exhibitor: Array.isArray(b.exhibitors) ? (b.exhibitors[0] ?? null) : (b.exhibitors ?? null),
  });

  return {
    hall: {
      ...data,
      booths: (data.booths ?? []).map(mapBooth),
    } as HallWithMap,
  };
}

export async function getEventHallsWithMaps(eventId: string): Promise<HallWithMap[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("halls")
    .select(`
      id, name, floor, map_url, map_width, map_height, event_id,
      booths (
        id, code, x_pct, y_pct, width_pct, height_pct, exhibitor_id,
        exhibitors ( company_name, logo_url, tags, description, owner_id )
      )
    `)
    .eq("event_id", eventId)
    .order("floor", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapBooth2 = (b: any): BoothOnMap => ({
    id: b.id,
    code: b.code,
    x_pct: b.x_pct ?? null,
    y_pct: b.y_pct ?? null,
    width_pct: b.width_pct ?? 3,
    height_pct: b.height_pct ?? 3,
    exhibitor_id: b.exhibitor_id ?? null,
    exhibitor: Array.isArray(b.exhibitors) ? (b.exhibitors[0] ?? null) : (b.exhibitors ?? null),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((h: any) => ({
    id: h.id,
    name: h.name,
    floor: h.floor,
    map_url: h.map_url ?? null,
    map_width: h.map_width ?? null,
    map_height: h.map_height ?? null,
    event_id: h.event_id,
    booths: (h.booths ?? []).map(mapBooth2),
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
