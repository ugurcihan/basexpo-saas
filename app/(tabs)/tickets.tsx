import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { Zap, Award, Trophy, Ticket as TicketIcon, MapPin, Calendar } from "lucide-react-native";
import { fetchMyRegistrations, type RegistrationRow } from "@/lib/api/registrations";
import QRCode from "react-native-qrcode-svg";
import Svg, { Line } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");

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

const STATUS_CONFIG = {
  confirmed: { border: Colors.green, bg: Colors.green + "15", label: "Onaylı", labelColor: Colors.green },
  pending_approval: { border: Colors.amber, bg: Colors.amber + "15", label: "İncelemede", labelColor: Colors.amber },
  waitlisted: { border: Colors.gold, bg: Colors.gold + "15", label: "Bekleme Listesi", labelColor: Colors.gold },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function DashedLine() {
  return (
    <Svg height="2" width={SCREEN_W - 40} style={{ marginVertical: 14 }}>
      <Line
        x1="0" y1="1" x2={SCREEN_W - 40} y2="1"
        stroke="rgba(255,255,255,0.12)" strokeDasharray="6,4" strokeWidth="1"
      />
    </Svg>
  );
}

function TicketCard({ reg, userId, userName }: { reg: RegistrationRow; userId: string; userName: string }) {
  const config = STATUS_CONFIG[reg.status] ?? STATUS_CONFIG.waitlisted;
  const event = reg.event;

  const qrValue = JSON.stringify({
    vid: userId,
    tc: reg.ticket_code,
    n: userName,
    eid: event?.id,
    ev: event?.name,
  });

  return (
    <View style={[styles.ticketCard, { borderLeftColor: config.border, backgroundColor: config.bg }]}>
      {/* Header */}
      <View style={styles.ticketHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ticketEventName} numberOfLines={2}>{event?.name ?? "Etkinlik"}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.border + "25" }]}>
          <Text style={[styles.statusBadgeText, { color: config.labelColor }]}>{config.label}</Text>
        </View>
      </View>

      {/* Date / Location */}
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
              <QRCode
                value={qrValue}
                size={130}
                color="#0a0a1a"
                backgroundColor="#ffffff"
              />
            </View>
            <Text style={styles.ticketCode}>{reg.ticket_code}</Text>
            <Text style={styles.ticketCodeLabel}>Giriş QR Kodu</Text>
          </View>
        </>
      ) : (
        <View style={styles.pendingInfo}>
          <Text style={styles.pendingText}>
            {reg.status === "pending_approval"
              ? "Başvurunuz organizatör tarafından inceleniyor. Onay sonrası QR kodunuz oluşturulacak."
              : "Bekleme listesindeysiniz. Yer açıldığında bildirim alacaksınız."}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TicketsScreen() {
  const [activeTab, setActiveTab] = useState<"tickets" | "loyalty">("tickets");
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [points, setPoints] = useState<PointRow[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const [regsData, profileRes, pointsRes, badgesRes] = await Promise.all([
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

  const upcoming = registrations.filter(r => r.event && new Date(r.event.end_date) >= new Date());
  const past = registrations.filter(r => r.event && new Date(r.event.end_date) < new Date());

  return (
    <SafeAreaView style={styles.container}>
      {/* Inner tab switcher */}
      <View style={styles.tabSwitcherContainer}>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "tickets" && styles.tabBtnActive]}
            onPress={() => setActiveTab("tickets")}
          >
            <TicketIcon color={activeTab === "tickets" ? Colors.white : Colors.muted} size={14} />
            <Text style={[styles.tabBtnText, activeTab === "tickets" && styles.tabBtnTextActive]}>
              Biletlerim {registrations.length > 0 ? `(${registrations.length})` : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "loyalty" && styles.tabBtnActive]}
            onPress={() => setActiveTab("loyalty")}
          >
            <Zap color={activeTab === "loyalty" ? Colors.white : Colors.muted} size={14} />
            <Text style={[styles.tabBtnText, activeTab === "loyalty" && styles.tabBtnTextActive]}>
              Puanlarım
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.indigo} />
        }
      >
        {activeTab === "tickets" ? (
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
        ) : (
          <>
            {/* Points total */}
            <View style={styles.totalCard}>
              <Zap color={Colors.gold} size={36} />
              <Text style={styles.totalValue}>{totalPoints}</Text>
              <Text style={styles.totalLabel}>Toplam Puan</Text>
            </View>

            {/* Badges */}
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

            {/* Point history */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  tabSwitcherContainer: { paddingHorizontal: 20, paddingVertical: 14 },
  tabSwitcher: {
    flexDirection: "row", backgroundColor: Colors.card,
    borderRadius: 30, padding: 4, borderWidth: 1, borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: 26,
  },
  tabBtnActive: { backgroundColor: Colors.indigo },
  tabBtnText: { fontSize: 13, fontWeight: "700", color: Colors.muted },
  tabBtnTextActive: { color: Colors.white },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: Colors.white, marginBottom: 12 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  // Ticket card
  ticketCard: {
    borderRadius: 18, borderLeftWidth: 4, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  ticketHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  ticketEventName: { fontSize: 16, fontWeight: "800", color: Colors.white, flex: 1 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  ticketMeta: { gap: 6 },
  ticketMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ticketMetaText: { fontSize: 12, color: Colors.muted, flex: 1 },
  qrContainer: { alignItems: "center", gap: 10 },
  qrWrapper: { padding: 12, backgroundColor: "#ffffff", borderRadius: 14 },
  ticketCode: { fontSize: 18, fontWeight: "900", color: Colors.white, letterSpacing: 4, fontVariant: ["tabular-nums"] as any },
  ticketCodeLabel: { fontSize: 11, color: Colors.muted },
  pendingInfo: { backgroundColor: Colors.card2, borderRadius: 10, padding: 12 },
  pendingText: { fontSize: 12, color: Colors.muted, lineHeight: 18 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: Colors.white },
  emptyText: { fontSize: 13, color: Colors.muted, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
  // Loyalty
  totalCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 28,
    alignItems: "center", gap: 8, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.gold + "30",
  },
  totalValue: { fontSize: 52, fontWeight: "800", color: Colors.gold },
  totalLabel: { fontSize: 14, color: Colors.muted, fontWeight: "600" },
  badgeCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    alignItems: "center", width: 90, borderWidth: 1, borderColor: Colors.border, gap: 6,
  },
  badgeIcon: { fontSize: 28 },
  badgeName: { fontSize: 11, color: Colors.white, textAlign: "center", fontWeight: "600" },
  pointRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  pointReason: { fontSize: 14, fontWeight: "600", color: Colors.white },
  pointDate: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  pointValue: { fontSize: 20, fontWeight: "800" },
});
