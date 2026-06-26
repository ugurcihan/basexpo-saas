"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export type LoyaltyReason = "checkin" | "booth_visit" | "meeting" | "connection";

export interface RewardTier {
  id: string;
  event_id: string;
  points_required: number;
  reward_title: string;
  reward_description: string | null;
  is_active: boolean;
  max_winners: number | null;
}

export interface RewardTierWithStats extends RewardTier {
  winner_count: number;
  is_full: boolean;
}

export interface WonReward {
  tier_id: string;
  rank: number;
  claimed_at: string;
}

export interface BadgeDefinition {
  id: string;
  event_id: string | null;
  name: string;
  icon: string;
  condition_type: string;
  condition_value: number;
}

export interface EarnedBadge {
  id: string;
  badge_id: string;
  event_id: string;
  earned_at: string;
  badge: BadgeDefinition;
}

export interface LoyaltyPointRow {
  id: string;
  points: number;
  reason: LoyaltyReason;
  created_at: string;
  exhibitor?: { company_name: string } | null;
}

export interface LoyaltyStats {
  totalPoints: number;
  rank: number | null;
  rewardTiers: RewardTierWithStats[];
  wonRewards: WonReward[];
  earnedBadges: EarnedBadge[];
  history: LoyaltyPointRow[];
  leaderboard: LeaderboardEntry[];
}

// ─── earnPoints ───────────────────────────────────────────────
// Merkezi puan kazanım fonksiyonu. Fuar aktif değilse sessizce atlar.
export async function earnPoints(
  eventId: string,
  reason: LoyaltyReason,
  points: number,
  exhibitorId?: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Fuar aktif mi?
  const { data: event } = await supabase
    .from("events")
    .select("status")
    .eq("id", eventId)
    .single();

  if (!event || event.status === "ended" || event.status === "draft") return;

  // Puan ekle — duplicate varsa ignore (UNIQUE index conflict)
  const { error } = await supabase.from("loyalty_points").insert({
    event_id: eventId,
    visitor_id: user.id,
    points,
    reason,
    exhibitor_id: exhibitorId ?? null,
  });

  // 23505 = unique constraint violation → duplicate, expected, ignore
  if (error && error.code !== "23505") {
    console.error("[earnPoints] error:", error.message);
    return;
  }

  // Güncel toplam puan hesapla
  const { data: allPoints } = await supabase
    .from("loyalty_points")
    .select("points")
    .eq("event_id", eventId)
    .eq("visitor_id", user.id);

  const totalPoints = (allPoints ?? []).reduce((s, r: { points: number }) => s + r.points, 0);

  // Rozet kontrolü
  await checkAndAwardBadges(supabase, user.id, eventId, reason, totalPoints);

  // Ödül kazanma kontrolü (ilk X kazanan)
  await checkAndAwardRewards(supabase, user.id, eventId, totalPoints);

  revalidatePath("/visitor/loyalty");
}

// ─── Rozet Kontrolü ──────────────────────────────────────────
async function checkAndAwardBadges(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  visitorId: string,
  eventId: string,
  reason: LoyaltyReason,
  totalPoints: number,
) {
  const relevantConditions: Record<LoyaltyReason, string[]> = {
    checkin:      ["checkin"],
    booth_visit:  ["booth_visits"],
    meeting:      ["meetings"],
    connection:   ["connections"],
  };
  const conditions = relevantConditions[reason];

  const { data: badges } = await supabase
    .from("badge_definitions")
    .select("*")
    .in("condition_type", [...conditions, "total_points"])
    .or(`event_id.is.null,event_id.eq.${eventId}`);

  if (!badges || badges.length === 0) return;

  const [{ count: checkins }, { count: boothVisits }, { count: meetings }] = await Promise.all([
    supabase.from("loyalty_points").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("visitor_id", visitorId).eq("reason", "checkin"),
    supabase.from("loyalty_points").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("visitor_id", visitorId).eq("reason", "booth_visit"),
    supabase.from("loyalty_points").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("visitor_id", visitorId).eq("reason", "meeting"),
  ]);

  const stats: Record<string, number> = {
    checkin:      checkins ?? 0,
    booth_visits: boothVisits ?? 0,
    meetings:     meetings ?? 0,
    total_points: totalPoints,
  };

  for (const badge of badges as BadgeDefinition[]) {
    const current = stats[badge.condition_type] ?? 0;
    if (current >= badge.condition_value) {
      await supabase.from("visitor_badges").insert({
        visitor_id: visitorId,
        badge_id: badge.id,
        event_id: eventId,
      });
    }
  }
}

// ─── Ödül Kazanma Kontrolü ────────────────────────────────────
// Puan eşiğini geçen tierleri kontrol et, kontenjan varsa reward_winners'a ekle.
async function checkAndAwardRewards(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  visitorId: string,
  eventId: string,
  totalPoints: number,
) {
  // Bu fuarın aktif tierları — sadece eşiğe ulaşılanlar
  const { data: tiers } = await supabase
    .from("reward_tiers")
    .select("id, points_required, max_winners")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .lte("points_required", totalPoints);

  if (!tiers || tiers.length === 0) return;

  for (const tier of tiers as { id: string; points_required: number; max_winners: number | null }[]) {
    // Zaten kazandı mı?
    const { count: alreadyWon } = await supabase
      .from("reward_winners")
      .select("*", { count: "exact", head: true })
      .eq("tier_id", tier.id)
      .eq("visitor_id", visitorId);

    if ((alreadyWon ?? 0) > 0) continue;

    // Kontenjanlı tier: kaç kişi kazandı?
    const { count: currentWinners } = await supabase
      .from("reward_winners")
      .select("*", { count: "exact", head: true })
      .eq("tier_id", tier.id);

    // Kontenjan doldu mu?
    if (tier.max_winners !== null && (currentWinners ?? 0) >= tier.max_winners) continue;

    // Slot var → kazandır
    const rank = (currentWinners ?? 0) + 1;
    const { error } = await supabase.from("reward_winners").insert({
      tier_id: tier.id,
      visitor_id: visitorId,
      rank,
    });

    // 23505 = başka thread aynı anda insert etti, yine de ignore
    if (error && error.code !== "23505") {
      console.error("[checkAndAwardRewards] error:", error.message);
    }
  }
}

// ─── getMyLoyaltyStats ────────────────────────────────────────
export async function getMyLoyaltyStats(eventId: string): Promise<LoyaltyStats> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { totalPoints: 0, rank: null, rewardTiers: [], wonRewards: [], earnedBadges: [], history: [], leaderboard: [] };

  const [pointsResult, tiersResult, winnersResult, myWinsResult, badgesResult, historyResult] = await Promise.all([
    supabase.from("loyalty_points")
      .select("points")
      .eq("event_id", eventId)
      .eq("visitor_id", user.id),

    supabase.from("reward_tiers")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("points_required", { ascending: true }),

    // Her tier için kazanan sayısı
    supabase.from("reward_winners")
      .select("tier_id")
      .in("tier_id", []),  // placeholder — replaced below

    // Bu ziyaretçinin kazandıkları
    supabase.from("reward_winners")
      .select("tier_id, rank, claimed_at")
      .eq("visitor_id", user.id),

    supabase.from("visitor_badges")
      .select(`
        id, badge_id, event_id, earned_at,
        badge:badge_definitions(id, event_id, name, icon, condition_type, condition_value)
      `)
      .eq("event_id", eventId)
      .eq("visitor_id", user.id),

    supabase.from("loyalty_points")
      .select(`
        id, points, reason, created_at,
        exhibitor:exhibitors(company_name)
      `)
      .eq("event_id", eventId)
      .eq("visitor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const totalPoints = (pointsResult.data ?? []).reduce((s: number, r: { points: number }) => s + r.points, 0);

  const tiers = (tiersResult.data ?? []) as RewardTier[];

  // Winner count per tier (separate query after we have tier IDs)
  const tierIds = tiers.map((t) => t.id);
  let winnerCountMap = new Map<string, number>();
  if (tierIds.length > 0) {
    const { data: winnerRows } = await supabase
      .from("reward_winners")
      .select("tier_id")
      .in("tier_id", tierIds);
    for (const row of winnerRows ?? []) {
      const prev = winnerCountMap.get(row.tier_id) ?? 0;
      winnerCountMap.set(row.tier_id, prev + 1);
    }
  }

  const rewardTiers: RewardTierWithStats[] = tiers.map((t) => {
    const winner_count = winnerCountMap.get(t.id) ?? 0;
    return {
      ...t,
      max_winners: t.max_winners ?? null,
      winner_count,
      is_full: t.max_winners !== null && winner_count >= t.max_winners,
    };
  });

  const wonRewards = (myWinsResult.data ?? []).map((r: {
    tier_id: string; rank: number; claimed_at: string;
  }) => r) as WonReward[];

  const earnedBadges = (badgesResult.data ?? []).map((b: {
    id: string; badge_id: string; event_id: string; earned_at: string;
    badge: BadgeDefinition | BadgeDefinition[];
  }) => ({
    ...b,
    badge: Array.isArray(b.badge) ? b.badge[0] : b.badge,
  })) as EarnedBadge[];

  const history = (historyResult.data ?? []).map((r: {
    id: string; points: number; reason: string; created_at: string;
    exhibitor: { company_name: string } | { company_name: string }[] | null;
  }) => ({
    ...r,
    reason: r.reason as LoyaltyReason,
    exhibitor: Array.isArray(r.exhibitor) ? (r.exhibitor[0] ?? null) : r.exhibitor,
  })) as LoyaltyPointRow[];

  // Leaderboard + rank hesapla (client-side aggregate)
  const leaderboard = await getEventLeaderboard(eventId);
  const rank = leaderboard.findIndex((e) => e.visitor_id === user.id);

  return {
    totalPoints,
    rank: rank >= 0 ? rank + 1 : null,
    rewardTiers,
    wonRewards,
    earnedBadges,
    history,
    leaderboard,
  };
}

// ─── getEventLeaderboard ─────────────────────────────────────
export interface LeaderboardEntry {
  visitor_id: string;
  total_points: number;
  full_name: string | null;
  avatar_url: string | null;
}

export async function getEventLeaderboard(eventId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("loyalty_points")
    .select("visitor_id, points, visitor:profiles(full_name, avatar_url)")
    .eq("event_id", eventId);

  if (!data) return [];

  const map = new Map<string, LeaderboardEntry>();
  for (const row of data as {
    visitor_id: string;
    points: number;
    visitor: { full_name: string | null; avatar_url: string | null } | { full_name: string | null; avatar_url: string | null }[];
  }[]) {
    const visitor = Array.isArray(row.visitor) ? row.visitor[0] : row.visitor;
    const existing = map.get(row.visitor_id);
    if (existing) {
      existing.total_points += row.points;
    } else {
      map.set(row.visitor_id, {
        visitor_id: row.visitor_id,
        total_points: row.points,
        full_name: visitor?.full_name ?? null,
        avatar_url: visitor?.avatar_url ?? null,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 10);
}

// ─── getPublicEventRewardTiers ───────────────────────────────
// Public — auth gerekmez. reward_tiers RLS: SELECT USING (true)
export async function getPublicEventRewardTiers(eventId: string): Promise<RewardTierWithStats[]> {
  const supabase = await createSupabaseServerClient();

  const { data: tiers } = await supabase
    .from("reward_tiers")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
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

// ─── getMyEventTotalPoints ────────────────────────────────────
export async function getMyEventTotalPoints(eventId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("loyalty_points")
    .select("points")
    .eq("event_id", eventId)
    .eq("visitor_id", user.id);

  return (data ?? []).reduce((s: number, r: { points: number }) => s + r.points, 0);
}

// ─── getVisitorEventsWithPoints ───────────────────────────────
export async function getVisitorEventsWithPoints(): Promise<{
  event_id: string;
  event_name: string;
  total_points: number;
  start_date: string;
  location: string;
}[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("loyalty_points")
    .select("event_id, points, event:events(name, start_date, location)")
    .eq("visitor_id", user.id);

  if (!data) return [];

  const map = new Map<string, {
    event_id: string; event_name: string; total_points: number;
    start_date: string; location: string;
  }>();

  for (const row of data as {
    event_id: string; points: number;
    event: { name: string; start_date: string; location: string } | { name: string; start_date: string; location: string }[];
  }[]) {
    const ev = Array.isArray(row.event) ? row.event[0] : row.event;
    const existing = map.get(row.event_id);
    if (existing) {
      existing.total_points += row.points;
    } else {
      map.set(row.event_id, {
        event_id: row.event_id,
        event_name: ev?.name ?? "—",
        total_points: row.points,
        start_date: ev?.start_date ?? "",
        location: ev?.location ?? "",
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.start_date.localeCompare(a.start_date));
}
