import { useRef, useState, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, Linking, Alert, ActivityIndicator,
  Dimensions, Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import {
  ChevronLeft, MapPin, Calendar, Clock, ChevronRight,
  Globe, AtSign, Link, ExternalLink, Zap,
} from "lucide-react-native";
import { fetchEventDetail, type EventDetail } from "@/lib/api/events";
import { checkMyRegistration, registerForEvent, type RegistrationStatus } from "@/lib/api/registrations";
import GradientOverlay from "@/components/GradientOverlay";
import Svg, { Line } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_H = 280;

function formatGCalDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function formatDisplayDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

type CTAState = {
  label: string;
  color: string;
  disabled: boolean;
};

function getCTAState(
  regStatus: RegistrationStatus | null,
  event: EventDetail | null,
): CTAState {
  if (!event) return { label: "Yükleniyor...", color: Colors.muted, disabled: true };
  if (!regStatus) {
    if (event.capacity !== null && event.capacity <= 0) {
      return { label: "Bekleme Listesine Gir", color: Colors.amber, disabled: false };
    }
    if (event.requires_approval) {
      return { label: "Başvur", color: Colors.violet, disabled: false };
    }
    return { label: "Kayıt Ol", color: Colors.indigo, disabled: false };
  }
  const map: Record<RegistrationStatus, CTAState> = {
    confirmed: { label: "Kayıtlısın ✓", color: Colors.green, disabled: true },
    pending_approval: { label: "Başvurunuz İncelemede", color: Colors.amber, disabled: true },
    waitlisted: { label: "Bekleme Listesindeyim", color: Colors.gold, disabled: true },
  };
  return map[regStatus] ?? { label: regStatus, color: Colors.muted, disabled: true };
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [regStatus, setRegStatus] = useState<RegistrationStatus | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showAllExhibitors, setShowAllExhibitors] = useState(false);

  const headerOpacity = scrollY.interpolate({
    inputRange: [200, 260],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const [eventData, profileRes, regData] = await Promise.all([
        fetchEventDetail(id),
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        checkMyRegistration(user.id, id),
      ]);

      setEvent(eventData);
      setUserName(profileRes.data?.full_name ?? "");
      setRegStatus(regData?.status ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleRegister() {
    if (!event || !userId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      Alert.alert("Hata", "Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    setRegistering(true);
    const result = await registerForEvent(id, session.access_token);
    setRegistering(false);

    if ("error" in result) {
      Alert.alert("Hata", result.error);
      return;
    }

    setRegStatus(result.status as RegistrationStatus);
    const messages: Record<RegistrationStatus, string> = {
      confirmed: "Kayıt başarılı! Biletiniz 'Biletlerim' sekmesinde.",
      pending_approval: "Başvurunuz alındı. Onay sonrası bildirim alacaksınız.",
      waitlisted: "Bekleme listesine eklendiniz.",
    };
    Alert.alert("Başarılı", messages[result.status as RegistrationStatus] ?? "İşlem tamamlandı.");
  }

  async function handleAddToCalendar() {
    if (!event) return;
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const url =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(event.name)}` +
      `&dates=${formatGCalDate(start)}/${formatGCalDate(end)}` +
      `&location=${encodeURIComponent(event.location)}` +
      `&details=${encodeURIComponent(event.description ?? "")}`;
    await Linking.openURL(url);
  }

  async function handleOpenMap() {
    if (!event) return;
    const query = encodeURIComponent(event.maps_url ?? event.location);
    const url = Platform.OS === "ios"
      ? `maps:?q=${query}`
      : `https://maps.google.com/maps?q=${query}`;
    await Linking.openURL(url);
  }

  const cta = getCTAState(regStatus, event);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft color={Colors.white} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: Colors.muted }}>Etkinlik bulunamadı.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const exhibitors = showAllExhibitors ? event.exhibitors : event.exhibitors.slice(0, 5);
  const sponsorsByTier = event.sponsors.reduce((acc, s) => {
    const tier = s.tier ?? 4;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(s);
    return acc;
  }, {} as Record<number, typeof event.sponsors>);
  const tierNames: Record<number, string> = { 1: "Platin", 2: "Altın", 3: "Gümüş", 4: "Bronz" };
  const tierColors: Record<number, string> = { 1: "#e5e4e2", 2: Colors.gold, 3: "#9e9e9e", 4: "#cd7f32" };

  return (
    <View style={styles.container}>
      {/* Animated floating header */}
      <Animated.View
        style={[styles.floatingHeader, { opacity: headerOpacity, paddingTop: insets.top + 4 }]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.floatingHeaderTitle} numberOfLines={1}>{event.name}</Text>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Hero */}
        <View style={{ height: HERO_H, position: "relative" }}>
          {event.cover_url ? (
            <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.card2 }]} />
          )}
          <GradientOverlay height={HERO_H * 0.6} />

          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => router.back()}
          >
            <ChevronLeft color={Colors.white} size={22} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.eventTitle}>{event.name}</Text>

          {/* Category tags */}
          {event.category && (
            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{event.category}</Text>
              </View>
              {(event.tags ?? []).slice(0, 3).map(t => (
                <View key={t} style={[styles.tag, { backgroundColor: Colors.card2 }]}>
                  <Text style={[styles.tagText, { color: Colors.muted }]}>{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Date */}
          <TouchableOpacity style={styles.infoRow} onPress={handleAddToCalendar}>
            <View style={styles.infoIcon}><Calendar color={Colors.indigo} size={18} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>{formatDisplayDate(event.start_date)}</Text>
              <Text style={styles.infoSub}>{formatTime(event.start_date)} – {formatTime(event.end_date)}</Text>
            </View>
            <View style={styles.calendarBtn}>
              <Clock color={Colors.indigo} size={14} />
              <Text style={styles.calendarBtnText}>Takvime Ekle</Text>
            </View>
          </TouchableOpacity>

          {/* Location */}
          <TouchableOpacity style={styles.infoRow} onPress={handleOpenMap}>
            <View style={styles.infoIcon}><MapPin color={Colors.cyan} size={18} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>{event.location}</Text>
            </View>
            <ChevronRight color={Colors.muted} size={18} />
          </TouchableOpacity>

          {/* Organizer */}
          {event.organizer && (
            <TouchableOpacity
              style={[styles.infoRow, { marginTop: 8 }]}
              onPress={() => router.push(`/organizer/${event.organizer_id}` as any)}
            >
              <View style={styles.organizerAvatar}>
                {event.organizer.avatar_url ? (
                  <Image source={{ uri: event.organizer.avatar_url }} style={StyleSheet.absoluteFill} borderRadius={20} />
                ) : (
                  <Text style={styles.organizerAvatarText}>
                    {(event.organizer.full_name ?? "O").charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoSub}>Düzenleyen</Text>
                <Text style={styles.infoLabel}>{event.organizer.full_name}</Text>
              </View>
              <ChevronRight color={Colors.muted} size={18} />
            </TouchableOpacity>
          )}

          {/* Separator */}
          <View style={styles.separator} />

          {/* Description */}
          {event.description ? (
            <>
              <Text style={styles.sectionTitle}>Hakkında</Text>
              <Text style={styles.description}>{event.description}</Text>
              <View style={styles.separator} />
            </>
          ) : null}

          {/* Reward Tiers */}
          {event.reward_tiers.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Ödüller</Text>
              {event.reward_tiers.map((rt, i) => (
                <View key={i} style={styles.rewardCard}>
                  <Zap color={Colors.gold} size={18} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardTitle}>{rt.reward_title}</Text>
                    {rt.reward_description && (
                      <Text style={styles.rewardDesc}>{rt.reward_description}</Text>
                    )}
                  </View>
                  <View style={styles.rewardPoints}>
                    <Text style={styles.rewardPointsText}>{rt.points_required} puan</Text>
                  </View>
                </View>
              ))}
              <View style={styles.separator} />
            </>
          )}

          {/* Sponsors */}
          {Object.keys(sponsorsByTier).length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Sponsorlar</Text>
              {[1, 2, 3, 4].map(tier => {
                const sponsors = sponsorsByTier[tier];
                if (!sponsors?.length) return null;
                return (
                  <View key={tier} style={styles.sponsorTierRow}>
                    <Text style={[styles.sponsorTierLabel, { color: tierColors[tier] }]}>{tierNames[tier]}</Text>
                    <View style={styles.sponsorRow}>
                      {sponsors.map((s, i) => (
                        <View key={i} style={styles.sponsorChip}>
                          <Text style={styles.sponsorName}>{s.exhibitor?.company_name ?? "—"}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
              <View style={styles.separator} />
            </>
          )}

          {/* Exhibitors */}
          {event.exhibitors.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Katılımcı Firmalar ({event.exhibitors.length})</Text>
              {exhibitors.map(ex => (
                <View key={ex.id} style={styles.exhibitorRow}>
                  {ex.logo_url ? (
                    <Image source={{ uri: ex.logo_url }} style={styles.exhibitorLogo} />
                  ) : (
                    <View style={[styles.exhibitorLogo, { backgroundColor: Colors.card2, justifyContent: "center", alignItems: "center" }]}>
                      <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: "700" }}>
                        {ex.company_name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.exhibitorName}>{ex.company_name}</Text>
                </View>
              ))}
              {event.exhibitors.length > 5 && (
                <TouchableOpacity
                  style={styles.showMoreBtn}
                  onPress={() => setShowAllExhibitors(!showAllExhibitors)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllExhibitors ? "Daha Az Göster" : `${event.exhibitors.length - 5} Firma Daha`}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={styles.separator} />
            </>
          )}

          {/* Social Links */}
          {event.social_links && Object.keys(event.social_links).length > 0 && (
            <View style={styles.socialRow}>
              {event.social_links.website && (
                <TouchableOpacity onPress={() => Linking.openURL(event.social_links!.website!)}>
                  <Globe color={Colors.cyan} size={22} />
                </TouchableOpacity>
              )}
              {event.social_links.instagram && (
                <TouchableOpacity onPress={() => Linking.openURL(event.social_links!.instagram!)}>
                  <AtSign color={Colors.violet} size={22} />
                </TouchableOpacity>
              )}
              {event.social_links.twitter && (
                <TouchableOpacity onPress={() => Linking.openURL(event.social_links!.twitter!)}>
                  <ExternalLink color={Colors.cyan} size={22} />
                </TouchableOpacity>
              )}
              {event.social_links.linkedin && (
                <TouchableOpacity onPress={() => Linking.openURL(event.social_links!.linkedin!)}>
                  <Link color={Colors.indigo} size={22} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Floating CTA */}
      <View style={[styles.floatingCTA, { paddingBottom: insets.bottom + 12 }]}>
        {/* Dashed divider */}
        <Svg height="1" width="100%" style={{ marginBottom: 12 }}>
          <Line x1="0" y1="0" x2={SCREEN_W} y2="0" stroke={Colors.border} strokeDasharray="6,4" strokeWidth="1" />
        </Svg>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: cta.color + (cta.disabled ? "80" : "") }]}
          onPress={handleRegister}
          disabled={cta.disabled || registering}
        >
          {registering ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.ctaButtonText}>{cta.label}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  floatingHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: Colors.bg + "f0",
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  floatingHeaderTitle: { fontSize: 15, fontWeight: "700", color: Colors.white, flex: 1 },
  backBtn: {
    position: "absolute", left: 16, zIndex: 10,
    backgroundColor: Colors.bg + "cc",
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  content: { padding: 20 },
  eventTitle: { fontSize: 24, fontWeight: "900", color: Colors.white, marginBottom: 12, lineHeight: 30 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 },
  tag: { backgroundColor: Colors.indigo + "20", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: "700", color: Colors.indigoLight },
  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 14, fontWeight: "600", color: Colors.white },
  infoSub: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  calendarBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.indigo + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  calendarBtnText: { fontSize: 11, fontWeight: "700", color: Colors.indigo },
  organizerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.indigo + "30",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  organizerAvatarText: { fontSize: 16, fontWeight: "700", color: Colors.indigo },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.white, marginBottom: 12 },
  description: { fontSize: 14, color: Colors.muted, lineHeight: 22 },
  rewardCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.gold + "20",
  },
  rewardTitle: { fontSize: 14, fontWeight: "700", color: Colors.white },
  rewardDesc: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  rewardPoints: { backgroundColor: Colors.gold + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  rewardPointsText: { fontSize: 12, fontWeight: "700", color: Colors.gold },
  sponsorTierRow: { marginBottom: 12 },
  sponsorTierLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  sponsorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sponsorChip: {
    backgroundColor: Colors.card2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  sponsorName: { fontSize: 13, fontWeight: "600", color: Colors.white },
  exhibitorRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  exhibitorLogo: { width: 36, height: 36, borderRadius: 8, backgroundColor: Colors.card2 },
  exhibitorName: { fontSize: 14, fontWeight: "600", color: Colors.white, flex: 1 },
  showMoreBtn: { alignItems: "center", paddingVertical: 10 },
  showMoreText: { fontSize: 13, fontWeight: "700", color: Colors.indigo },
  socialRow: { flexDirection: "row", gap: 20, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  floatingCTA: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bg + "f8",
    paddingHorizontal: 20, paddingTop: 0,
  },
  ctaButton: {
    borderRadius: 16, paddingVertical: 16,
    alignItems: "center", justifyContent: "center",
  },
  ctaButtonText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
