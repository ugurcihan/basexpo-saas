import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { registerForPushNotifications, savePushToken } from "@/lib/notifications";
import { Zap, QrCode, BookOpen, Bell } from "lucide-react-native";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
};

type StatRow = { label: string; value: string; color: string };

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, leadsRes, pointsRes, notifRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, role").eq("id", user.id).single(),
      supabase.from("leads").select("id", { count: "exact" }).eq("visitor_id", user.id),
      supabase.from("loyalty_points").select("points").eq("visitor_id", user.id),
      supabase.from("notifications").select("id, message, created_at").eq("recipient_id", user.id).eq("is_read", false).order("created_at", { ascending: false }).limit(5),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      // Register push token
      const token = await registerForPushNotifications();
      if (token) await savePushToken(user.id, token);
    }

    const totalPoints = (pointsRes.data ?? []).reduce((s, r) => s + (r.points ?? 0), 0);

    setStats([
      { label: "Ziyaret Edilen Firma", value: String(leadsRes.count ?? 0), color: Colors.indigo },
      { label: "Toplam Puan", value: String(totalPoints), color: Colors.gold },
      { label: "Bildirim", value: String(notifRes.data?.length ?? 0), color: Colors.cyan },
    ]);

    setNotifications(notifRes.data ?? []);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "Ziyaretçi";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.indigo} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba, {firstName} 👋</Text>
            <Text style={styles.subtitle}>Fuarları keşfetmeye hazır mısın?</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map(s => (
            <View key={s.label} style={[styles.statCard, { borderColor: s.color + "30" }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/scan")}>
            <QrCode color={Colors.indigo} size={28} />
            <Text style={styles.actionLabel}>QR Tara</Text>
            <Text style={styles.actionDesc}>Firma QR'ı okut</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/contacts")}>
            <BookOpen color={Colors.cyan} size={28} />
            <Text style={styles.actionLabel}>Kartvizitler</Text>
            <Text style={styles.actionDesc}>Ziyaret ettiğin firmalar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/loyalty")}>
            <Zap color={Colors.gold} size={28} />
            <Text style={styles.actionLabel}>Puanlarım</Text>
            <Text style={styles.actionDesc}>Ödül kazan</Text>
          </TouchableOpacity>
        </View>

        {/* Recent notifications */}
        {notifications.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Son Bildirimler</Text>
            {notifications.map(n => (
              <View key={n.id} style={styles.notifCard}>
                <Bell color={Colors.indigo} size={16} />
                <Text style={styles.notifText} numberOfLines={2}>{n.message}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: "800", color: Colors.white },
  subtitle: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.indigo + "30", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.indigo + "50" },
  avatarText: { fontSize: 18, fontWeight: "700", color: Colors.indigo },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1 },
  statValue: { fontSize: 24, fontWeight: "800", marginBottom: 2 },
  statLabel: { fontSize: 10, color: Colors.muted, textAlign: "center", fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.white, marginBottom: 12 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  actionCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, width: "31%", borderWidth: 1, borderColor: Colors.border, gap: 8 },
  actionLabel: { fontSize: 13, fontWeight: "700", color: Colors.white },
  actionDesc: { fontSize: 11, color: Colors.muted },
  notifCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  notifText: { flex: 1, fontSize: 13, color: Colors.white, lineHeight: 18 },
});
