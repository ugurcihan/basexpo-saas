import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { getMyFairsWithBoxInfo, type FairWithBoxInfo } from "@/lib/api/gamification";

const GM_EMAIL = "ztest@test.com";

// ── Fuar Kart ──────────────────────────────────────────────────

function FairCard({
  fair,
  onCheckin,
  onAddPoints,
  onGoBoxes,
  checkinDone,
  pending,
}: {
  fair: FairWithBoxInfo;
  onCheckin: () => void;
  onAddPoints: () => void;
  onGoBoxes: () => void;
  checkinDone: boolean;
  pending: boolean;
}) {
  const statusColors = {
    active:         { bg: "#14532d30", text: "#4ade80", label: "✅ Aktif" },
    locked:         { bg: "#1e1b4b30", text: "#a5b4fc", label: "🔒 Kilitli" },
    no_boxes:       { bg: "#1c191730", text: "#78716c", label: "Kutu Yok" },
    not_registered: { bg: "#1c191730", text: "#78716c", label: "Kayıtsız" },
  }[fair.status];

  return (
    <View style={styles.fairCard}>
      <View style={styles.fairHeader}>
        <Text style={styles.fairEmoji}>🏟️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.fairName} numberOfLines={1}>{fair.event_name}</Text>
          {fair.event_location ? <Text style={styles.fairMeta}>{fair.event_location}</Text> : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>{statusColors.label}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statVal}>{fair.total_points}</Text>
          <Text style={styles.statLbl}>Puan</Text>
        </View>
        <View style={[styles.statChip, fair.unopened_boxes > 0 && styles.statChipGold]}>
          <Text style={[styles.statVal, fair.unopened_boxes > 0 && { color: Colors.gold }]}>
            {fair.unopened_boxes}
          </Text>
          <Text style={styles.statLbl}>Kutu</Text>
        </View>
        {fair.box_types.length > 0 && (
          <View style={styles.statChip}>
            <Text style={[styles.statVal, { fontSize: 13 }]}>{fair.box_types.length}</Text>
            <Text style={styles.statLbl}>Kutu tipi</Text>
          </View>
        )}
      </View>

      {/* Box thresholds */}
      {fair.box_types.length > 0 && (
        <View style={styles.tiersRow}>
          {fair.box_types
            .sort((a, b) => a.points_required - b.points_required)
            .map(bt => {
              const reached = fair.total_points >= bt.points_required;
              return (
                <View key={bt.tier} style={[styles.tierChip, reached && styles.tierChipReached]}>
                  <Text style={[styles.tierChipText, reached && { color: Colors.gold }]}>
                    {bt.name} {bt.points_required}p
                  </Text>
                </View>
              );
            })}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsCol}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnGreen, (pending || checkinDone) && styles.actionBtnDisabled]}
          onPress={onCheckin}
          disabled={pending || checkinDone}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>
            {checkinDone ? "✅ Giriş Yapıldı" : "✅  Fuara Giriş Simüle (+50)"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnViolet, pending && styles.actionBtnDisabled]}
          onPress={onAddPoints}
          disabled={pending}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>+20  Test Puanı (tekrar bas)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnGold]}
          onPress={onGoBoxes}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>🎁  Kutularıma Git →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Ana Ekran ─────────────────────────────────────────────────

export default function GMPanelScreen() {
  const router  = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [userId, setUserId]         = useState<string | null>(null);
  const [fairs, setFairs]           = useState<FairWithBoxInfo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [pending, setPending]       = useState(false);
  const [lastMsg, setLastMsg]       = useState<string | null>(null);
  const [checkinDone, setCheckinDone] = useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== GM_EMAIL) {
          if (active) { setAuthorized(false); setLoading(false); }
          return;
        }
        setUserId(user.id);
        setAuthorized(true);

        // Load fair data
        const data = await getMyFairsWithBoxInfo();
        data.sort((a, b) => {
          const order = { active: 0, locked: 1, no_boxes: 2, not_registered: 3 };
          return order[a.status] - order[b.status];
        });

        // Check which fairs already have checkin
        const eventIds = data.map(f => f.event_id);
        if (eventIds.length > 0) {
          const { data: checkins } = await supabase
            .from("fair_checkins")
            .select("event_id")
            .eq("visitor_id", user.id)
            .in("event_id", eventIds);
          const done: Record<string, boolean> = {};
          (checkins ?? []).forEach(c => { done[c.event_id] = true; });
          if (active) setCheckinDone(done);
        }

        if (active) { setFairs(data); setLoading(false); }
      })();
      return () => { active = false; };
    }, [])
  );

  async function refresh() {
    if (!userId) return;
    const data = await getMyFairsWithBoxInfo();
    data.sort((a, b) => {
      const order = { active: 0, locked: 1, no_boxes: 2, not_registered: 3 };
      return order[a.status] - order[b.status];
    });
    setFairs(data);
  }

  async function handleCheckin(event_id: string) {
    if (!userId || pending) return;
    setPending(true);
    setLastMsg(null);

    await supabase.from("fair_checkins").insert({ event_id, visitor_id: userId });

    const { error } = await supabase.from("loyalty_points").insert({
      event_id, visitor_id: userId, points: 50, reason: "checkin",
    });

    setCheckinDone(prev => ({ ...prev, [event_id]: true }));

    if (error?.code === "23505") {
      setLastMsg("ℹ️  Giriş check-ini zaten vardı. fair_checkins satırı eklendi.");
    } else if (error) {
      setLastMsg(`❌  Hata: ${error.message}`);
    } else {
      setLastMsg("✅  Giriş yapıldı + 50 puan kazandın! Trigger kutu kontrol etti.");
    }

    await refresh();
    setPending(false);
  }

  async function handleAddPoints(event_id: string) {
    if (!userId || pending) return;
    setPending(true);
    setLastMsg(null);

    const { error } = await supabase.from("loyalty_points").insert({
      event_id, visitor_id: userId, points: 20, reason: "gm_test",
    });

    if (error) {
      setLastMsg(`❌  Hata: ${error.message}`);
    } else {
      setLastMsg("✅  +20 gm_test puanı eklendi. Trigger kutu eşiklerini kontrol etti.");
    }

    await refresh();
    setPending(false);
  }

  // ── Unauthorized ────────────────────────────────────────────

  if (authorized === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthorizedBox}>
          <Text style={styles.unauthorizedIcon}>🚫</Text>
          <Text style={styles.unauthorizedTitle}>Yetkisiz Erişim</Text>
          <Text style={styles.unauthorizedDesc}>Bu panel sadece ztest@test.com hesabı için görünür.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ─────────────────────────────────────────────────

  if (loading || authorized === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#7c3aed" size="large" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  // ── Main ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
            <Text style={styles.headerBackText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>🎮  GM Paneli</Text>
            <Text style={styles.headerSub}>ztest@test.com · Test Modu</Text>
          </View>
          <View style={styles.testBadge}>
            <Text style={styles.testBadgeText}>⚠️ TEST</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Bu panel gerçek DB'ye yazar. Trigger zinciri: loyalty_points INSERT → check_box_milestones() → user_loot_boxes. "Giriş" bir kez çalışır (unique index), "+20 Puan" sınırsız tekrar edilebilir.
          </Text>
        </View>

        {/* Last message */}
        {lastMsg && (
          <View style={styles.msgBox}>
            <Text style={styles.msgText}>{lastMsg}</Text>
          </View>
        )}

        {/* No fairs */}
        {fairs.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🎪</Text>
            <Text style={styles.emptyTitle}>Kayıtlı fuar yok</Text>
            <Text style={styles.emptyDesc}>
              ztest@test.com hesabını bir fuara kayıt edin, sonra buraya tekrar gelin.
            </Text>
          </View>
        )}

        {/* Fair cards */}
        {fairs.map(fair => (
          <FairCard
            key={fair.event_id}
            fair={fair}
            checkinDone={!!checkinDone[fair.event_id]}
            pending={pending}
            onCheckin={() => handleCheckin(fair.event_id)}
            onAddPoints={() => handleAddPoints(fair.event_id)}
            onGoBoxes={() => router.push("/game/my-boxes" as any)}
          />
        ))}

        {pending && (
          <ActivityIndicator color="#7c3aed" style={{ marginTop: 16 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Stiller ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#0d0a1a" },
  scroll:           { padding: 16, paddingBottom: 60 },

  header:           { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  headerBack:       { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerBackText:   { color: Colors.white, fontSize: 22 },
  headerTitle:      { fontSize: 20, fontWeight: "800", color: Colors.white },
  headerSub:        { fontSize: 12, color: Colors.muted, marginTop: 1 },
  testBadge:        { backgroundColor: "#ef444430", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#ef444460" },
  testBadgeText:    { color: "#ef4444", fontSize: 11, fontWeight: "800" },

  infoBox:          { backgroundColor: "#1a0a2e", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#7c3aed40" },
  infoText:         { color: Colors.muted, fontSize: 12, lineHeight: 18 },

  msgBox:           { backgroundColor: "#0a2010", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#4ade8040" },
  msgText:          { color: "#4ade80", fontSize: 13, fontWeight: "600" },

  emptyBox:         { alignItems: "center", paddingVertical: 60 },
  emptyIcon:        { fontSize: 56, marginBottom: 12 },
  emptyTitle:       { fontSize: 18, fontWeight: "700", color: Colors.white, marginBottom: 8 },
  emptyDesc:        { fontSize: 13, color: Colors.muted, textAlign: "center", lineHeight: 20, paddingHorizontal: 24 },

  fairCard:         { backgroundColor: Colors.card, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#7c3aed30" },
  fairHeader:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  fairEmoji:        { fontSize: 28 },
  fairName:         { fontSize: 16, fontWeight: "700", color: Colors.white },
  fairMeta:         { fontSize: 12, color: Colors.muted, marginTop: 2 },
  statusBadge:      { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:       { fontSize: 11, fontWeight: "700" },

  statsRow:         { flexDirection: "row", gap: 8, marginBottom: 12 },
  statChip:         { flex: 1, backgroundColor: Colors.card2, borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statChipGold:     { borderColor: Colors.gold + "50", backgroundColor: Colors.gold + "10" },
  statVal:          { color: Colors.white, fontSize: 20, fontWeight: "800" },
  statLbl:          { color: Colors.muted, fontSize: 10, marginTop: 2 },

  tiersRow:         { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 },
  tierChip:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border },
  tierChipReached:  { borderColor: Colors.gold + "60", backgroundColor: Colors.gold + "10" },
  tierChipText:     { color: Colors.muted, fontSize: 12, fontWeight: "600" },

  actionsCol:       { gap: 8 },
  actionBtn:        { borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  actionBtnGreen:   { backgroundColor: "#15803d" },
  actionBtnViolet:  { backgroundColor: "#7c3aed" },
  actionBtnGold:    { backgroundColor: "#92400e" },
  actionBtnDisabled:{ opacity: 0.4 },
  actionBtnText:    { color: "#fff", fontSize: 15, fontWeight: "700" },

  unauthorizedBox:  { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  unauthorizedIcon: { fontSize: 64 },
  unauthorizedTitle:{ fontSize: 22, fontWeight: "800", color: Colors.white },
  unauthorizedDesc: { fontSize: 14, color: Colors.muted, textAlign: "center", lineHeight: 20 },
  backBtn:          { marginTop: 16, backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13, borderWidth: 1, borderColor: Colors.border },
  backBtnText:      { color: Colors.white, fontSize: 15, fontWeight: "700" },
});
