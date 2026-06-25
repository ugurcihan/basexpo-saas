"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { RewardTier, RewardTierWithStats, LeaderboardEntry } from "./actions";
import { getEventLeaderboard } from "./actions";

// ─── Ödül eşiği ekle / güncelle ──────────────────────────────
export async function upsertRewardTier(
  eventId: string,
  data: {
    points_required: number;
    reward_title: string;
    reward_description?: string;
    max_winners?: number | null;
  },
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın." };

  // Organizatör mu?
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("organizer_id", user.id)
    .single();
  if (!event) return { error: "Bu fuarı yönetme yetkin yok." };

  const { error } = await supabase.from("reward_tiers").upsert(
    {
      event_id: eventId,
      points_required: data.points_required,
      reward_title: data.reward_title,
      reward_description: data.reward_description ?? null,
      max_winners: data.max_winners ?? null,
      is_active: true,
    },
    { onConflict: "event_id,points_required" },
  );

  if (error) return { error: error.message };
  revalidatePath(`/organizer/events/${eventId}`);
  return { error: null };
}

// ─── Ödül eşiği sil ──────────────────────────────────────────
export async function deleteRewardTier(tierId: string): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın." };

  const { data: tier } = await supabase
    .from("reward_tiers")
    .select("event_id")
    .eq("id", tierId)
    .single();
  if (!tier) return { error: "Ödül eşiği bulunamadı." };

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", tier.event_id)
    .eq("organizer_id", user.id)
    .single();
  if (!event) return { error: "Bu fuarı yönetme yetkin yok." };

  const { error } = await supabase.from("reward_tiers").delete().eq("id", tierId);
  if (error) return { error: error.message };

  revalidatePath(`/organizer/events/${tier.event_id}`);
  return { error: null };
}

// ─── Fuar ödül eşiklerini listele (kazanan sayısıyla) ─────────
export async function getEventRewardTiers(eventId: string): Promise<RewardTierWithStats[]> {
  const supabase = await createSupabaseServerClient();
  const { data: tiers } = await supabase
    .from("reward_tiers")
    .select("*")
    .eq("event_id", eventId)
    .order("points_required", { ascending: true });

  if (!tiers || tiers.length === 0) return [];

  const tierIds = (tiers as RewardTier[]).map((t) => t.id);
  const { data: winnerRows } = await supabase
    .from("reward_winners")
    .select("tier_id")
    .in("tier_id", tierIds);

  const winnerCountMap = new Map<string, number>();
  for (const row of winnerRows ?? []) {
    winnerCountMap.set(row.tier_id, (winnerCountMap.get(row.tier_id) ?? 0) + 1);
  }

  return (tiers as RewardTier[]).map((t) => {
    const winner_count = winnerCountMap.get(t.id) ?? 0;
    return {
      ...t,
      max_winners: t.max_winners ?? null,
      winner_count,
      is_full: t.max_winners !== null && winner_count >= t.max_winners,
    } as RewardTierWithStats;
  });
}

// ─── Kazanan listesi (tier bazında) ──────────────────────────
export interface RewardWinnerRow {
  visitor_id: string;
  rank: number;
  claimed_at: string;
  full_name: string | null;
  email: string | null;
}

export async function getRewardTierWinners(tierId: string): Promise<RewardWinnerRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("reward_winners")
    .select(`
      visitor_id, rank, claimed_at,
      visitor:profiles(full_name, email)
    `)
    .eq("tier_id", tierId)
    .order("rank", { ascending: true });

  if (!data) return [];

  return data.map((row: {
    visitor_id: string; rank: number; claimed_at: string;
    visitor: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[];
  }) => {
    const visitor = Array.isArray(row.visitor) ? row.visitor[0] : row.visitor;
    return {
      visitor_id: row.visitor_id,
      rank: row.rank,
      claimed_at: row.claimed_at,
      full_name: visitor?.full_name ?? null,
      email: visitor?.email ?? null,
    };
  });
}

// ─── Fuar puan sıralaması + özet ─────────────────────────────
export async function getEventLoyaltySummary(eventId: string): Promise<{
  leaderboard: LeaderboardEntry[];
  totalParticipants: number;
  totalPointsAwarded: number;
}> {
  const supabase = await createSupabaseServerClient();
  const [leaderboard, pointsResult] = await Promise.all([
    getEventLeaderboard(eventId),
    supabase
      .from("loyalty_points")
      .select("points, visitor_id")
      .eq("event_id", eventId),
  ]);

  const rows = pointsResult.data ?? [];
  const totalPointsAwarded = rows.reduce((s: number, r: { points: number }) => s + r.points, 0);
  const totalParticipants = new Set(rows.map((r: { visitor_id: string }) => r.visitor_id)).size;

  return { leaderboard, totalParticipants, totalPointsAwarded };
}

