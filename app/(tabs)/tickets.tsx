import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { Zap, Award, Trophy, Ticket as TicketIcon, MapPin, Calendar, Gamepad2 } from "lucide-react-native";
import { fetchMyRegistrations, type RegistrationRow } from "@/lib/api/registrations";
import { getMyFairsWithBoxInfo, type FairWithBoxInfo } from "@/lib/api/gamification";
import QRCode from "react-native-qrcode-svg";
import Svg, { Line } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");

type ActiveTab = "tickets" | "loyalty" | "game";
type PointRow  = { reason: string; points: number; created_at: string };
type Badge     = { name: string; icon: string; earned_at: string };

const REASON_LABELS: Record<string, string> = {
  booth_visit: "Stant Ziyareti",
  checkin: "Fuara Giriş",
  meeting: "Toplantı",
  connection: "Bağlantı",
  video: "Video İzledi",
  survey: "Anketi Doldurdu",
  card_view: "Kartvizit Açıldı",
};

const STATUS_CONFIG = {
  confirmed:        { border: Colors.green, bg: Colors.green + "15", label: "Onaylı",           labelColor: Colors.green },
  pending_approval: { border: Colors.amber, bg: Colors.amber + "15", label: "İncelemede",       labelColor: Colors.amber },
  waitlisted:       { border: Colors.gold,  bg: Colors.gold  + "15", label: "Bekleme Listesi",  labelColor: Colors.gold  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function DashedLine() {
  return (
    <Svg height="2" width={SCREEN_W - 40} style={{ marginVertical: 14 }}>
      <Line x1="0" y1="1" x2={SCREEN_W - 40} y2="1"
        stroke="rgba(255,255,255,0.12)" strokeDasharray="6,4" strokeWidth="1" />
    </Svg>
  );
}

function TicketCard({ reg, userId, userName }: { reg: RegistrationRow; userId: string; userName: string }) {
  const config = STATUS_CONFIG[reg.status] ?? STATUS_CONFIG.waitlisted;
  const event  = reg.event;
  const qrValue = JSON.stringify({ vid: userId, tc: reg.ticket_code, n: userName, eid: event?.id, ev: event?.name });

  return (
    <View style={[styles.ticketCard, { borderLeftColor: config.border, backgroundColor: config.bg }]}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketEventName} numberOfLines={2}>{event?.name ?? "Etkinlik"}</Text>
        <View style={[styles.statusBadge, { backgroundColor: config.border + "25" }]}>
          <Text style={[styles.statusBadgeText, { color: config.labelColor }]}>{config.label}</Text>
        </View>
      </View>
      {event && (
        <View style={styles.ticketMeta}>
          <View style={styles.ticketMetaRow}>
            <Calendar color={Colors.muted} size={13} />
            <Text style={styles.ticketMetaText}>{formatDate(event.start_date)} • {formatTime(event.start_date)}</Text>
          </View>
          <View style={styles.ticketMetaRow}>
            <MapPin color={Colors.muted} size={13} />
            <Text style={styles.ticketMetaText} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>
      )}
      {reg.status === "confirmed" && reg.ticket_code ? (
        <>
          <DashedLine />
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode value={qrValue} size={130} color="#0a0a1a" backgroundColor="#ffffff" />
            </View>
            <Text style={styles.ticketCode}>{reg.ticket_code}</Text>
            <Text style={styles.ticketCodeLabel}>Giriş QR Kodu</Text>
          </View>
        </>
      ) : (
        <View style={styles.pendingInfo}>
          <Text style={styles.pendingText}>
            {reg.status === "pending_approval"
              ? "Başvurunuz organizatör tarafından inceleniyor."
              : "Bekleme listesindeysiniz. Yer açıldığında bildirim alacaksınız."}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TicketsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("tickets");

  // Tickets + loyalty data
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [totalPoints, setTotalPoints]     = useState(0);
  const [points, setPoints]               = useState<PointRow[]>([]);
  const [badges, setBadges]               = useState<Badge[]>([]);
  const [userId, setUserId]               = useState<string>("");
  const [userName, setUserName]           = useState<string>("");

  // Game data
  const [fairs, setFairs]                 = useState<FairWithBoxInfo[]>([]);

  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const [regsData, profileRes, pointsRes, badgesRes, fairsData] = await Promise.all([
      fetchMyRegistrations(user.id),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase.from("loyalty_points")
        .select("reason, points, created_at")
        .eq("visitor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("visitor_badges")
        .select("earned_at, badge:badge_definitions(name, icon)")
        .eq("visitor_id", user.id)
        .order("earned_at", { ascending: false }),
      getMyFairsWithBoxInfo(),
    ]);

    setRegistrations(regsData);
    setUserName(profileRes.data?.full_name ?? "");

    const rows = pointsRes.data ?? [];
    setPoints(rows as PointRow[]);
    setTotalPoints(rows.reduce((s, r) => s + (r.points ?? 0), 0));

    setBadges(
      (badgesRes.data ?? []).map(b => {
        const badge = Array.isArray(b.badge) ? b.badge[0] : b.badge;
        return { name: badge?.name ?? "", icon: badge?.icon ?? "🏅", earned_at: b.earned_at };
      })
    );

    setFairs(fairsData);
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(useCallback(() => { loadData(); }, []));

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  const upcoming   = registrations.filter(r => r.event && new Date(r.event.end_date) >= new Date());
  const past       = registrations.filter(r => r.event && new Date(r.event.end_date) < new Date());
  const totalBoxes = fairs.reduce((s, f) => s + f.unopened_boxes, 0);
  const gamePts    = fairs.reduce((s, f) => s + f.total_points, 0);
  const activeFairs = fairs.filter(f => f.status === "active");

  return (
    <SafeAreaView style={styles.container}>

      {/* 3-tab switcher */}
      <View style={styles.tabSwitcherContainer}>
        <View style={styles.tabSwitcher}>
          {([
            { key: "tickets", label: "Biletler",  Icon: TicketIcon },
            { key: "loyalty", label: "Puanlarım", Icon: Zap       },
            { key: "game",    label: "Oyunlar",   Icon: Gamepad2  },
          ] as const).map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setActiveTab(key)}
              >
                <Icon color={active ? Colors.white : Colors.muted} size={13} />
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.indigo} />
        }
      >

        {/* ── BİLETLER ── */}
        {activeTab === "tickets" && (
          <>
            {registrations.length === 0 ? (
              <View style={styles.emptyState}>
                <TicketIcon color={Colors.muted} size={48} />
                <Text style={styles.emptyTitle}>Henüz biletiniz yok</Text>
                <Text style={styles.emptyText}>Keşfet sekmesinden etkinliklere kaydolarak biletlerinizi buradan takip edebilirsiniz.</Text>
              </View>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Yaklaşan</Text>
                    {upcoming.map(reg => (
                      <TicketCard key={reg.id} reg={reg} userId={userId} userName={userName} />
                    ))}
                  </>
                )}
                {past.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Geçmiş</Text>
                    {past.map(reg => (
                      <TicketCard key={reg.id} reg={reg} userId={userId} userName={userName} />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── PUANLARIM ── */}
        {activeTab === "loyalty" && (
          <>
            <View style={styles.totalCard}>
              <Zap color={Colors.gold} size={36} />
              <Text style={styles.totalValue}>{totalPoints}</Text>
              <Text style={styles.totalLabel}>Toplam Puan</Text>
            </View>

            {badges.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Award color={Colors.gold} size={16} />
                  <Text style={styles.sectionTitle}>Rozetlerim</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }} contentContainerStyle={{ gap: 10 }}>
                  {badges.map((b, i) => (
                    <View key={i} style={styles.badgeCard}>
                      <Text style={styles.badgeIcon}>{b.icon}</Text>
                      <Text style={styles.badgeName} numberOfLines={2}>{b.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.sectionRow}>
              <Trophy color={Colors.indigo} size={16} />
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
          </>
        )}

        {/* ── OYUNLAR ── */}
        {activeTab === "game" && (
          <>
            {/* İstatistikler */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{gamePts}</Text>
                <Text style={styles.statLabel}>Bu Fuarda</Text>
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
              <Text style={styles.ctaArrow}>›</Text>
            </TouchableOpacity>

            {/* Ödüller CTA */}
            {activeFairs.length > 0 && (
              <>
                <Text style={[styles.sectionTitleLg, { marginBottom: 10 }]}>Ödüller</Text>
                {activeFairs.map(fair => (
                  <TouchableOpacity
                    key={`reward-${fair.event_id}`}
                    style={styles.rewardsFairCard}
                    onPress={() => router.push({ pathname: "/game/rewards", params: { event_id: fair.event_id } } as any)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.fairCardLeft}>
                      <Text style={styles.fairEmoji}>🎁</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fairName} numberOfLines={1}>{fair.event_name}</Text>
                        <Text style={styles.fairSub}>Milestone ödüllerini gör</Text>
                      </View>
                    </View>
                    <Text style={[styles.ctaArrow, { color: "#f59e0b" }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Liderlik Tabloları */}
            <Text style={styles.sectionTitleLg}>Liderlik Tabloları</Text>

            <TouchableOpacity
              style={styles.leaderboardBtn}
              onPress={() => router.push("/game/leaderboard" as any)}
              activeOpacity={0.85}
            >
              <View style={styles.leaderboardBtnInner}>
                <Text style={styles.leaderboardPodium}>🥇🥈🥉</Text>
                <View>
                  <Text style={styles.leaderboardTitle}>Türkiye & Dünya</Text>
                  <Text style={styles.leaderboardSub}>Tüm zamanlı sıralama</Text>
                </View>
              </View>
              <Text style={styles.ctaArrow}>›</Text>
            </TouchableOpacity>

            {activeFairs.map(fair => (
              <TouchableOpacity
                key={fair.event_id}
                style={styles.fairCard}
                onPress={() => router.push({ pathname: "/game/leaderboard", params: { event_id: fair.event_id } } as any)}
                activeOpacity={0.85}
              >
                <View style={styles.fairCardLeft}>
                  <Text style={styles.fairEmoji}>🏟️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fairName} numberOfLines={1}>{fair.event_name}</Text>
                    <Text style={styles.fairSub}>{fair.total_points} puan · Fuar sıralaması</Text>
                  </View>
                </View>
                <Text style={styles.ctaArrow}>›</Text>
              </TouchableOpacity>
            ))}

            {/* Nasıl Puan Kazanırsın */}
            <Text style={[styles.sectionTitleLg, { marginTop: 8 }]}>Nasıl Puan Kazanırsın?</Text>
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
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: Colors.bg },
  tabSwitcherContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  tabSwitcher:          { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 30, padding: 4, borderWidth: 1, borderColor: Colors.border },
  tabBtn:               { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 26 },
  tabBtnActive:         { backgroundColor: Colors.indigo },
  tabBtnText:           { fontSize: 12, fontWeight: "700", color: Colors.muted },
  tabBtnTextActive:     { color: Colors.white },
  scroll:               { paddingHorizontal: 20, paddingBottom: 48 },
  sectionTitle:         { fontSize: 15, fontWeight: "800", color: Colors.white, marginBottom: 12 },
  sectionTitleLg:       { fontSize: 17, fontWeight: "800", color: Colors.white, marginBottom: 12 },
  sectionRow:           { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  // Ticket
  ticketCard:           { borderRadius: 18, borderLeftWidth: 4, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  ticketHeader:         { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  ticketEventName:      { fontSize: 16, fontWeight: "800", color: Colors.white, flex: 1 },
  statusBadge:          { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  statusBadgeText:      { fontSize: 11, fontWeight: "700" },
  ticketMeta:           { gap: 6 },
  ticketMetaRow:        { flexDirection: "row", alignItems: "center", gap: 6 },
  ticketMetaText:       { fontSize: 12, color: Colors.muted, flex: 1 },
  qrContainer:          { alignItems: "center", gap: 10 },
  qrWrapper:            { padding: 12, backgroundColor: "#ffffff", borderRadius: 14 },
  ticketCode:           { fontSize: 18, fontWeight: "900", color: Colors.white, letterSpacing: 4, fontVariant: ["tabular-nums"] as any },
  ticketCodeLabel:      { fontSize: 11, color: Colors.muted },
  pendingInfo:          { backgroundColor: Colors.card2, borderRadius: 10, padding: 12 },
  pendingText:          { fontSize: 12, color: Colors.muted, lineHeight: 18 },
  emptyState:           { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyTitle:           { fontSize: 18, fontWeight: "800", color: Colors.white },
  emptyText:            { fontSize: 13, color: Colors.muted, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
  // Loyalty
  totalCard:            { backgroundColor: Colors.card, borderRadius: 20, padding: 28, alignItems: "center", gap: 8, marginBottom: 24, borderWidth: 1, borderColor: Colors.gold + "30" },
  totalValue:           { fontSize: 52, fontWeight: "800", color: Colors.gold },
  totalLabel:           { fontSize: 14, color: Colors.muted, fontWeight: "600" },
  badgeCard:            { backgroundColor: Colors.card, borderRadius: 16, padding: 14, alignItems: "center", width: 90, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  badgeIcon:            { fontSize: 28 },
  badgeName:            { fontSize: 11, color: Colors.white, textAlign: "center", fontWeight: "600" },
  pointRow:             { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  pointReason:          { fontSize: 14, fontWeight: "600", color: Colors.white },
  pointDate:            { fontSize: 11, color: Colors.muted, marginTop: 2 },
  pointValue:           { fontSize: 20, fontWeight: "800" },
  // Game
  statsRow:             { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard:             { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statValue:            { fontSize: 22, fontWeight: "800", color: Colors.indigo },
  statLabel:            { fontSize: 10, color: Colors.muted, fontWeight: "600", marginTop: 2, textAlign: "center" },
  mainCTA:              { backgroundColor: Colors.indigo, borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  mainCTALeft:          { flexDirection: "row", alignItems: "center", gap: 14 },
  mainCTAEmoji:         { fontSize: 36 },
  mainCTATitle:         { fontSize: 18, fontWeight: "800", color: "#fff" },
  mainCTASub:           { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  ctaArrow:             { fontSize: 28, color: "rgba(255,255,255,0.7)", fontWeight: "300" },
  leaderboardBtn:       { backgroundColor: Colors.card2, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: Colors.gold + "50", marginBottom: 10 },
  leaderboardBtnInner:  { flexDirection: "row", alignItems: "center", gap: 12 },
  leaderboardPodium:    { fontSize: 28 },
  leaderboardTitle:     { fontSize: 15, fontWeight: "700", color: Colors.white },
  leaderboardSub:       { fontSize: 12, color: Colors.muted, marginTop: 2 },
  fairCard:             { backgroundColor: Colors.card, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  rewardsFairCard:      { backgroundColor: "#1a1000", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#f59e0b30", marginBottom: 10 },
  fairCardLeft:         { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  fairEmoji:            { fontSize: 28 },
  fairName:             { fontSize: 15, fontWeight: "700", color: Colors.white },
  fairSub:              { fontSize: 12, color: Colors.muted, marginTop: 2 },
  guideCard:            { backgroundColor: Colors.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  guideRow:             { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  guideEmoji:           { fontSize: 22, width: 32, textAlign: "center" },
  guideLabel:           { flex: 1, fontSize: 14, color: Colors.white, fontWeight: "600" },
  guidePts:             { fontSize: 15, fontWeight: "800", color: Colors.green },
});
