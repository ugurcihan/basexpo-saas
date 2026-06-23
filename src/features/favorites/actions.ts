"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export interface FavoriteExhibitor {
  id: string;
  exhibitor_id: string;
  created_at: string;
  exhibitor: {
    id: string;
    company_name: string;
    description: string | null;
    logo_url: string | null;
    tags: string[];
    qr_token: string;
    event_id: string | null;
    event_name: string | null;
    event_location: string | null;
    owner_id: string;
  };
}

export async function addFavorite(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase.from("favorites").insert({
    visitor_id: user.id,
    exhibitor_id: exhibitorId,
  });

  if (error) {
    if (error.code === "23505") return { error: null }; // already favorited
    return { error: error.message };
  }

  revalidatePath("/visitor/favorites");
  revalidatePath("/visitor/recommendations");
  return { error: null };
}

export async function removeFavorite(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("visitor_id", user.id)
    .eq("exhibitor_id", exhibitorId);

  if (error) return { error: error.message };

  revalidatePath("/visitor/favorites");
  revalidatePath("/visitor/recommendations");
  return { error: null };
}

export async function getMyFavorites(): Promise<FavoriteExhibitor[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("favorites")
    .select(`
      id, exhibitor_id, created_at,
      exhibitor:exhibitors(
        id, company_name, description, logo_url, tags, qr_token, event_id, owner_id,
        event:events(name, location)
      )
    `)
    .eq("visitor_id", user.id)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((row) => {
    const ex = Array.isArray(row.exhibitor) ? row.exhibitor[0] : row.exhibitor;
    const evt = ex?.event ? (Array.isArray(ex.event) ? ex.event[0] : ex.event) : null;
    return {
      id: row.id,
      exhibitor_id: row.exhibitor_id,
      created_at: row.created_at,
      exhibitor: {
        id: ex?.id ?? "",
        company_name: ex?.company_name ?? "",
        description: ex?.description ?? null,
        logo_url: ex?.logo_url ?? null,
        tags: ex?.tags ?? [],
        qr_token: ex?.qr_token ?? "",
        event_id: ex?.event_id ?? null,
        event_name: evt?.name ?? null,
        event_location: evt?.location ?? null,
        owner_id: ex?.owner_id ?? "",
      },
    };
  });
}

export async function getMyFavoriteIds(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("favorites")
    .select("exhibitor_id")
    .eq("visitor_id", user.id);

  return (data ?? []).map((r) => r.exhibitor_id);
}
