import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { MapPin, Calendar } from "lucide-react-native";
import { fetchPublishedEvents, CATEGORIES, type EventListItem } from "@/lib/api/events";
import GradientOverlay from "@/components/GradientOverlay";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W * 0.72;
const FEATURED_H = 200;
const LIST_H = 160;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }).toUpperCase();
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const letter = (name ?? "?").charAt(0).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{letter}</Text>
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  const config = {
    confirmed: { bg: Colors.green + "25", text: Colors.green, label: "Kayıtlısın ✓" },
    pending_approval: { bg: Colors.amber + "25", text: Colors.amber, label: "İncelemede" },
    waitlisted: { bg: Colors.gold + "25", text: Colors.gold, label: "Bekleme Listesi" },
  }[status] ?? { bg: Colors.muted + "20", text: Colors.muted, label: status };

  return (
    <View style={[styles.statusChip, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusChipText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

function EventCard({
  event,
  regStatus,
  onPress,
  wide = false,
}: {
  event: EventListItem;
  regStatus?: string;
  onPress: () => void;
  wide?: boolean;
}) {
  const cardW = wide ? CARD_W : SCREEN_W - 40;
  const cardH = wide ? FEATURED_H : LIST_H;

  return (
    <TouchableOpacity
      style={[styles.eventCard, { width: cardW }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={{ height: cardH, borderRadius: 16, overflow: "hidden" }}>
        {event.cover_url ? (
          <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.card2 }]} />
        )}
        <GradientOverlay height={cardH * 0.65} />

        {/* Date badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{formatDate(event.start_date)}</Text>
        </View>

        {/* Bottom overlay content */}
        <View style={styles.cardBottom}>
          {event.category && (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{event.category}</Text>
            </View>
          )}
          <Text style={styles.cardTitle} numberOfLines={2}>{event.name}</Text>
          <View style={styles.cardLocationRow}>
            <MapPin color={Colors.muted} size={12} />
            <Text style={styles.cardLocation} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>
      </View>

      {regStatus && (
        <View style={{ paddingHorizontal: 4, paddingTop: 8 }}>
          <StatusChip status={regStatus} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [myRegs, setMyRegs] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<{ full_name: string | null; id: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [eventsData, profileRes, regsRes] = await Promise.all([
      fetchPublishedEvents(activeCategory),
      supabase.from("profiles").select("id, full_name").eq("id", user.id).single(),
      supabase.from("event_registrations").select("event_id, status").eq("visitor_id", user.id),
    ]);

    setEvents(eventsData);
    if (profileRes.data) setProfile(profileRes.data as { full_name: string | null; id: string });

    const regMap: Record<string, string> = {};
    for (const r of regsRes.data ?? []) {
      regMap[r.event_id] = r.status;
    }
    setMyRegs(regMap);
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeCategory])
  );

  const firstName = profile?.full_name?.split(" ")[0] ?? "Ziyaretçi";
  const featured = events.slice(0, 4);
  const upcoming = events.slice(0, 10);

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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={Colors.indigo}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba, {firstName}</Text>
            <Text style={styles.subtitle}>Etkinlikleri keşfet</Text>
          </View>
          <Avatar name={firstName} size={42} />
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          <TouchableOpacity
            style={[styles.categoryPillBtn, activeCategory === null && styles.categoryPillActive]}
            onPress={() => setActiveCategory(null)}
          >
            <Text style={[styles.categoryPillBtnText, activeCategory === null && styles.categoryPillBtnTextActive]}>
              Tümü
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPillBtn, activeCategory === cat && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat === activeCategory ? null : cat)}
            >
              <Text style={[styles.categoryPillBtnText, activeCategory === cat && styles.categoryPillBtnTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar color={Colors.muted} size={48} />
            <Text style={styles.emptyText}>Bu kategoride etkinlik bulunamadı.</Text>
          </View>
        ) : (
          <>
            {/* Featured / Sizin İçin */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sizin İçin Seçilenler</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              style={styles.featuredScroll}
            >
              {featured.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  regStatus={myRegs[event.id]}
                  wide
                  onPress={() => router.push(`/events/${event.id}` as any)}
                />
              ))}
            </ScrollView>

            {/* Upcoming */}
            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <Text style={styles.sectionTitle}>Yaklaşan Etkinlikler</Text>
            </View>
            <View style={styles.listContainer}>
              {upcoming.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  regStatus={myRegs[event.id]}
                  onPress={() => router.push(`/events/${event.id}` as any)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: Colors.white },
  subtitle: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  avatar: { backgroundColor: Colors.indigo + "30", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.indigo + "50" },
  avatarText: { fontWeight: "700", color: Colors.indigo },
  categoryScroll: { marginBottom: 8 },
  categoryContainer: { paddingHorizontal: 20, gap: 8 },
  categoryPillBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  categoryPillActive: { backgroundColor: Colors.indigo + "20", borderColor: Colors.indigo + "60" },
  categoryPillBtnText: { fontSize: 13, fontWeight: "600", color: Colors.muted },
  categoryPillBtnTextActive: { color: Colors.indigoLight },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: Colors.white },
  featuredScroll: { marginBottom: 4 },
  listContainer: { paddingHorizontal: 20, gap: 12 },
  eventCard: { },
  cardBottom: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, gap: 4 },
  dateBadge: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: Colors.bg + "cc", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  dateBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.white },
  categoryPill: {
    backgroundColor: Colors.indigo + "25", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start",
  },
  categoryPillText: { fontSize: 11, fontWeight: "700", color: Colors.indigoLight },
  cardTitle: { fontSize: 15, fontWeight: "800", color: Colors.white },
  cardLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardLocation: { fontSize: 11, color: Colors.muted, flex: 1 },
  statusChip: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusChipText: { fontSize: 11, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 20 },
  emptyText: { fontSize: 14, color: Colors.muted, textAlign: "center" },
});
