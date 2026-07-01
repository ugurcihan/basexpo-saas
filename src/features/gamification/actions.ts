"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// ── Tipler ──────────────────────────────────────────────────

export type LootBoxType = {
  id: string;
  event_id: string;
  name: string;
  tier: "common" | "rare" | "epic";
  points_required: number;
  prob_common: number;
  prob_rare: number;
  prob_epic: number;
  prob_legendary: number;
};

export type LootReward = {
  id: string;
  event_id: string;
  tier: "common" | "rare" | "epic" | "legendary";
  name: string;
  description: string | null;
  image_url: string | null;
  total_stock: number | null;
  claimed_count: number;
  weight: number;
  is_active: boolean;
};

// ── Yetki kontrolü ──────────────────────────────────────────

async function assertOrganizer(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "Giriş yapmalısın." };
  const { data: event } = await supabase
    .from("events").select("id").eq("id", eventId).eq("organizer_id", user.id).single();
  if (!event) return { supabase: null, error: "Bu fuarı yönetme yetkin yok." };
  return { supabase, error: null };
}

// ── Kutu Tipleri ────────────────────────────────────────────

export async function getLootBoxTypes(eventId: string): Promise<LootBoxType[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("loot_box_types").select("*").eq("event_id", eventId)
    .order("points_required", { ascending: true });
  return (data ?? []) as LootBoxType[];
}

export async function upsertLootBoxType(
  eventId: string,
  data: {
    tier: "common" | "rare" | "epic";
    name: string;
    points_required: number;
    prob_common: number;
    prob_rare: number;
    prob_epic: number;
    prob_legendary: number;
  }
): Promise<{ error: string | null }> {
  const { supabase, error } = await assertOrganizer(eventId);
  if (error || !supabase) return { error };

  // Toplam 10000 olmalı
  const total = data.prob_common + data.prob_rare + data.prob_epic + data.prob_legendary;
  if (total !== 10000) return { error: `Olasılıklar toplamı 10000 olmalı (şu an: ${total})` };

  const { error: dbErr } = await supabase.from("loot_box_types").upsert(
    { event_id: eventId, ...data },
    { onConflict: "event_id,tier" }
  );
  if (dbErr) return { error: dbErr.message };

  revalidatePath(`/organizer/events/${eventId}`);
  return { error: null };
}

export async function deleteLootBoxType(id: string, eventId: string): Promise<{ error: string | null }> {
  const { supabase, error } = await assertOrganizer(eventId);
  if (error || !supabase) return { error };
  const { error: dbErr } = await supabase.from("loot_box_types").delete().eq("id", id);
  if (dbErr) return { error: dbErr.message };
  revalidatePath(`/organizer/events/${eventId}`);
  return { error: null };
}

// ── Ödül Havuzu ─────────────────────────────────────────────

export async function getLootRewards(eventId: string): Promise<LootReward[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("loot_rewards").select("*").eq("event_id", eventId)
    .order("tier").order("weight", { ascending: false });
  return (data ?? []) as LootReward[];
}

export async function upsertLootReward(
  eventId: string,
  data: {
    id?: string;
    tier: "common" | "rare" | "epic" | "legendary";
    name: string;
    description?: string;
    total_stock?: number | null;
    weight: number;
  }
): Promise<{ error: string | null }> {
  const { supabase, error } = await assertOrganizer(eventId);
  if (error || !supabase) return { error };

  const payload = {
    event_id: eventId,
    tier: data.tier,
    name: data.name,
    description: data.description ?? null,
    total_stock: data.total_stock ?? null,
    weight: data.weight,
    is_active: true,
  };

  const { error: dbErr } = data.id
    ? await supabase.from("loot_rewards").update(payload).eq("id", data.id)
    : await supabase.from("loot_rewards").insert(payload);

  if (dbErr) return { error: dbErr.message };
  revalidatePath(`/organizer/events/${eventId}`);
  return { error: null };
}

export async function deleteLootReward(id: string, eventId: string): Promise<{ error: string | null }> {
  const { supabase, error } = await assertOrganizer(eventId);
  if (error || !supabase) return { error };
  const { error: dbErr } = await supabase.from("loot_rewards").delete().eq("id", id);
  if (dbErr) return { error: dbErr.message };
  revalidatePath(`/organizer/events/${eventId}`);
  return { error: null };
}

export async function toggleLootRewardActive(id: string, eventId: string, is_active: boolean): Promise<{ error: string | null }> {
  const { supabase, error } = await assertOrganizer(eventId);
  if (error || !supabase) return { error };
  const { error: dbErr } = await supabase.from("loot_rewards").update({ is_active }).eq("id", id);
  if (dbErr) return { error: dbErr.message };
  revalidatePath(`/organizer/events/${eventId}`);
  return { error: null };
}

// ── İstatistikler ────────────────────────────────────────────

export async function getGamificationStats(eventId: string) {
  const supabase = await createSupabaseServerClient();

  const [boxesRes, openedRes, rewardsRes] = await Promise.all([
    supabase.from("user_loot_boxes").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("user_loot_boxes").select("id", { count: "exact", head: true }).eq("event_id", eventId).not("opened_at", "is", null),
    supabase.from("loot_rewards").select("id, name, tier, claimed_count, total_stock").eq("event_id", eventId).eq("is_active", true),
  ]);

  return {
    total_boxes:   boxesRes.count ?? 0,
    opened_boxes:  openedRes.count ?? 0,
    rewards:       rewardsRes.data ?? [],
  };
}
