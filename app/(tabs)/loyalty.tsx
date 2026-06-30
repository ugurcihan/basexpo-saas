import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { Zap, Award, Trophy } from "lucide-react-native";

type PointRow = { reason: string; points: number; created_at: string };
type Badge = { name: string; icon: string; earned_at: string };

const REASON_LABELS: Record<string, string> = {
  booth_visit: "Stant Ziyareti",
  checkin: "Fuara Giriş",
  meeting: "Toplantı",
  connection: "Bağlantı",
  video: "Video İzledi",
  survey: "Anketi Doldurdu",
};

export default function LoyaltyScreen() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [points, setPoints] = useState<PointRow[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [pointsRes, badgesRes] = await Promise.all([
      supabase
        .from("loyalty_points")
        .select("reason, points, created_at")
        .eq("visitor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("visitor_badges")
        .select("earned_at, badge:badge_definitions(name, icon)")
        .eq("visitor_id", user.id)
        .order("earned_at", { ascending: false }),
    ]);

    const rows = pointsRes.data ?? [];
    setPoints(rows);
    setTotalPoints(rows.reduce((s, r) => s + (r.points ?? 0), 0));

    setBadges((badgesRes.data ?? []).map(b => {
      const badge = Array.isArray(b.badge) ? b.badge[0] : b.badge;
      return { name: badge?.name ?? "", icon: badge?.icon ?? "🏅", earned_at: b.earned_at };
    }));

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.indigo} />}
      >
        <Text style={styles.pageTitle}>Puanlarım</Text>

        {/* Total */}
        <View style={styles.totalCard}>
          <Zap color={Colors.gold} size={36} />
          <Text style={styles.totalValue}>{totalPoints}</Text>
          <Text style={styles.totalLabel}>Toplam Puan</Text>
        </View>

        {/* Badges */}
        {badges.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Award color={Colors.gold} size={18} />
              <Text style={styles.sectionTitle}>Rozetlerim</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
              {badges.map((b, i) => (
                <View key={i} style={styles.badgeCard}>
                  <Text style={styles.badgeIcon}>{b.icon}</Text>
                  <Text style={styles.badgeName} numberOfLines={2}>{b.name}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* History */}
        <View style={styles.sectionHeader}>
          <Trophy color={Colors.indigo} size={18} />
          <Text style={styles.sectionTitle}>Puan Geçmişi</Text>
        </View>

        {points.length === 0 ? (
          <Text style={styles.emptyText}>Henüz puan kazanmadın. Firma QR kodlarını taramaya başla!</Text>
        ) : (
          points.map((p, i) => (
            <View key={i} style={styles.pointRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointReason}>{REASON_LABELS[p.reason] ?? p.reason}</Text>
                <Text style={styles.pointDate}>
                  {new Date(p.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                </Text>
              </View>
              <Text style={[styles.pointValue, { color: p.points >= 0 ? Colors.green : Colors.red }]}>
                +{p.points}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: Colors.white, marginBottom: 20 },
  totalCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 28, alignItems: "center", gap: 8, marginBottom: 28, borderWidth: 1, borderColor: Colors.gold + "30" },
  totalValue: { fontSize: 52, fontWeight: "800", color: Colors.gold },
  totalLabel: { fontSize: 14, color: Colors.muted, fontWeight: "600" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.white },
  badgeScroll: { marginBottom: 28 },
  badgeCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, alignItems: "center", marginRight: 10, width: 90, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  badgeIcon: { fontSize: 28 },
  badgeName: { fontSize: 11, color: Colors.white, textAlign: "center", fontWeight: "600" },
  pointRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  pointReason: { fontSize: 14, fontWeight: "600", color: Colors.white },
  pointDate: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  pointValue: { fontSize: 20, fontWeight: "800" },
  emptyText: { fontSize: 13, color: Colors.muted, textAlign: "center", lineHeight: 20, paddingVertical: 20 },
});
