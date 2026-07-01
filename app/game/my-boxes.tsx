import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Pressable,
  RefreshControl, StyleSheet, Text, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  getMyFairsWithBoxInfo,
  getMyBoxes,
  type FairWithBoxInfo,
} from "@/lib/api/gamification";

// ── Sabitler ─────────────────────────────────────────────────

const TIER_META = {
  common:    { emoji: "📦", label: "Yaygın",    color: "#94a3b8" },
  rare:      { emoji: "💎", label: "Nadir",     color: "#60a5fa" },
  epic:      { emoji: "⚡", label: "Destansı",  color: "#c084fc" },
  legendary: { emoji: "🏆", label: "Efsanevi",  color: "#fbbf24" },
};

// ── Durum kartı ───────────────────────────────────────────────

function StatusBadge({ status }: { status: FairWithBoxInfo["status"] }) {
  const cfg = {
    active:         { text: "Aktif",          bg: "#14532d", color: "#4ade80" },
    locked:         { text: "Kilitli",         bg: "#1e1b4b", color: "#a5b4fc" },
    no_boxes:       { text: "Ödül Yok",        bg: "#1c1917", color: "#78716c" },
    not_registered: { text: "Kayıtlı Değil",   bg: "#1c1917", color: "#78716c" },
  }[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.text}</Text>
    </View>
  );
}

// ── Fuar kutu kartı ───────────────────────────────────────────

function FairBoxCard({
  fair, onOpenFair,
}: {
  fair: FairWithBoxInfo;
  onOpenFair: (fair: FairWithBoxInfo) => void;
}) {
  const start = new Date(fair.event_start).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

  return (
    <View style={styles.fairCard}>
      {/* Başlık */}
      <View style={styles.fairCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fairName} numberOfLines={1}>{fair.event_name}</Text>
          <Text style={styles.fairMeta}>{start}{fair.event_location ? ` · ${fair.event_location}` : ""}</Text>
        </View>
        <StatusBadge status={fair.status} />
      </View>

      {/* Durum içeriği */}
      {fair.status === "active" && (
        <ActiveContent fair={fair} onOpenFair={onOpenFair} />
      )}
      {fair.status === "locked" && (
        <LockedContent fair={fair} />
      )}
      {(fair.status === "no_boxes" || fair.status === "not_registered") && (
        <NoBoxContent status={fair.status} />
      )}
    </View>
  );
}

// ── Aktif içerik: kutular var, giriş yapıldı ─────────────────

function ActiveContent({
  fair, onOpenFair,
}: {
  fair: FairWithBoxInfo;
  onOpenFair: (fair: FairWithBoxInfo) => void;
}) {
  return (
    <View style={styles.activeContent}>
      {/* Puan + kutu özeti */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{fair.total_points.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Puan</Text>
        </View>
        <View style={[styles.statChip, fair.unopened_boxes > 0 && styles.statChipHighlight]}>
          <Text style={[styles.statValue, fair.unopened_boxes > 0 && { color: "#a78bfa" }]}>
            {fair.unopened_boxes}
          </Text>
          <Text style={styles.statLabel}>Kutu</Text>
        </View>
      </View>

      {/* Puan eşikleri */}
      {fair.box_types.length > 0 && (
        <View style={styles.tiersRow}>
          {fair.box_types
            .sort((a, b) => a.points_required - b.points_required)
            .map(bt => {
              const m = TIER_META[bt.tier as keyof typeof TIER_META] ?? TIER_META.common;
              const reached = fair.total_points >= bt.points_required;
              return (
                <View key={bt.tier} style={[styles.tierChip, reached && { borderColor: m.color + "60" }]}>
                  <Text style={styles.tierEmoji}>{m.emoji}</Text>
                  <Text style={[styles.tierPts, reached && { color: m.color }]}>
                    {bt.points_required}
                  </Text>
                </View>
              );
            })}
        </View>
      )}

      {fair.unopened_boxes > 0 ? (
        <Pressable style={styles.openAllBtn} onPress={() => onOpenFair(fair)}>
          <Text style={styles.openAllBtnText}>
            🎁 {fair.unopened_boxes} Kutunu Aç
          </Text>
        </Pressable>
      ) : (
        <View style={styles.noBoxesYet}>
          <Text style={styles.noBoxesYetText}>
            Puan kazan, kutu kazan! Standları ziyaret et.
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Kilitli içerik: giriş yapılmamış ─────────────────────────

function LockedContent({ fair }: { fair: FairWithBoxInfo }) {
  const minPts = Math.min(...fair.box_types.map(b => b.points_required));
  return (
    <View style={styles.lockedContent}>
      <Text style={styles.lockEmoji}>🔒</Text>
      <Text style={styles.lockTitle}>Kutular Kilitli</Text>
      <Text style={styles.lockDesc}>
        Fuara giriş yapınca kutular aktifleşir. Kapıdaki QR kodu okutmanı ya da biletini göstermeni yeterli.
      </Text>
      {fair.box_types.length > 0 && (
        <Text style={styles.lockHint}>
          Bu fuarda {fair.box_types.length} kutu tipi var — ilki için {minPts} puan yeterli.
        </Text>
      )}
    </View>
  );
}

// ── Ödül yok içerik ───────────────────────────────────────────

function NoBoxContent({ status }: { status: "no_boxes" | "not_registered" }) {
  if (status === "not_registered") {
    return (
      <View style={styles.emptyContent}>
        <Text style={styles.emptyEmoji}>🎪</Text>
        <Text style={styles.emptyDesc}>Bu fuara kayıtlı değilsin.</Text>
      </View>
    );
  }
  return (
    <View style={styles.emptyContent}>
      <Text style={styles.emptyEmoji}>😊</Text>
      <Text style={styles.emptyDesc}>
        Bu fuarda kutu ödülü bulunmuyor ama puan kazanmaya ve networking yapmaya devam edebilirsin!
      </Text>
    </View>
  );
}

// ── Kutu listesi (fair seçince açılır) ────────────────────────

type Box = {
  id: string;
  loot_box_types: { name: string; tier: string };
  earned_at: string;
};

function BoxList({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const router = useRouter();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyBoxes(eventId).then(b => { setBoxes(b as Box[]); setLoading(false); });
  }, [eventId]);

  if (loading) return <ActivityIndicator color="#6366f1" style={{ marginVertical: 20 }} />;

  return (
    <View style={styles.boxListContainer}>
      <View style={styles.boxListHeader}>
        <Text style={styles.boxListTitle}>Açılmayı Bekleyen Kutular</Text>
        <Pressable onPress={onClose}><Text style={styles.boxListClose}>✕</Text></Pressable>
      </View>
      {boxes.length === 0 ? (
        <Text style={styles.noBoxText}>Açılacak kutu kalmadı 🎉</Text>
      ) : (
        boxes.map(box => {
          const m = TIER_META[box.loot_box_types.tier as keyof typeof TIER_META] ?? TIER_META.common;
          return (
            <Pressable
              key={box.id}
              style={styles.boxRow}
              onPress={() => {
                onClose();
                router.push({
                  pathname: "/game/open-box",
                  params: { box_id: box.id, box_name: box.loot_box_types.name },
                });
              }}
            >
              <Text style={styles.boxRowEmoji}>{m.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.boxRowName, { color: m.color }]}>{box.loot_box_types.name}</Text>
                <Text style={styles.boxRowMeta}>{m.label}</Text>
              </View>
              <Text style={styles.boxRowArrow}>Aç →</Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

// ── Ana Ekran ─────────────────────────────────────────────────

export default function MyBoxesScreen() {
  const router = useRouter();
  const [fairs, setFairs]         = useState<FairWithBoxInfo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFair, setSelectedFair] = useState<FairWithBoxInfo | null>(null);

  const load = useCallback(async () => {
    const data = await getMyFairsWithBoxInfo();
    // Aktif fuarlar önce, sonra kilitli, sonra ödülsüz
    const order = { active: 0, locked: 1, no_boxes: 2, not_registered: 3 };
    data.sort((a, b) => order[a.status] - order[b.status]);
    setFairs(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function onRefresh() { setRefreshing(true); load(); }

  if (loading) {
    return (
      <LinearGradient colors={["#0a0a1a", "#1a0a2e"]} style={styles.center}>
        <ActivityIndicator color="#6366f1" size="large" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0a0a1a", "#1a0a2e", "#0a0a1a"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.screenTitle}>Kutularım</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Seçili fuarın kutu listesi */}
        {selectedFair && (
          <BoxList
            eventId={selectedFair.event_id}
            onClose={() => setSelectedFair(null)}
          />
        )}

        {!selectedFair && (
          <FlatList
            data={fairs}
            keyExtractor={i => i.event_id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
            }
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={styles.emptyScreen}>
                <Text style={styles.emptyScreenEmoji}>🎪</Text>
                <Text style={styles.emptyScreenTitle}>Fuara kayıt ol</Text>
                <Text style={styles.emptyScreenDesc}>
                  Kayıtlı olduğun fuarların kutu ödülleri burada görünür.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <FairBoxCard
                fair={item}
                onOpenFair={f => setSelectedFair(f)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Stiller ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  center:           { flex: 1, alignItems: "center", justifyContent: "center" },
  header:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:          { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backText:         { color: "#fff", fontSize: 22 },
  screenTitle:      { color: "#fff", fontSize: 20, fontWeight: "700" },

  fairCard:         { backgroundColor: "#111827", borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  fairCardHeader:   { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  fairName:         { color: "#f1f5f9", fontSize: 16, fontWeight: "700", marginBottom: 3 },
  fairMeta:         { color: "#64748b", fontSize: 12 },

  badge:            { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText:        { fontSize: 11, fontWeight: "700" },

  // Aktif
  activeContent:    { gap: 10 },
  statsRow:         { flexDirection: "row", gap: 8 },
  statChip:         { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10, alignItems: "center" },
  statChipHighlight:{ backgroundColor: "rgba(99,102,241,0.12)", borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  statValue:        { color: "#fff", fontSize: 22, fontWeight: "800" },
  statLabel:        { color: "#64748b", fontSize: 11, marginTop: 2 },
  tiersRow:         { flexDirection: "row", gap: 6 },
  tierChip:         { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 8, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  tierEmoji:        { fontSize: 18, marginBottom: 3 },
  tierPts:          { color: "#64748b", fontSize: 12, fontWeight: "700" },
  openAllBtn:       { backgroundColor: "#6366f1", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  openAllBtnText:   { color: "#fff", fontSize: 16, fontWeight: "700" },
  noBoxesYet:       { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 12 },
  noBoxesYetText:   { color: "#64748b", fontSize: 13, textAlign: "center" },

  // Kilitli
  lockedContent:    { alignItems: "center", paddingVertical: 8, gap: 6 },
  lockEmoji:        { fontSize: 36 },
  lockTitle:        { color: "#a5b4fc", fontSize: 15, fontWeight: "700" },
  lockDesc:         { color: "#64748b", fontSize: 13, textAlign: "center", lineHeight: 18 },
  lockHint:         { color: "#4338ca", fontSize: 12, textAlign: "center", marginTop: 4 },

  // Boş
  emptyContent:     { alignItems: "center", paddingVertical: 8, gap: 6 },
  emptyEmoji:       { fontSize: 32 },
  emptyDesc:        { color: "#64748b", fontSize: 13, textAlign: "center", lineHeight: 18 },

  // Kutu listesi
  boxListContainer: { backgroundColor: "#111827", margin: 16, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  boxListHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  boxListTitle:     { color: "#fff", fontSize: 16, fontWeight: "700" },
  boxListClose:     { color: "#64748b", fontSize: 18, padding: 4 },
  noBoxText:        { color: "#64748b", textAlign: "center", paddingVertical: 16, fontSize: 14 },
  boxRow:           { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, marginBottom: 8 },
  boxRowEmoji:      { fontSize: 32, marginRight: 12 },
  boxRowName:       { fontSize: 15, fontWeight: "700" },
  boxRowMeta:       { color: "#64748b", fontSize: 12, marginTop: 2 },
  boxRowArrow:      { color: "#6366f1", fontSize: 13, fontWeight: "700" },

  // Boş ekran
  emptyScreen:      { alignItems: "center", paddingVertical: 80 },
  emptyScreenEmoji: { fontSize: 64, marginBottom: 16 },
  emptyScreenTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptyScreenDesc:  { color: "#64748b", fontSize: 14, textAlign: "center", paddingHorizontal: 32, lineHeight: 20 },
});
