import { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View,
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

const LEAGUES = [
  { name: "Başlangıç", min: 0,     max: 49,       emoji: "🌱", color: "#6b7280" },
  { name: "Bronz",     min: 50,    max: 249,      emoji: "🥉", color: "#cd7f32" },
  { name: "Gümüş",    min: 250,   max: 999,      emoji: "🥈", color: "#9ca3af" },
  { name: "Altın",    min: 1000,  max: 2999,     emoji: "🥇", color: "#f59e0b" },
  { name: "Elmas",    min: 3000,  max: 9999,     emoji: "💎", color: "#22d3ee" },
  { name: "Efsane",   min: 10000, max: Infinity, emoji: "👑", color: "#8b5cf6" },
];

function getLeague(points: number) {
  return LEAGUES.find(l => points >= l.min && points <= l.max) ?? LEAGUES[0];
}

const TABS: { key: LeaderboardType; label: string; emoji: string }[] = [
  { key: "fair",   label: "Fuar",    emoji: "🏟️" },
  { key: "turkey", label: "Türkiye", emoji: "🇹🇷" },
  { key: "world",  label: "Dünya",   emoji: "🌍" },
];

const RANK_COLORS = ["#f6d860", "#c0c0c0", "#cd7f32"];

function Avatar({ name, url, size = 44 }: { name: string; url?: string; size?: number }) {
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.indigo + "30", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: Colors.indigoLight, fontWeight: "700", fontSize: size * 0.38 }}>
        {(name || "?")[0].toUpperCase()}
      </Text>
    </View>
  );
}

function LeagueCard({ points }: { points: number }) {
  const league    = getLeague(points);
  const leagueIdx = LEAGUES.indexOf(league);
  const next      = LEAGUES[leagueIdx + 1];
  const progress  = next ? (points - league.min) / (next.min - league.min) : 1;
  const remaining = next ? next.min - points : 0;

  return (
    <View style={[lc.card, { borderColor: league.color + "55" }]}>
      <View style={lc.top}>
        <Text style={lc.bigEmoji}>{league.emoji}</Text>
        <View style={lc.info}>
          <Text style={[lc.leagueName, { color: league.color }]}>{league.name} Ligi</Text>
          <Text style={lc.pts}>{points.toLocaleString()} puan</Text>
        </View>
        {next && (
          <View style={[lc.nextBadge, { borderColor: next.color + "40" }]}>
            <Text style={lc.nextEmoji}>{next.emoji}</Text>
          </View>
        )}
      </View>
      <View style={lc.barBg}>
        <View
          style={[
            lc.barFill,
            { width: `${Math.min(progress * 100, 100)}%` as `${number}%`, backgroundColor: league.color },
          ]}
        />
      </View>
      <Text style={lc.hint}>
        {next
          ? `${next.emoji} ${next.name} için ${remaining.toLocaleString()} puan kaldı`
          : `${league.emoji} En yüksek ligdesin! Muhteşemsin 🎉`}
      </Text>
    </View>
  );
}

function Podium({ top3, myId }: { top3: Entry[]; myId: string | null }) {
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  return (
    <View style={pd.wrap}>
      {podiumOrder.map((entry) => {
        const rank   = entry.rank;
        const col    = rank === 1 ? 100 : rank === 2 ? 72 : 58;
        const color  = RANK_COLORS[rank - 1];
        const isMe   = entry.user_id === myId;
        const medals = ["🥇", "🥈", "🥉"];
        const league = getLeague(entry.points);
        return (
          <View key={entry.user_id} style={pd.col}>
            {isMe && <Text style={pd.youLabel}>SEN</Text>}
            <View style={{ position: "relative" }}>
              <Avatar name={entry.full_name} url={entry.avatar_url} size={rank === 1 ? 56 : 44} />
              <Text style={pd.avatarBadge}>{league.emoji}</Text>
            </View>
            <Text style={[pd.entryName, rank === 1 && { color: "#fff" }]} numberOfLines={1}>
              {entry.full_name?.split(" ")[0] ?? "—"}
            </Text>
            {entry.country_code ? <Text style={pd.entryFlag}>{flagEmoji(entry.country_code)}</Text> : null}
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

  const [tab, setTab]             = useState<LeaderboardType>(defaultTab);
  const [data, setData]           = useState<Entry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [myId, setMyId]           = useState<string | null>(null);
  const [myLifePts, setMyLifePts] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: auth }) => {
      const uid = auth.user?.id ?? null;
      setMyId(uid);
      if (uid) {
        const { data: score } = await supabase
          .from("user_lifetime_scores")
          .select("total_points")
          .eq("user_id", uid)
          .maybeSingle();
        setMyLifePts(score?.total_points ?? 0);
      }
    });
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

  const top3    = data.filter(e => e.rank <= 3);
  const rest    = data.filter(e => e.rank > 3);
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

      {/* My league card */}
      {myId !== null && <LeagueCard points={myLifePts} />}

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
          ListHeaderComponent={top3.length > 0 ? <Podium top3={top3} myId={myId} /> : null}
          renderItem={({ item }) => {
            const isMe     = item.user_id === myId;
            const league   = getLeague(item.points);
            const isDanger = item.rank >= 8 && item.rank <= 10;
            return (
              <View style={[styles.row, isMe && styles.rowMe, isDanger && !isMe && styles.rowDanger]}>
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
                <Text style={styles.rowBadge}>{league.emoji}</Text>
                <View style={styles.ptsBox}>
                  <Text style={[styles.pts, isMe && { color: Colors.indigoLight }]}>
                    {item.points.toLocaleString()}
                  </Text>
                  <Text style={styles.ptsLabel}>puan</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Sticky my position */}
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

const lc = StyleSheet.create({
  card:      { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, padding: 14 },
  top:       { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  bigEmoji:  { fontSize: 36 },
  info:      { flex: 1 },
  leagueName:{ fontSize: 16, fontWeight: "800" },
  pts:       { fontSize: 12, color: Colors.muted, marginTop: 2 },
  nextBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.card2, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  nextEmoji: { fontSize: 20 },
  barBg:     { height: 6, backgroundColor: Colors.card2, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  barFill:   { height: 6, borderRadius: 3 },
  hint:      { fontSize: 11, color: Colors.muted, textAlign: "center" },
});

const pd = StyleSheet.create({
  wrap:       { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", paddingTop: 16, paddingBottom: 8, gap: 8, paddingHorizontal: 16 },
  col:        { flex: 1, alignItems: "center", gap: 3 },
  youLabel:   { fontSize: 9, fontWeight: "800", color: Colors.indigo, letterSpacing: 1.5, marginBottom: 2 },
  avatarBadge:{ position: "absolute", bottom: -2, right: -4, fontSize: 14 },
  entryName:  { fontSize: 12, fontWeight: "700", color: Colors.muted, textAlign: "center" },
  pts:        { fontSize: 14, fontWeight: "800" },
  block:      { width: "100%", borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: 8 },
  medal:      { fontSize: 28 },
  entryFlag:  { fontSize: 14 },
});

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: "#0a0a1a" },
  hdr:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  back:          { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backTxt:       { color: "#fff", fontSize: 22 },
  title:         { color: "#fff", fontSize: 20, fontWeight: "800" },
  tabs:          { flexDirection: "row", marginHorizontal: 16, backgroundColor: "#1a1a2e", borderRadius: 16, padding: 4, marginBottom: 12 },
  tab:           { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12 },
  tabActive:     { backgroundColor: Colors.indigo },
  tabEmoji:      { fontSize: 18 },
  tabLabel:      { color: Colors.muted, fontSize: 12, fontWeight: "600", marginTop: 2 },
  tabLabelActive:{ color: "#fff" },
  center:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyEmoji:    { fontSize: 52 },
  emptyText:     { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptySubText:  { color: Colors.muted, fontSize: 14 },
  row:           { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginVertical: 4, backgroundColor: "#111827", borderRadius: 14, padding: 12, gap: 10 },
  rowMe:         { backgroundColor: "#1e1b4b", borderWidth: 1, borderColor: Colors.indigo },
  rowDanger:     { borderWidth: 1, borderColor: "#ef444450", backgroundColor: "#200a0a" },
  rankNum:       { width: 36, color: Colors.muted, fontSize: 13, fontWeight: "700", textAlign: "center" },
  nameCol:       { flex: 1 },
  name:          { color: "#e2e8f0", fontSize: 14, fontWeight: "600" },
  location:      { color: Colors.muted, fontSize: 11, marginTop: 2 },
  rowBadge:      { fontSize: 18 },
  ptsBox:        { alignItems: "flex-end" },
  pts:           { color: "#fff", fontSize: 16, fontWeight: "800" },
  ptsLabel:      { color: Colors.muted, fontSize: 10 },
  myBanner:      { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", backgroundColor: "#1e1b4b", borderTopWidth: 1, borderTopColor: Colors.indigo + "50", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  myBannerRank:  { color: Colors.indigoLight, fontSize: 16, fontWeight: "800", width: 36 },
  myBannerName:  { flex: 1, color: Colors.indigoLight, fontWeight: "600", fontSize: 13 },
  myBannerPts:   { color: Colors.indigo, fontWeight: "800", fontSize: 14 },
});
