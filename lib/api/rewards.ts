import { supabase } from "@/lib/supabase";

export type RewardTierWithStats = {
  id: string;
  points_required: number;
  reward_title: string;
  reward_description: string | null;
  max_winners: number | null;
  winner_count: number;
  is_full: boolean;
};

export type WinnerRow = {
  rank: number;
  full_name: string | null;
  claimed_at: string;
};

export async function getEventRewardTiers(eventId: string): Promise<RewardTierWithStats[]> {
  const { data: tiers } = await supabase
    .from("reward_tiers")
    .select("id, points_required, reward_title, reward_description, max_winners")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("points_required", { ascending: true });

  if (!tiers?.length) return [];

  const tierIds = tiers.map(t => t.id);

  const { data: winners } = await supabase
    .from("reward_winners")
    .select("tier_id")
    .in("tier_id", tierIds);

  const countByTier = new Map<string, number>();
  for (const w of winners ?? []) {
    countByTier.set(w.tier_id, (countByTier.get(w.tier_id) ?? 0) + 1);
  }

  return tiers.map(t => {
    const winner_count = countByTier.get(t.id) ?? 0;
    return {
      id: t.id,
      points_required: t.points_required,
      reward_title: t.reward_title,
      reward_description: t.reward_description ?? null,
      max_winners: t.max_winners ?? null,
      winner_count,
      is_full: t.max_winners !== null && winner_count >= t.max_winners,
    };
  });
}

export async function getRewardTierWinners(tierId: string): Promise<WinnerRow[]> {
  const { data } = await supabase
    .from("reward_winners")
    .select("rank, claimed_at, visitor_id")
    .eq("tier_id", tierId)
    .order("rank", { ascending: true })
    .limit(20);

  if (!data?.length) return [];

  const ids = data.map(w => w.visitor_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  const nameById = new Map((profiles ?? []).map(p => [p.id, p.full_name]));

  return data.map(row => ({
    rank: row.rank,
    full_name: nameById.get(row.visitor_id) ?? null,
    claimed_at: row.claimed_at,
  }));
}

export async function getMyWonTierIds(eventId: string, userId: string): Promise<string[]> {
  const { data: tiers } = await supabase
    .from("reward_tiers")
    .select("id")
    .eq("event_id", eventId)
    .eq("is_active", true);

  if (!tiers?.length) return [];

  const tierIds = tiers.map(t => t.id);
  const { data: wins } = await supabase
    .from("reward_winners")
    .select("tier_id")
    .eq("visitor_id", userId)
    .in("tier_id", tierIds);

  return (wins ?? []).map(w => w.tier_id);
}
