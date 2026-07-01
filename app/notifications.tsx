import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";

type NotifRow = {
  id: string;
  type: "announcement" | "reminder" | "alert" | string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

const TYPE_META = {
  announcement: { emoji: "📢", color: "#22d3ee", label: "Duyuru" },
  reminder:     { emoji: "⏰", color: "#f59e0b", label: "Hatırlatma" },
  alert:        { emoji: "⚠️", color: "#ef4444", label: "Uyarı" },
};

function formatAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotifRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, is_read, created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);

    setNotifications((data ?? []) as NotifRow[]);

    // Okunmamış olanları oku
    const unreadIds = (data ?? []).filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
      await Notifications.setBadgeCountAsync(0);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  function onRefresh() { setRefreshing(true); load(); }

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: "center", alignItems: "center" }]} edges={["top"]}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </Pressable>
        <Text style={s.title}>Bildirimler</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.indigo} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🔔</Text>
            <Text style={s.emptyTitle}>Henüz bildirim yok</Text>
            <Text style={s.emptyDesc}>Organizatörler duyuru gönderdiğinde burada görünür.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = TYPE_META[item.type as keyof typeof TYPE_META] ?? TYPE_META.announcement;
          return (
            <TouchableOpacity
              style={[s.row, !item.is_read && s.rowUnread]}
              activeOpacity={0.7}
            >
              <View style={[s.iconBox, { backgroundColor: meta.color + "18" }]}>
                <Text style={s.emoji}>{meta.emoji}</Text>
              </View>
              <View style={s.content}>
                <View style={s.topRow}>
                  <Text style={[s.rowTitle, !item.is_read && { color: "#fff" }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.is_read && <View style={s.dot} />}
                </View>
                {item.body ? (
                  <Text style={s.body} numberOfLines={2}>{item.body}</Text>
                ) : null}
                <Text style={s.time}>{formatAgo(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:    { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backText:   { color: "#fff", fontSize: 22 },
  title:      { color: "#fff", fontSize: 18, fontWeight: "800" },

  row:        { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowUnread:  { backgroundColor: Colors.indigo + "0a" },
  iconBox:    { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  emoji:      { fontSize: 22 },
  content:    { flex: 1 },
  topRow:     { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  rowTitle:   { flex: 1, fontSize: 14, fontWeight: "700", color: Colors.muted },
  dot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.indigo, flexShrink: 0 },
  body:       { fontSize: 13, color: "#64748b", lineHeight: 18, marginBottom: 4 },
  time:       { fontSize: 11, color: "#475569" },

  empty:      { alignItems: "center", paddingVertical: 80, paddingHorizontal: 40, gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptyDesc:  { color: Colors.muted, fontSize: 13, textAlign: "center", lineHeight: 20 },
});
