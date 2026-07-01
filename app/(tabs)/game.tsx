import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { getMyFairsWithBoxInfo, type FairWithBoxInfo } from "@/lib/api/gamification";
import { supabase } from "@/lib/supabase";

function StatusBadge({ status }: { status: FairWithBoxInfo["status"] }) {
  const cfg = {
    active:          { bg: Colors.green + "20",  text: Colors.green,  label: "Aktif" },
    locked:          { bg: Colors.amber + "20",  text: Colors.amber,  label: "🔒 Kilitli" },
    no_boxes:        { bg: Colors.muted + "20",  text: Colors.muted,  label: "Kutu Yok" },
    not_registered:  { bg: Colors.muted + "10",  text: Colors.muted,  label: "Kayıtsız" },
  }[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

export default function GameScreen() {
  const router = useRouter();
  const [fairs, setFairs]     = useState<FairWithBoxInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Ziyaretçi");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
          if (p?.full_name && active) setUserName(p.full_name.split(" ")[0]);
        }
        const data = await getMyFairsWithBoxInfo();
        if (active) { setFairs(data); setLoading(false); }
      })();
      return () => { active = false; };
    }, [])
  );

  const totalBoxes  = fairs.reduce((s, f) => s + f.unopened_boxes, 0);
  const totalPoints = fairs.reduce((s, f) => s + f.total_points, 0);
  const activeFairs = fairs.filter(f => f.status === "active");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Oyunlar</Text>
            <Text style={styles.subtitle}>Puan kazan, kutu aç!</Text>
          </View>
          <Text style={styles.headerEmoji}>🎮</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Toplam Puan</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.gold }]}>{totalBoxes}</Text>
            <Text style={styles.statLabel}>Açılmamış Kutu</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.green }]}>{activeFairs.length}</Text>
            <Text style={styles.statLabel}>Aktif Fuar</Text>
          </View>
        </View>

        {/* Kutularım CTA */}
        <TouchableOpacity
          style={styles.mainCTA}
          onPress={() => router.push("/game/my-boxes")}
          activeOpacity={0.85}
        >
          <View style={styles.mainCTALeft}>
            <Text style={styles.mainCTAEmoji}>🎁</Text>
            <View>
              <Text style={styles.mainCTATitle}>Kutularım</Text>
              <Text style={styles.mainCTASub}>
                {totalBoxes > 0 ? `${totalBoxes} kutu seni bekliyor!` : "Puan kazanarak kutu kazan"}
              </Text>
            </View>
          </View>
          <Text style={styles.mainCTAArrow}>›</Text>
        </TouchableOpacity>

        {/* Liderlik Tablosu — her zaman görünür */}
        <Text style={styles.sectionTitle}>Liderlik Tabloları</Text>

        {/* Türkiye + Dünya her zaman */}
        <TouchableOpacity
          style={styles.leaderboardCTA}
          onPress={() => router.push("/game/leaderboard" as any)}
          activeOpacity={0.85}
        >
          <View style={styles.leaderboardCTAInner}>
            <Text style={styles.leaderboardCTAPodium}>🥇🥈🥉</Text>
            <View>
              <Text style={styles.leaderboardCTATitle}>Türkiye & Dünya</Text>
              <Text style={styles.leaderboardCTASub}>Tüm zamanlı sıralama</Text>
            </View>
          </View>
          <Text style={styles.mainCTAArrow}>›</Text>
        </TouchableOpacity>

        {/* Aktif fuarlar için ayrı liderlik tablosu */}
        {loading ? (
          <ActivityIndicator color={Colors.indigo} style={{ marginTop: 8 }} />
        ) : activeFairs.map(fair => (
          <TouchableOpacity
            key={fair.event_id}
            style={styles.fairCard}
            onPress={() => router.push({ pathname: "/game/leaderboard", params: { event_id: fair.event_id } } as any)}
            activeOpacity={0.85}
          >
            <View style={styles.fairCardLeft}>
              <Text style={styles.fairEmoji}>🏟️</Text>
              <View>
                <Text style={styles.fairName} numberOfLines={1}>{fair.event_name}</Text>
                <Text style={styles.fairSub}>{fair.total_points} puan · Fuar sıralaması</Text>
              </View>
            </View>
            <Text style={styles.mainCTAArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Puan Kazanma Rehberi */}
        <Text style={styles.sectionTitle}>Nasıl Puan Kazanırsın?</Text>
        <View style={styles.guideCard}>
          {[
            { emoji: "✅", label: "Fuara giriş yap", pts: "+50" },
            { emoji: "📱", label: "Stant QR tara",   pts: "+20" },
            { emoji: "🤝", label: "Bağlantı kur",    pts: "+20" },
            { emoji: "🃏", label: "Kartvizit aç",    pts: "+1"  },
          ].map(item => (
            <View key={item.label} style={styles.guideRow}>
              <Text style={styles.guideEmoji}>{item.emoji}</Text>
              <Text style={styles.guideLabel}>{item.label}</Text>
              <Text style={styles.guidePts}>{item.pts}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.bg },
  scroll:         { paddingBottom: 48 },
  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  title:          { fontSize: 26, fontWeight: "800", color: Colors.white },
  subtitle:       { fontSize: 13, color: Colors.muted, marginTop: 2 },
  headerEmoji:    { fontSize: 40 },
  statsRow:       { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard:       { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statValue:      { fontSize: 22, fontWeight: "800", color: Colors.indigo },
  statLabel:      { fontSize: 10, color: Colors.muted, fontWeight: "600", marginTop: 2, textAlign: "center" },
  mainCTA:        { marginHorizontal: 20, backgroundColor: Colors.indigo, borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  mainCTALeft:    { flexDirection: "row", alignItems: "center", gap: 14 },
  mainCTAEmoji:   { fontSize: 36 },
  mainCTATitle:   { fontSize: 18, fontWeight: "800", color: "#fff" },
  mainCTASub:     { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  mainCTAArrow:   { fontSize: 28, color: "rgba(255,255,255,0.7)", fontWeight: "300" },
  sectionTitle:   { fontSize: 17, fontWeight: "800", color: Colors.white, paddingHorizontal: 20, marginBottom: 12 },
  leaderboardCTA:      { marginHorizontal: 20, backgroundColor: Colors.card2, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: Colors.gold + "50", marginBottom: 10 },
  leaderboardCTAInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  leaderboardCTAPodium:{ fontSize: 28 },
  leaderboardCTATitle: { fontSize: 15, fontWeight: "700", color: Colors.white },
  leaderboardCTASub:   { fontSize: 12, color: Colors.muted, marginTop: 2 },
  fairCard:       { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  fairCardLeft:   { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  fairEmoji:      { fontSize: 28 },
  fairName:       { fontSize: 15, fontWeight: "700", color: Colors.white, flex: 1 },
  fairSub:        { fontSize: 12, color: Colors.muted, marginTop: 2 },
  guideCard:      { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  guideRow:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  guideEmoji:     { fontSize: 22, width: 32, textAlign: "center" },
  guideLabel:     { flex: 1, fontSize: 14, color: Colors.white, fontWeight: "600" },
  guidePts:       { fontSize: 15, fontWeight: "800", color: Colors.green },
  badge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  badgeText:      { fontSize: 11, fontWeight: "700" },
});
