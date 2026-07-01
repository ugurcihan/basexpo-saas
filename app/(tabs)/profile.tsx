import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, FlatList, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { LogOut, Pencil, Check, X, Mail, Shield, User, Phone, Lock, MapPin, Globe } from "lucide-react-native";
import { COUNTRIES, flagEmoji } from "@/lib/countries";

const INTERESTS = ["Teknoloji", "Gıda", "Tekstil", "İnşaat", "Savunma", "Tarım", "Enerji", "Sağlık"];

const LEAGUES = [
  { name: "Başlangıç", min: 0,     max: 49,       emoji: "🌱", color: "#6b7280" },
  { name: "Bronz",     min: 50,    max: 249,      emoji: "🥉", color: "#cd7f32" },
  { name: "Gümüş",    min: 250,   max: 999,      emoji: "🥈", color: "#9ca3af" },
  { name: "Altın",    min: 1000,  max: 2999,     emoji: "🥇", color: "#f59e0b" },
  { name: "Elmas",    min: 3000,  max: 9999,     emoji: "💎", color: "#22d3ee" },
  { name: "Efsane",   min: 10000, max: Infinity, emoji: "👑", color: "#8b5cf6" },
];

function getLeague(points: number) {
  return LEAGUES.find(l => points >= l.min && points <= l.max) ?? LEAGUES[0];
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Felix&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Zara&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Milo&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Luna&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Roxy&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Max&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Nova&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Pixel&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Sage&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Atlas&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Echo&size=200",
  "https://api.dicebear.com/7.x/fun-emoji/png?seed=Blaze&size=200",
];

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  phone_number: string | null;
  interests: string[] | null;
  avatar_url: string | null;
};

export default function ProfileScreen() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Konum & lig
  const [countryCode, setCountryCode] = useState<string>("");
  const [city, setCity]               = useState<string>("");
  const [myLifetimePts, setMyLifetimePts] = useState(0);

  // Edit state
  const [editing, setEditing]         = useState(false);
  const [editName, setEditName]       = useState("");
  const [editPhone, setEditPhone]     = useState("");
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editCountry, setEditCountry] = useState<string>("");
  const [editCity, setEditCity]       = useState<string>("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);

  // Ülke picker modal
  const [countryModal, setCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // Avatar picker modal
  const [avatarModal, setAvatarModal] = useState(false);

  // Şifre
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [profileRes, locationRes] = await Promise.all([
      supabase.from("profiles")
        .select("id, full_name, email, role, phone_number, interests, avatar_url")
        .eq("id", user.id).single(),
      supabase.from("user_lifetime_scores")
        .select("country_code, city, total_points")
        .eq("user_id", user.id).maybeSingle(),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (locationRes.data) {
      setCountryCode(locationRes.data.country_code ?? "");
      setCity(locationRes.data.city ?? "");
      setMyLifetimePts(locationRes.data.total_points ?? 0);
    }
    setLoading(false);
  }

  useEffect(() => { loadProfile(); }, []);

  function startEditing() {
    if (!profile) return;
    setEditName(profile.full_name ?? "");
    setEditPhone(profile.phone_number ?? "");
    setEditInterests(profile.interests ?? []);
    setEditCountry(countryCode);
    setEditCity(city);
    setEditAvatarUrl(profile.avatar_url ?? null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function saveProfile() {
    if (!profile) return;
    if (!editName.trim()) {
      Alert.alert("Hata", "Ad Soyad boş bırakılamaz.");
      return;
    }
    setSaving(true);

    const [profileErr] = await Promise.all([
      supabase.from("profiles").update({
        full_name:    editName.trim(),
        phone_number: editPhone.trim() || null,
        interests:    editInterests,
        avatar_url:   editAvatarUrl,
      }).eq("id", profile.id).then(r => r.error),

      editCountry
        ? supabase.rpc("upsert_lifetime_location", {
            p_user_id: profile.id,
            p_country: editCountry,
            p_city:    editCity.trim() || null,
          }).then(r => r.error)
        : Promise.resolve(null),
    ]);

    setSaving(false);
    if (profileErr) { Alert.alert("Hata", "Profil kaydedilemedi."); return; }

    setEditing(false);
    setCountryCode(editCountry);
    setCity(editCity.trim());
    await loadProfile();
  }

  function toggleInterest(interest: string) {
    setEditInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  }

  async function changePassword() {
    if (newPassword.length < 6) { Alert.alert("Hata", "Şifre en az 6 karakter olmalı."); return; }
    if (newPassword !== confirmPassword) { Alert.alert("Hata", "Şifreler eşleşmiyor."); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { Alert.alert("Hata", error.message); return; }
    Alert.alert("Başarılı", "Şifren güncellendi.");
    setNewPassword(""); setConfirmPassword(""); setShowPasswordSection(false);
  }

  async function handleLogout() {
    Alert.alert("Çıkış Yap", "Hesabından çıkmak istediğinden emin misin?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: async () => {
        setLoggingOut(true);
        await supabase.auth.signOut();
      }},
    ]);
  }

  const filteredCountries = countrySearch
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase()))
    : COUNTRIES;

  const selectedCountryName = COUNTRIES.find(c => c.code === countryCode)?.name;
  const editCountryName     = COUNTRIES.find(c => c.code === editCountry)?.name;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  const firstName        = profile?.full_name?.split(" ")[0] ?? "Ziyaretçi";
  const initial          = firstName.charAt(0).toUpperCase();
  const league           = getLeague(myLifetimePts);
  const currentAvatarUrl = editing ? editAvatarUrl : profile?.avatar_url;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Profilim</Text>
            {!editing ? (
              <TouchableOpacity style={styles.editBtn} onPress={startEditing}>
                <Pencil color={Colors.indigo} size={16} />
                <Text style={styles.editBtnText}>Düzenle</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditing} disabled={saving}>
                  <X color={Colors.muted} size={18} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Check color="#fff" size={18} />}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Avatar */}
          <View style={styles.avatarBox}>
            <TouchableOpacity
              style={{ position: "relative" }}
              onPress={editing ? () => setAvatarModal(true) : undefined}
              activeOpacity={editing ? 0.75 : 1}
            >
              {currentAvatarUrl ? (
                <Image source={{ uri: currentAvatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
              {!editing && (
                <View style={[styles.leagueBadge, { borderColor: league.color + "60" }]}>
                  <Text style={{ fontSize: 14 }}>{league.emoji}</Text>
                </View>
              )}
              {editing && (
                <View style={styles.avatarEditDot}>
                  <Pencil color="#fff" size={11} />
                </View>
              )}
            </TouchableOpacity>

            {!editing ? (
              <>
                <Text style={styles.name}>{profile?.full_name ?? "—"}</Text>
                <Text style={styles.email}>{profile?.email}</Text>
              </>
            ) : (
              <Text style={styles.email}>{profile?.email}</Text>
            )}
            <View style={[styles.rolePill, { borderColor: league.color + "50", backgroundColor: league.color + "15" }]}>
              <Text style={[styles.rolePillText, { color: league.color }]}>{league.emoji} {league.name}</Text>
            </View>
          </View>

          {/* Edit Form */}
          {editing ? (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Ad Soyad</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName}
                placeholder="Adınız Soyadınız" placeholderTextColor={Colors.muted} autoCapitalize="words" />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Telefon</Text>
              <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone}
                placeholder="+90 5xx xxx xx xx" placeholderTextColor={Colors.muted} keyboardType="phone-pad" />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Ülkem</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => { setCountrySearch(""); setCountryModal(true); }}>
                <Globe color={Colors.muted} size={16} />
                <Text style={[styles.pickerBtnText, !editCountry && { color: Colors.muted }]}>
                  {editCountry ? `${flagEmoji(editCountry)}  ${editCountryName}` : "Ülke seç..."}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Şehrim</Text>
              <TextInput style={styles.input} value={editCity} onChangeText={setEditCity}
                placeholder="Şehriniz" placeholderTextColor={Colors.muted} autoCapitalize="words" />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>İlgi Alanları</Text>
              <View style={styles.interestsGrid}>
                {INTERESTS.map(interest => {
                  const active = editInterests.includes(interest);
                  return (
                    <TouchableOpacity key={interest}
                      style={[styles.interestPill, active && styles.interestPillActive]}
                      onPress={() => toggleInterest(interest)}>
                      <Text style={[styles.interestPillText, active && styles.interestPillTextActive]}>{interest}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
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
                <Phone color={Colors.violet} size={18} />
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{profile?.phone_number ?? "—"}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Globe color={Colors.muted} size={18} />
                <Text style={styles.infoLabel}>Ülke</Text>
                <Text style={styles.infoValue}>
                  {countryCode ? `${flagEmoji(countryCode)}  ${selectedCountryName}` : "—"}
                </Text>
              </View>
              {city ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <MapPin color={Colors.muted} size={18} />
                    <Text style={styles.infoLabel}>Şehir</Text>
                    <Text style={styles.infoValue}>{city}</Text>
                  </View>
                </>
              ) : null}
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Shield color={Colors.muted} size={18} />
                <Text style={styles.infoLabel}>Hesap Türü</Text>
                <Text style={styles.infoValue}>Ziyaretçi</Text>
              </View>
              {(profile?.interests?.length ?? 0) > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={[styles.infoRow, { alignItems: "flex-start" }]}>
                    <View style={{ width: 18 }} />
                    <Text style={styles.infoLabel}>İlgi Alanları</Text>
                    <View style={styles.tagsWrap}>
                      {(profile?.interests ?? []).map(i => (
                        <View key={i} style={styles.tagChip}>
                          <Text style={styles.tagChipText}>{i}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Şifre */}
          <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPasswordSection(!showPasswordSection)}>
            <Lock color={Colors.indigo} size={16} />
            <Text style={styles.passwordToggleText}>Şifre Değiştir</Text>
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={styles.card}>
              <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword}
                placeholder="Yeni Şifre (min. 6 karakter)" placeholderTextColor={Colors.muted} secureTextEntry />
              <TextInput style={[styles.input, { marginTop: 10 }]} value={confirmPassword} onChangeText={setConfirmPassword}
                placeholder="Yeni Şifre Tekrar" placeholderTextColor={Colors.muted} secureTextEntry />
              <TouchableOpacity
                style={[styles.saveBtn, { alignSelf: "stretch", marginTop: 12, borderRadius: 12, paddingVertical: 12, justifyContent: "center" }]}
                onPress={changePassword} disabled={changingPassword}>
                {changingPassword ? <ActivityIndicator color="#fff" size="small" /> : (
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14, textAlign: "center" }}>Şifreyi Güncelle</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Çıkış */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
            {loggingOut ? <ActivityIndicator color={Colors.red} size="small" /> : (
              <>
                <LogOut color={Colors.red} size={18} />
                <Text style={styles.logoutText}>Çıkış Yap</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Ülke Seçici Modal */}
      <Modal visible={countryModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ülke Seç</Text>
            <TouchableOpacity onPress={() => setCountryModal(false)} style={styles.modalClose}>
              <X color={Colors.white} size={22} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearch}>
            <TextInput
              style={styles.modalSearchInput}
              value={countrySearch}
              onChangeText={setCountrySearch}
              placeholder="Ülke ara..."
              placeholderTextColor={Colors.muted}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={c => c.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.countryRow, editCountry === item.code && styles.countryRowSelected]}
                onPress={() => { setEditCountry(item.code); setCountryModal(false); }}
              >
                <Text style={styles.countryFlag}>{flagEmoji(item.code)}</Text>
                <Text style={[styles.countryName, editCountry === item.code && { color: Colors.indigoLight }]}>{item.name}</Text>
                {editCountry === item.code && <Check color={Colors.indigo} size={18} />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>

      {/* Avatar Seçici Modal */}
      <Modal visible={avatarModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Avatar Seç</Text>
            <TouchableOpacity onPress={() => setAvatarModal(false)} style={styles.modalClose}>
              <X color={Colors.white} size={22} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={PRESET_AVATARS}
            keyExtractor={url => url}
            numColumns={4}
            contentContainerStyle={{ padding: 16 }}
            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            ListHeaderComponent={
              <TouchableOpacity
                style={[styles.avatarRemoveBtn, !editAvatarUrl && { opacity: 0.35 }]}
                onPress={() => { setEditAvatarUrl(null); setAvatarModal(false); }}
                disabled={!editAvatarUrl}
              >
                <Text style={styles.avatarRemoveBtnText}>Baş Harf Kullan (Avatarı Kaldır)</Text>
              </TouchableOpacity>
            }
            renderItem={({ item }) => {
              const selected = editAvatarUrl === item;
              return (
                <TouchableOpacity
                  style={[styles.avatarPreset, selected && styles.avatarPresetSelected]}
                  onPress={() => { setEditAvatarUrl(item); setAvatarModal(false); }}
                >
                  <Image source={{ uri: item }} style={styles.avatarPresetImg} />
                  {selected && (
                    <View style={styles.avatarPresetCheck}>
                      <Check color="#fff" size={12} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  scroll:       { padding: 20, paddingBottom: 60 },
  pageHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  pageTitle:    { fontSize: 22, fontWeight: "800", color: Colors.white },
  editBtn:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.indigo + "20", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.indigo + "40" },
  editBtnText:  { fontSize: 13, fontWeight: "700", color: Colors.indigo },
  editActions:  { flexDirection: "row", gap: 8 },
  cancelBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  saveBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.indigo, alignItems: "center", justifyContent: "center" },
  avatarBox:    { alignItems: "center", marginBottom: 28, gap: 8 },
  avatar:       { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.indigo + "30", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.indigo + "60" },
  avatarText:   { fontSize: 36, fontWeight: "800", color: Colors.indigo },
  leagueBadge:  { position: "absolute", bottom: -2, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  avatarEditDot:{ position: "absolute", bottom: -2, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.indigo, alignItems: "center", justifyContent: "center" },
  name:         { fontSize: 22, fontWeight: "700", color: Colors.white },
  email:        { fontSize: 14, color: Colors.muted },
  rolePill:     { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  rolePillText: { fontSize: 12, fontWeight: "700" },
  card:         { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, padding: 16 },
  infoRow:      { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 2 },
  infoLabel:    { fontSize: 14, color: Colors.muted, flex: 1 },
  infoValue:    { fontSize: 14, fontWeight: "600", color: Colors.white, flex: 1, textAlign: "right" },
  divider:      { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  fieldLabel:   { fontSize: 12, fontWeight: "700", color: Colors.muted, marginBottom: 6 },
  input:        { backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: Colors.white, fontSize: 14 },
  pickerBtn:    { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  pickerBtnText:{ flex: 1, color: Colors.white, fontSize: 14 },
  interestsGrid:{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  interestPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border },
  interestPillActive: { backgroundColor: Colors.indigo + "30", borderColor: Colors.indigo + "60" },
  interestPillText: { fontSize: 13, fontWeight: "600", color: Colors.muted },
  interestPillTextActive: { color: Colors.indigoLight },
  tagsWrap:     { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" },
  tagChip:      { backgroundColor: Colors.indigo + "15", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: Colors.indigo + "30" },
  tagChipText:  { fontSize: 11, fontWeight: "600", color: Colors.indigoLight },
  passwordToggle: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 4, marginBottom: 8 },
  passwordToggleText: { fontSize: 14, fontWeight: "700", color: Colors.indigo },
  logoutBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.red + "15", borderRadius: 14, paddingVertical: 15, borderWidth: 1, borderColor: Colors.red + "30", marginTop: 8 },
  logoutText:   { fontSize: 16, fontWeight: "700", color: Colors.red },
  // Modals
  modalContainer:   { flex: 1, backgroundColor: Colors.bg },
  modalHeader:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:       { fontSize: 18, fontWeight: "800", color: Colors.white },
  modalClose:       { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  modalSearch:      { paddingHorizontal: 16, paddingVertical: 12 },
  modalSearchInput: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: Colors.white, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  countryRow:       { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
  countryRowSelected: { backgroundColor: Colors.indigo + "12" },
  countryFlag:      { fontSize: 26 },
  countryName:      { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.white },
  separator:        { height: 1, backgroundColor: Colors.border, marginLeft: 60 },
  // Avatar picker
  avatarRemoveBtn:     { marginBottom: 16, padding: 12, backgroundColor: Colors.card2, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  avatarRemoveBtnText: { color: Colors.muted, textAlign: "center", fontSize: 13, fontWeight: "600" },
  avatarPreset:        { flex: 1, aspectRatio: 1, borderRadius: 14, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  avatarPresetSelected:{ borderColor: Colors.indigo },
  avatarPresetImg:     { width: "100%", height: "100%" },
  avatarPresetCheck:   { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.indigo, alignItems: "center", justifyContent: "center" },
});
