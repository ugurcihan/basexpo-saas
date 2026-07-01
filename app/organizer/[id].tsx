import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { ChevronLeft, MapPin } from "lucide-react-native";
import { fetchOrganizerProfile, type OrganizerInfo, type EventListItem } from "@/lib/api/events";
import GradientOverlay from "@/components/GradientOverlay";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function EventCard({ event, onPress }: { event: EventListItem; onPress: () => void }) {
  const isPast = new Date(event.end_date) < new Date();
  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.88}>
      <View style={{ height: 140, borderRadius: 14, overflow: "hidden" }}>
        {event.cover_url ? (
          <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.card2 }]} />
        )}
        <GradientOverlay height={90} />
        {isPast && (
          <View style={styles.pastBadge}>
            <Text style={styles.pastBadgeText}>Tamamlandı</Text>
          </View>
        )}
        <View style={styles.cardBottom}>
          <Text style={styles.cardTitle} numberOfLines={2}>{event.name}</Text>
          <View style={styles.cardRow}>
            <MapPin color={Colors.muted} size={11} />
            <Text style={styles.cardLocation} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.cardDate}>{formatDate(event.start_date)}</Text>
    </TouchableOpacity>
  );
}

export default function OrganizerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<OrganizerInfo | null>(null);
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const data = await fetchOrganizerProfile(id);
    setProfile(data.profile);
    setEvents(data.events);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  const name = profile?.full_name ?? "Organizatör";
  const initial = name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 4 }]}
        onPress={() => router.back()}
      >
        <ChevronLeft color={Colors.white} size={22} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.indigo} />
        }
      >
        {/* Organizer Header */}
        <View style={styles.orgHeader}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFill} borderRadius={40} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          <Text style={styles.orgName}>{name}</Text>
          <View style={styles.orgPill}>
            <Text style={styles.orgPillText}>Organizatör</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Events */}
        <Text style={styles.sectionTitle}>Düzenlediği Fuarlar ({events.length})</Text>

        {events.length === 0 ? (
          <Text style={styles.emptyText}>Henüz etkinlik yayınlanmamış.</Text>
        ) : (
          events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => router.push(`/events/${event.id}` as any)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  backBtn: {
    position: "absolute", left: 16, zIndex: 10,
    backgroundColor: Colors.card, width: 36, height: 36,
    borderRadius: 18, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  orgHeader: { alignItems: "center", gap: 12, paddingTop: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.indigo + "30",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.indigo + "50",
    overflow: "hidden",
  },
  avatarText: { fontSize: 34, fontWeight: "800", color: Colors.indigo },
  orgName: { fontSize: 22, fontWeight: "800", color: Colors.white },
  orgPill: {
    backgroundColor: Colors.indigo + "20", paddingHorizontal: 14,
    paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.indigo + "40",
  },
  orgPillText: { fontSize: 12, fontWeight: "700", color: Colors.indigoLight },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.white, marginBottom: 14 },
  eventCard: { marginBottom: 12 },
  cardBottom: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10, gap: 4 },
  cardTitle: { fontSize: 14, fontWeight: "800", color: Colors.white },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardLocation: { fontSize: 11, color: Colors.muted, flex: 1 },
  cardDate: { fontSize: 11, color: Colors.muted, marginTop: 6, paddingHorizontal: 4 },
  pastBadge: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: Colors.muted + "30",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  pastBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.muted },
  emptyText: { fontSize: 14, color: Colors.muted, textAlign: "center", paddingVertical: 20 },
});
