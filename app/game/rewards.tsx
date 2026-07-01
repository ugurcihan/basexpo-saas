import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { getMyPoints } from "@/lib/api/gamification";
import {
  getEventRewardTiers, getRewardTierWinners, getMyWonTierIds,
  type RewardTierWithStats, type WinnerRow,
} from "@/lib/api/rewards";
import { Colors } from "@/constants/Colors";

// ── Tier kartı ───────────────────────────────────────────────────

function TierCard({
  tier, myPoints, isWon, expanded, onToggle, winners, loadingWinners,
}: {
  tier: RewardTierWithStats;
  myPoints: number;
  isWon: boolean;
  expanded: boolean;
  onToggle: () => void;
  winners: WinnerRow[] | undefined;
  loadingWinners: boolean;
}) {
  const progress   = Math.min(myPoints / tier.points_required, 1);
  const reached    = myPoints >= tier.points_required;
  const remaining  = Math.max(tier.points_required - myPoints, 0);
  const barColor   = isWon ? "#f59e0b" : reached ? "#22c55e" : Colors.indigo;
  const borderCol  = isWon ? "#f59e0b50" : reached ? "#22c55e40" : "rgba(255,255,255,0.08)";

  return (
    <View style={[s.card, { borderColor: borderCol }, isWon && s.cardWon]}>
      {isWon && (
        <View style={s.wonBanner}>
          <Text style={s.wonBannerText}>🏆  SEN KAZANDIN!</Text>
        </View>
      )}

      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[s.tierTitle, isWon && { color: "#f59e0b" }]}>{tier.reward_title}</Text>
          {tier.reward_description ? (
            <Text style={s.tierDesc} numberOfLines={2}>{tier.reward_description}</Text>
          ) : null}
        </View>
        <View style={[s.ptsBadge, { backgroundColor: barColor + "20", borderColor: barColor + "50" }]}>
          <Text style={[s.ptsBadgeNum, { color: barColor }]}>{tier.points_required.toLocaleString()}</Text>
          <Text style={s.ptsBadgeLabel}>puan</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${Math.round(progress * 100)}%` as `${number}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={s.barHint}>
        {reached
          ? `✓ Eşiğe ulaştın! (${myPoints.toLocaleString()} puan)`
          : `${remaining.toLocaleString()} puan daha kazan`}
      </Text>

      {/* Winner count */}
      <View style={s.footRow}>
        <Text style={s.winCount}>
          👥 {tier.winner_count}{tier.max_winners ? ` / ${tier.max_winners}` : ""} kazanan
        </Text>
        {tier.is_full && (
          <View style={s.fullBadge}><Text style={s.fullBadgeText}>Kontenjan Doldu</Text></View>
        )}
        {tier.winner_count > 0 && (
          <TouchableOpacity onPress={onToggle} style={s.expandBtn}>
            <Text style={s.expandBtnText}>{expanded ? "Gizle ↑" : "Kazananlar ↓"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expandable winner list */}
      {expanded && (
        <View style={s.winnerList}>
          {loadingWinners ? (
            <ActivityIndicator color={Colors.indigo} style={{ marginVertical: 10 }} />
          ) : (
            (winners ?? []).map(w => (
              <View key={w.rank} style={s.winnerRow}>
                <Text style={s.winnerRank}>#{w.rank}</Text>
                <Text style={s.winnerName}>{w.full_name ? w.full_name.split(" ")[0] : "—"}</Text>
                <Text style={s.winnerDate}>
                  {new Date(w.claimed_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ── Ana Ekran ────────────────────────────────────────────────────

export default function RewardsScreen() {
  const router = useRouter();
  const { event_id } = useLocalSearchParams<{ event_id?: string }>();

  const [tiers, setTiers]           = useState<RewardTierWithStats[]>([]);
  const [myPoints, setMyPoints]     = useState(0);
  const [wonTierIds, setWonTierIds] = useState<string[]>([]);
  const [eventName, setEventName]   = useState("Fuar Ödülleri");
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTier, setExpandedTier]   = useState<string | null>(null);
  const [winnerCache, setWinnerCache]     = useState<Record<string, WinnerRow[]>>({});
  const [loadingWinnersFor, setLoadingWinnersFor] = useState<string | null>(null);
  const [userId, setUserId]         = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!event_id) { setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? null;
    setUserId(uid);

    const [tiersData, pts, wonIds, evRes] = await Promise.all([
      getEventRewardTiers(event_id),
      uid ? getMyPoints(event_id) : Promise.resolve(0),
      uid ? getMyWonTierIds(event_id, uid) : Promise.resolve([]),
      supabase.from("events").select("name").eq("id", event_id).single(),
    ]);

    setTiers(tiersData);
    setMyPoints(pts);
    setWonTierIds(wonIds);
    if (evRes.data?.name) setEventName(evRes.data.name);
    setLoading(false);
    setRefreshing(false);
  }, [event_id]);

  useEffect(() => { if (!event_id) router.back(); else load(); }, [event_id]);

  function onRefresh() { setRefreshing(true); setWinnerCache({}); load(); }

  async function toggleWinners(tierId: string) {
    if (expandedTier === tierId) { setExpandedTier(null); return; }
    setExpandedTier(tierId);
    if (!winnerCache[tierId]) {
      setLoadingWinnersFor(tierId);
      const data = await getRewardTierWinners(tierId);
      setWinnerCache(prev => ({ ...prev, [tierId]: data }));
      setLoadingWinnersFor(null);
    }
  }

  if (loading) {
    return (
      <LinearGradient colors={["#0a0a1a", "#1a0a2e"]} style={s.center}>
        <ActivityIndicator color="#f59e0b" size="large" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0a0a1a", "#1a0a2e", "#0a0a1a"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </Pressable>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <Text style={s.screenTitle}>Ödüller</Text>
            <Text style={s.screenSub} numberOfLines={1}>{eventName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* My points pill */}
        <View style={s.pointsPill}>
          <Text style={s.pointsPillEmoji}>⚡</Text>
          <Text style={s.pointsPillVal}>{myPoints.toLocaleString()}</Text>
          <Text style={s.pointsPillLabel}>Bu Fuarda Puan</Text>
        </View>

        {tiers.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>🎁</Text>
            <Text style={s.emptyTitle}>Henüz ödül belirlenmemiş</Text>
            <Text style={s.emptyDesc}>Organizatör bu fuar için milestone ödülleri tanımlamadı.</Text>
          </View>
        ) : (
          <FlatList
            data={tiers}
            keyExtractor={t => t.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
            }
            ListHeaderComponent={
              <Text style={s.sectionLabel}>
                {tiers.length} Aktif Ödül
              </Text>
            }
            renderItem={({ item }) => (
              <TierCard
                tier={item}
                myPoints={myPoints}
                isWon={wonTierIds.includes(item.id)}
                expanded={expandedTier === item.id}
                onToggle={() => toggleWinners(item.id)}
                winners={winnerCache[item.id]}
                loadingWinners={loadingWinnersFor === item.id}
              />
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Stiller ──────────────────────────────────────────────────────

const s = StyleSheet.create({
  center:           { flex: 1, alignItems: "center", justifyContent: "center" },
  header:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:          { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backText:         { color: "#fff", fontSize: 22 },
  screenTitle:      { color: "#fff", fontSize: 18, fontWeight: "800" },
  screenSub:        { color: "#64748b", fontSize: 12, marginTop: 1 },

  pointsPill:       { flexDirection: "row", alignItems: "center", alignSelf: "center", backgroundColor: "#1a1a2e", borderRadius: 30, paddingHorizontal: 20, paddingVertical: 10, gap: 8, marginBottom: 8, borderWidth: 1, borderColor: "#f59e0b30" },
  pointsPillEmoji:  { fontSize: 20 },
  pointsPillVal:    { fontSize: 22, fontWeight: "800", color: "#f59e0b" },
  pointsPillLabel:  { fontSize: 12, color: "#94a3b8", fontWeight: "600" },

  sectionLabel:     { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },

  card:             { backgroundColor: "#111827", borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1 },
  cardWon:          { backgroundColor: "#1a1400" },
  wonBanner:        { backgroundColor: "#f59e0b15", borderRadius: 10, padding: 10, marginBottom: 12, alignItems: "center", borderWidth: 1, borderColor: "#f59e0b40" },
  wonBannerText:    { color: "#f59e0b", fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },

  cardHeader:       { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  tierTitle:        { fontSize: 16, fontWeight: "800", color: "#f1f5f9", marginBottom: 4 },
  tierDesc:         { fontSize: 13, color: "#64748b", lineHeight: 18 },
  ptsBadge:         { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
  ptsBadgeNum:      { fontSize: 17, fontWeight: "900" },
  ptsBadgeLabel:    { fontSize: 10, color: "#64748b", fontWeight: "600" },

  barBg:            { height: 6, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  barFill:          { height: 6, borderRadius: 3 },
  barHint:          { fontSize: 11, color: "#64748b", marginBottom: 12 },

  footRow:          { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  winCount:         { flex: 1, fontSize: 12, color: "#94a3b8" },
  fullBadge:        { backgroundColor: "#3f1212", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#7f1d1d" },
  fullBadgeText:    { color: "#f87171", fontSize: 11, fontWeight: "700" },
  expandBtn:        { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 8 },
  expandBtnText:    { color: "#a5b4fc", fontSize: 12, fontWeight: "700" },

  winnerList:       { marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 10, gap: 4 },
  winnerRow:        { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 4 },
  winnerRank:       { width: 32, color: "#6366f1", fontSize: 12, fontWeight: "800" },
  winnerName:       { flex: 1, color: "#e2e8f0", fontSize: 14, fontWeight: "600" },
  winnerDate:       { color: "#64748b", fontSize: 11 },

  emptyWrap:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyEmoji:       { fontSize: 64 },
  emptyTitle:       { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptyDesc:        { color: "#64748b", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
