import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { LogOut, Bell, User, Mail, Shield } from "lucide-react-native";

type Profile = { id: string; full_name: string | null; email: string; role: string };

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase.from("profiles").select("id, full_name, email, role").eq("id", user.id).single()
        .then(({ data }) => { setProfile(data); setLoading(false); });
    });
  }, []);

  async function handleLogout() {
    Alert.alert("Çıkış Yap", "Hesabından çıkmak istediğinden emin misin?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap", style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Profilim</Text>

        {/* Avatar */}
        <View style={styles.avatarBox}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.full_name ?? profile?.email ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.full_name ?? "—"}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>Ziyaretçi</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <User color={Colors.indigo} size={18} />
            <Text style={styles.infoLabel}>Ad Soyad</Text>
            <Text style={styles.infoValue}>{profile?.full_name ?? "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Mail color={Colors.cyan} size={18} />
            <Text style={styles.infoLabel}>E-posta</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{profile?.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Shield color={Colors.violet} size={18} />
            <Text style={styles.infoLabel}>Hesap Türü</Text>
            <Text style={styles.infoValue}>Ziyaretçi</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator color={Colors.red} size="small" />
          ) : (
            <>
              <LogOut color={Colors.red} size={18} />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: Colors.white, marginBottom: 24 },
  avatarBox: { alignItems: "center", marginBottom: 28, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.indigo + "30", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.indigo + "60" },
  avatarText: { fontSize: 36, fontWeight: "800", color: Colors.indigo },
  name: { fontSize: 22, fontWeight: "700", color: Colors.white },
  email: { fontSize: 14, color: Colors.muted },
  rolePill: { backgroundColor: Colors.indigo + "20", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: Colors.indigo + "40" },
  rolePillText: { fontSize: 12, fontWeight: "600", color: Colors.indigoLight },
  card: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  infoLabel: { fontSize: 14, color: Colors.muted, flex: 1 },
  infoValue: { fontSize: 14, fontWeight: "600", color: Colors.white, flex: 1, textAlign: "right" },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.red + "15", borderRadius: 14, paddingVertical: 15, borderWidth: 1, borderColor: Colors.red + "30" },
  logoutText: { fontSize: 16, fontWeight: "700", color: Colors.red },
});
