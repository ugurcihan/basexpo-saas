/**
 * GM Paneli — sadece ztest@test.com
 * Tüm fuarları listeler, anında kayıt + giriş + puan + navigasyon sağlar.
 */
import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { getMyFairsWithBoxInfo, type FairWithBoxInfo } from "@/lib/api/gamification";

const GM_EMAIL = "ztest@test.com";

// ── Types ─────────────────────────────────────────────────────

type EventRow = {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  status: string;
};

type FairState = {
  event: EventRow;
  registered: boolean;
  boxInfo: FairWithBoxInfo | null;
  checkinDone: boolean;
};

// ── Helpers ───────────────────────────────────────────────────

function randomTicket() {
  return "GM-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ── Fair Card ─────────────────────────────────────────────────

function FairCard({
  state,
  pending,
  onRegister,
  onCheckin,
  onPoints,
  onGoBoxes,
}: {
  state: FairState;
  pending: string | null;
  onRegister: (id: string) => void;
  onCheckin: (id: string) => void;
  onPoints: (id: string) => void;
  onGoBoxes: () => void;
}) {
  const { event, registered, boxInfo, checkinDone } = state;
  const isLoading = pending === event.id;
  const pts = boxInfo?.total_points ?? 0;
  const boxes = boxInfo?.unopened_boxes ?? 0;

  return (
    <View style={[s.card, registered && s.cardRegistered]}>
      {/* Title row */}
      <View style={s.cardHeader}>
        <Text style={s.cardEmoji}>🏟️</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.cardName} numberOfLines={1}>{event.name}</Text>
          {event.location ? <Text style={s.cardMeta}>{event.location}</Text> : null}
        </View>
        <View style={[s.regBadge, registered ? s.regBadgeYes : s.regBadgeNo]}>
          <Text style={[s.regBadgeText, registered ? { color: "#4ade80" } : { color: "#94a3b8" }]}>
            {registered ? "Kayıtlı ✓" : "Kayıtsız"}
          </Text>
        </View>
      </View>

      {/* Stats (only if registered) */}
      {registered && (
        <View style={s.statsRow}>
          <View style={s.statChip}>
            <Text style={s.statVal}>{pts}</Text>
            <Text style={s.statLbl}>Puan</Text>
          </View>
          <View style={[s.statChip, boxes > 0 && s.statChipGold]}>
            <Text style={[s.statVal, boxes > 0 && { color: Colors.gold }]}>{boxes}</Text>
            <Text style={s.statLbl}>Kutu</Text>
          </View>
          <View style={s.statChip}>
            <Text style={[s.statVal, { color: checkinDone ? "#4ade80" : Colors.muted }]}>
              {checkinDone ? "✓" : "—"}
            </Text>
            <Text style={s.statLbl}>Giriş</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      {isLoading ? (
        <ActivityIndicator color="#7c3aed" style={{ marginTop: 10 }} />
      ) : !registered ? (
        <TouchableOpacity style={[s.btn, s.btnPurple]} onPress={() => onRegister(event.id)} activeOpacity={0.8}>
          <Text style={s.btnText}>⚡  Anında Fuara Kayıt Ol</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.actCol}>
          <TouchableOpacity
            style={[s.btn, s.btnGreen, checkinDone && s.btnDisabled]}
            onPress={() => onCheckin(event.id)}
            disabled={checkinDone}
            activeOpacity={0.8}
          >
            <Text style={s.btnText}>{checkinDone ? "✅  Giriş Yapıldı" : "✅  Fuara Giriş Simüle (+50)"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btn, s.btnPurple]} onPress={() => onPoints(event.id)} activeOpacity={0.8}>
            <Text style={s.btnText}>+20  Test Puanı (sınırsız bas)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btn, s.btnGold]} onPress={onGoBoxes} activeOpacity={0.8}>
            <Text style={s.btnText}>🎁  Kutularıma Git →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function GMPanelScreen() {
  const router = useRouter();
  const [authorized, setAuthorized]   = useState<boolean | null>(null);
  const [userId, setUserId]           = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [fairStates, setFairStates]   = useState<FairState[]>([]);
  const [pending, setPending]         = useState<string | null>(null);
  const [toast, setToast]             = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function loadAll(uid: string) {
    // 1. Tüm fuarlar
    const { data: events } = await supabase
      .from("events")
      .select("id, name, location, start_date, status")
      .in("status", ["published", "active"])
      .order("start_date", { ascending: false });

    // 2. Kullanıcının kayıtlı fuarları
    const { data: regs } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("visitor_id", uid);
    const registeredSet = new Set((regs ?? []).map(r => r.event_id));

    // 3. Kutu/puan bilgisi
    const boxData = await getMyFairsWithBoxInfo();
    const boxMap = new Map(boxData.map(b => [b.event_id, b]));

    // 4. Check-in bilgisi
    const eventIds = (events ?? []).map(e => e.id);
    let checkinSet = new Set<string>();
    if (eventIds.length > 0) {
      const { data: checkins } = await supabase
        .from("fair_checkins")
        .select("event_id")
        .eq("visitor_id", uid)
        .in("event_id", eventIds);
      checkinSet = new Set((checkins ?? []).map(c => c.event_id));
    }

    const states: FairState[] = (events ?? []).map(ev => ({
      event: ev as EventRow,
      registered: registeredSet.has(ev.id),
      boxInfo: boxMap.get(ev.id) ?? null,
      checkinDone: checkinSet.has(ev.id),
    }));

    // Kayıtlılar önce
    states.sort((a, b) => Number(b.registered) - Number(a.registered));
    setFairStates(states);
  }

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
        if (active) { setUserId(user.id); setAuthorized(true); }
        await loadAll(user.id);
        if (active) setLoading(false);
      })();
      return () => { active = false; };
    }, [])
  );

  async function handleRegister(eventId: string) {
    if (!userId) return;
    setPending(eventId);
    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      visitor_id: userId,
      ticket_code: randomTicket(),
      kvkk_consent: true,
      status: "confirmed",
    });
    if (error?.code === "23505") {
      showToast("ℹ️  Zaten kayıtlısın.");
    } else if (error) {
      showToast(`❌  ${error.message}`);
    } else {
      showToast("✅  Fuara anında kayıt olundu!");
    }
    await loadAll(userId);
    setPending(null);
  }

  async function handleCheckin(eventId: string) {
    if (!userId) return;
    setPending(eventId);
    await supabase.from("fair_checkins").insert({ event_id: eventId, visitor_id: userId });
    const { error } = await supabase.from("loyalty_points").insert({
      event_id: eventId, visitor_id: userId, points: 50, reason: "checkin",
    });
    if (error?.code === "23505") {
      showToast("ℹ️  Checkin puanı zaten verilmiş. fair_checkins satırı eklendi.");
    } else {
      showToast("✅  Giriş yapıldı + 50 puan! Trigger kutu kontrol etti.");
    }
    await loadAll(userId);
    setPending(null);
  }

  async function handlePoints(eventId: string) {
    if (!userId) return;
    setPending(eventId);
    const { error } = await supabase.from("loyalty_points").insert({
      event_id: eventId, visitor_id: userId, points: 20, reason: "gm_test",
    });
    if (error) {
      showToast(`❌  ${error.message}`);
    } else {
      showToast("✅  +20 gm_test puanı eklendi → trigger kutu eşiği kontrol etti.");
    }
    await loadAll(userId);
    setPending(null);
  }

  // ── Guards ───────────────────────────────────────────────────

  if (authorized === false) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <Text style={{ fontSize: 56, marginBottom: 12 }}>🚫</Text>
          <Text style={s.bigTitle}>Yetkisiz Erişim</Text>
          <Text style={s.muted}>Bu panel sadece ztest@test.com içindir.</Text>
          <TouchableOpacity style={[s.btn, s.btnPurple, { marginTop: 24, paddingHorizontal: 28 }]} onPress={() => router.back()}>
            <Text style={s.btnText}>← Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || authorized === null) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator color="#7c3aed" size="large" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={{ color: "#fff", fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.bigTitle}>🎮  GM Paneli</Text>
            <Text style={s.muted}>ztest@test.com — Her şeye erişim</Text>
          </View>
          <View style={s.testBadge}>
            <Text style={s.testBadgeText}>⚠️ TEST</Text>
          </View>
        </View>

        {/* Toast */}
        {toast && (
          <View style={s.toast}>
            <Text style={s.toastText}>{toast}</Text>
          </View>
        )}

        {/* Quick Nav */}
        <Text style={s.sectionTitle}>Hızlı Navigasyon</Text>
        <View style={s.navRow}>
          {[
            { label: "📇  Kartvizitler", path: "/(tabs)/contacts" },
            { label: "🎟️  Biletlerim",   path: "/(tabs)/tickets"  },
            { label: "🎁  Kutularım",    path: "/game/my-boxes"   },
            { label: "🏆  Liderlik",     path: "/game/leaderboard"},
          ].map(item => (
            <TouchableOpacity
              key={item.path}
              style={s.navBtn}
              onPress={() => router.push(item.path as any)}
              activeOpacity={0.8}
            >
              <Text style={s.navBtnText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fairs */}
        <Text style={s.sectionTitle}>
          Tüm Fuarlar ({fairStates.length})
        </Text>

        {fairStates.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎪</Text>
            <Text style={s.bigTitle}>Aktif fuar bulunamadı</Text>
            <Text style={s.muted}>Supabase'de "published" veya "active" statüsünde fuar yok.</Text>
          </View>
        ) : (
          fairStates.map(state => (
            <FairCard
              key={state.event.id}
              state={state}
              pending={pending}
              onRegister={handleRegister}
              onCheckin={handleCheckin}
              onPoints={handlePoints}
              onGoBoxes={() => router.push("/game/my-boxes" as any)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#0d0a1a" },
  scroll:         { padding: 16, paddingBottom: 60 },
  center:         { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },

  header:         { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn:        { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  bigTitle:       { fontSize: 20, fontWeight: "800", color: Colors.white },
  muted:          { fontSize: 12, color: Colors.muted, marginTop: 2 },
  testBadge:      { backgroundColor: "#ef444430", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#ef444460" },
  testBadgeText:  { color: "#ef4444", fontSize: 11, fontWeight: "800" },

  toast:          { backgroundColor: "#0a2010", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#4ade8040" },
  toastText:      { color: "#4ade80", fontSize: 13, fontWeight: "600" },

  sectionTitle:   { fontSize: 14, fontWeight: "700", color: Colors.muted, marginBottom: 10, marginTop: 4, letterSpacing: 0.5 },

  navRow:         { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  navBtn:         { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: "#7c3aed40" },
  navBtnText:     { color: Colors.white, fontSize: 13, fontWeight: "700" },

  card:           { backgroundColor: Colors.card, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardRegistered: { borderColor: "#7c3aed50" },
  cardHeader:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  cardEmoji:      { fontSize: 26 },
  cardName:       { fontSize: 15, fontWeight: "700", color: Colors.white },
  cardMeta:       { fontSize: 11, color: Colors.muted, marginTop: 2 },
  regBadge:       { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  regBadgeYes:    { backgroundColor: "#14532d40" },
  regBadgeNo:     { backgroundColor: Colors.card2 },
  regBadgeText:   { fontSize: 11, fontWeight: "700" },

  statsRow:       { flexDirection: "row", gap: 8, marginBottom: 12 },
  statChip:       { flex: 1, backgroundColor: Colors.card2, borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statChipGold:   { borderColor: Colors.gold + "50" },
  statVal:        { color: Colors.white, fontSize: 18, fontWeight: "800" },
  statLbl:        { color: Colors.muted, fontSize: 10, marginTop: 2 },

  actCol:         { gap: 8 },
  btn:            { borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  btnPurple:      { backgroundColor: "#7c3aed" },
  btnGreen:       { backgroundColor: "#15803d" },
  btnGold:        { backgroundColor: "#92400e" },
  btnDisabled:    { opacity: 0.45 },
  btnText:        { color: "#fff", fontSize: 14, fontWeight: "700" },

  emptyBox:       { alignItems: "center", paddingVertical: 60 },
});
