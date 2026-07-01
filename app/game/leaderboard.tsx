import { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Image,
  Pressable, StyleSheet, Text, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getLeaderboard, type LeaderboardType } from "@/lib/api/gamification";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { flagEmoji } from "@/lib/countries";

type Entry = {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  points: number;
  rank: number;
  country_code?: string;
  city?: string;
};

const TABS: { key: LeaderboardType; label: string; emoji: string }[] = [
  { key: "fair",   label: "Fuar",    emoji: "🏟️" },
  { key: "turkey", label: "Türkiye", emoji: "🇹🇷" },
  { key: "world",  label: "Dünya",   emoji: "🌍" },
];

const RANK_COLORS = ["#f6d860", "#c0c0c0", "#cd7f32"];

function Avatar({ name, url, size = 44 }: { name: string; url?: string; size?: number }) {
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.indigo + "30", alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ color: Colors.indigoLight, fontWeight: "700", fontSize: size * 0.38 }}>{(name || "?")[0].toUpperCase()}</Text>
    </View>
  );
}

function Podium({ top3, myId }: { top3: Entry[]; myId: string | null }) {
  const first  = top3[0];
  const second = top3[1];
  const third  = top3[2];

  const podiumOrder = [second, first, third].filter(Boolean);

  return (
    <View style={pd.wrap}>
      {podiumOrder.map((entry, idx) => {
        const rank   = entry.rank;
        const col    = rank === 1 ? 100 : rank === 2 ? 72 : 58;
        const color  = RANK_COLORS[rank - 1];
        const isMe   = entry.user_id === myId;
        const medals = ["🥇","🥈","🥉"];
        return (
          <View key={entry.user_id} style={pd.col}>
            {isMe && <Text style={pd.youLabel}>SEN</Text>}
            <Avatar name={entry.full_name} url={entry.avatar_url} size={rank === 1 ? 56 : 44} />
            <Text style={[pd.entryName, rank === 1 && { color: "#fff" }]} numberOfLines={1}>
              {entry.full_name?.split(" ")[0] ?? "—"}
            </Text>
            {entry.country_code ? (
              <Text style={pd.entryFlag}>{flagEmoji(entry.country_code)}</Text>
            ) : null}
            <Text style={[pd.pts, { color }]}>{entry.points.toLocaleString()}</Text>
            <View style={[pd.block, { height: col, backgroundColor: color + "25", borderColor: color + "60" }]}>
              <Text style={pd.medal}>{medals[rank - 1]}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { event_id } = useLocalSearchParams<{ event_id?: string }>();

  const defaultTab: LeaderboardType = event_id ? "fair" : "turkey";
  const [tab, setTab]   = useState<LeaderboardType>(defaultTab);
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    setLoading(true);
    setData([]);
    const eid = tab === "fair" ? event_id : undefined;
    getLeaderboard(tab, eid).then(rows => {
      setData(rows as Entry[]);
      setLoading(false);
    });
  }, [tab, event_id]);

  const top3   = data.filter(e => e.rank <= 3);
  const rest   = data.filter(e => e.rank > 3);
  const myEntry = data.find(e => e.user_id === myId);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>

      {/* Header */}
      <View style={styles.hdr}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>←</Text>
        </Pressable>
        <Text style={styles.title}>Liderlik Tablosu</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {TABS.filter(t => t.key !== "fair" || !!event_id).map(t => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.indigo} size="large" /></View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyText}>Henüz kimse puan kazanmamış.</Text>
          <Text style={styles.emptySubText}>İlk sen ol!</Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={i => i.user_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: myEntry && myEntry.rank > 10 ? 80 : 32 }}
          ListHeaderComponent={
            top3.length > 0 ? <Podium top3={top3} myId={myId} /> : null
          }
          renderItem={({ item }) => {
            const isMe = item.user_id === myId;
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                <Text style={[styles.rankNum, isMe && { color: Colors.indigoLight }]}>#{item.rank}</Text>
                <Avatar name={item.full_name} url={item.avatar_url} size={38} />
                <View style={styles.nameCol}>
                  <Text style={[styles.name, isMe && { color: Colors.indigoLight }]} numberOfLines={1}>
                    {item.full_name || "Anonim"}{isMe ? " 👤" : ""}
                  </Text>
                  {(item.city || item.country_code) && (
                    <Text style={styles.location}>
                      {item.country_code ? flagEmoji(item.country_code) + " " : ""}
                      {[item.city, item.country_code].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                </View>
                <View style={styles.ptsBox}>
                  <Text style={[styles.pts, isMe && { color: Colors.indigoLight }]}>{item.points.toLocaleString()}</Text>
                  <Text style={styles.ptsLabel}>puan</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Benim konumum — sticky alt */}
      {myEntry && myEntry.rank > 10 && (
        <View style={styles.myBanner}>
          <Text style={styles.myBannerRank}>#{myEntry.rank}</Text>
          <Avatar name={myEntry.full_name} url={myEntry.avatar_url} size={32} />
          <Text style={styles.myBannerName} numberOfLines={1}>{myEntry.full_name} (Sen)</Text>
          <Text style={styles.myBannerPts}>{myEntry.points.toLocaleString()} puan</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const pd = StyleSheet.create({
  wrap:       { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", paddingTop: 24, paddingBottom: 8, gap: 8, paddingHorizontal: 16 },
  col:        { flex: 1, alignItems: "center", gap: 4 },
  youLabel:   { fontSize: 9, fontWeight: "800", color: Colors.indigo, letterSpacing: 1.5, marginBottom: 2 },
  entryName:  { fontSize: 12, fontWeight: "700", color: Colors.muted, textAlign: "center" },
  pts:        { fontSize: 14, fontWeight: "800" },
  block:      { width: "100%", borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: 8 },
  medal:      { fontSize: 28 },
  entryFlag:  { fontSize: 14 },
});

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: "#0a0a1a" },
  hdr:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  back:         { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backTxt:      { color: "#fff", fontSize: 22 },
  title:        { color: "#fff", fontSize: 20, fontWeight: "800" },
  tabs:         { flexDirection: "row", marginHorizontal: 16, backgroundColor: "#1a1a2e", borderRadius: 16, padding: 4, marginBottom: 12 },
  tab:          { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12 },
  tabActive:    { backgroundColor: Colors.indigo },
  tabEmoji:     { fontSize: 18 },
  tabLabel:     { color: Colors.muted, fontSize: 12, fontWeight: "600", marginTop: 2 },
  tabLabelActive: { color: "#fff" },
  center:       { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyEmoji:   { fontSize: 52 },
  emptyText:    { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptySubText: { color: Colors.muted, fontSize: 14 },
  row:          { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginVertical: 4, backgroundColor: "#111827", borderRadius: 14, padding: 12, gap: 10 },
  rowMe:        { backgroundColor: "#1e1b4b", borderWidth: 1, borderColor: Colors.indigo },
  rankNum:      { width: 36, color: Colors.muted, fontSize: 13, fontWeight: "700", textAlign: "center" },
  nameCol:      { flex: 1 },
  name:         { color: "#e2e8f0", fontSize: 14, fontWeight: "600" },
  location:     { color: Colors.muted, fontSize: 11, marginTop: 2 },
  ptsBox:       { alignItems: "flex-end" },
  pts:          { color: "#fff", fontSize: 16, fontWeight: "800" },
  ptsLabel:     { color: Colors.muted, fontSize: 10 },
  myBanner:     { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", backgroundColor: "#1e1b4b", borderTopWidth: 1, borderTopColor: Colors.indigo + "50", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  myBannerRank: { color: Colors.indigoLight, fontSize: 16, fontWeight: "800", width: 36 },
  myBannerName: { flex: 1, color: Colors.indigoLight, fontWeight: "600", fontSize: 13 },
  myBannerPts:  { color: Colors.indigo, fontWeight: "800", fontSize: 14 },
});
