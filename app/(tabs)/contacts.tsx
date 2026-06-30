import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Linking, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { Search, Mail, Phone, Globe, BookOpen, ChevronDown, Check } from "lucide-react-native";

type Contact = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  contact_type: string;
};

type FirmNote = {
  contact_id: string | null;
  personal_note: string | null;
  status: "new" | "contacted" | "pending" | "done";
};

type FirmItem = {
  leadId: string;
  firm: {
    id: string;
    company_name: string;
    phone: string | null;
    website: string | null;
    city: string | null;
    contact_name: string | null;
    job_title: string | null;
    event: { name: string } | null;
    contacts: Contact[];
  };
  note: FirmNote | null;
};

const STATUS_OPTS: { value: FirmNote["status"]; label: string; color: string }[] = [
  { value: "new",       label: "Yeni",             color: Colors.muted },
  { value: "contacted", label: "İletişime Geçtim", color: Colors.cyan },
  { value: "pending",   label: "Beklemede",        color: Colors.amber },
  { value: "done",      label: "Tamamlandı",       color: Colors.green },
];

function FirmCard({ item, onSaved }: { item: FirmItem; onSaved: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(item.note?.contact_id ?? null);
  const [note, setNote] = useState(item.note?.personal_note ?? "");
  const [status, setStatus] = useState<FirmNote["status"]>(item.note?.status ?? "new");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selected = item.firm.contacts.find(c => c.id === selectedContactId);
  const activePhone = selected?.phone ?? item.firm.phone ?? null;
  const activeEmail = selected?.email ?? null;

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("visitor_firm_notes").upsert(
      {
        visitor_id: user.id,
        exhibitor_id: item.firm.id,
        contact_id: selectedContactId,
        personal_note: note.trim() || null,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "visitor_id,exhibitor_id" },
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onSaved(); }, 1500);
  }

  const statusOpt = STATUS_OPTS.find(s => s.value === status)!;

  return (
    <View style={styles.firmCard}>
      <TouchableOpacity style={styles.firmHeader} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={styles.firmAvatar}>
          <Text style={styles.firmAvatarText}>{item.firm.company_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.firmName}>{item.firm.company_name}</Text>
          {item.firm.city && <Text style={styles.firmCity}>{item.firm.city}</Text>}
        </View>
        <View style={[styles.statusPill, { borderColor: statusOpt.color + "50" }]}>
          <Text style={[styles.statusPillText, { color: statusOpt.color }]}>{statusOpt.label}</Text>
        </View>
        <ChevronDown color={Colors.muted} size={18} style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.firmBody}>
          {/* Contacts */}
          {item.firm.contacts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>KİMİYLE GÖRÜŞTÜM</Text>
              {item.firm.contacts.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.contactRow, selectedContactId === c.id && styles.contactRowSelected]}
                  onPress={() => setSelectedContactId(prev => prev === c.id ? null : c.id)}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>{(c.full_name ?? "?").charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{c.full_name}</Text>
                    {c.job_title && <Text style={styles.contactJob}>{c.job_title}</Text>}
                  </View>
                  {selectedContactId === c.id && <Check color={Colors.indigo} size={16} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick actions */}
          <View style={styles.actionsRow}>
            {activeEmail && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`mailto:${activeEmail}`)}>
                <Mail color={Colors.indigo} size={16} />
                <Text style={styles.actionBtnText}>Mail</Text>
              </TouchableOpacity>
            )}
            {activePhone && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${activePhone}`)}>
                <Phone color={Colors.cyan} size={16} />
                <Text style={styles.actionBtnText}>Ara</Text>
              </TouchableOpacity>
            )}
            {item.firm.website && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(item.firm.website!)}>
                <Globe color={Colors.muted} size={16} />
                <Text style={styles.actionBtnText}>Web</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DURUM</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTS.map(s => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.statusBtn, status === s.value && { backgroundColor: s.color + "20", borderColor: s.color + "60" }]}
                  onPress={() => setStatus(s.value)}
                >
                  <Text style={[styles.statusBtnText, status === s.value && { color: s.color }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTLARIM</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Görüşme notları..."
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saved && { backgroundColor: Colors.green + "20", borderColor: Colors.green + "50" }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.indigo} size="small" />
            ) : saved ? (
              <Text style={[styles.saveBtnText, { color: Colors.green }]}>✓ Kaydedildi</Text>
            ) : (
              <Text style={styles.saveBtnText}>Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ContactsScreen() {
  const [firms, setFirms] = useState<FirmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  async function loadContacts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: leads }, { data: notes }] = await Promise.all([
      supabase
        .from("leads")
        .select(`id, exhibitor:exhibitors(id, company_name, phone, website, city, contact_name, job_title, event:events(name), contacts:exhibitor_contacts(id, full_name, email, phone, job_title, contact_type, sort_order))`)
        .eq("visitor_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("visitor_firm_notes")
        .select("exhibitor_id, contact_id, personal_note, status")
        .eq("visitor_id", user.id),
    ]);

    const noteMap = new Map((notes ?? []).map(n => [n.exhibitor_id as string, n]));
    const seen = new Set<string>();

    const items: FirmItem[] = (leads ?? [])
      .map(l => {
        const ex = Array.isArray(l.exhibitor) ? l.exhibitor[0] : l.exhibitor;
        if (!ex || seen.has(ex.id as string)) return null;
        seen.add(ex.id as string);
        const ev = Array.isArray(ex.event) ? ex.event[0] : ex.event;
        const contacts = (Array.isArray(ex.contacts) ? ex.contacts : [])
          .sort((a: Contact, b: Contact) => a.sort_order - b.sort_order);
        const note = noteMap.get(ex.id as string) ?? null;
        return {
          leadId: l.id as string,
          firm: { id: ex.id as string, company_name: ex.company_name as string, phone: ex.phone as string | null, website: ex.website as string | null, city: ex.city as string | null, contact_name: ex.contact_name as string | null, job_title: ex.job_title as string | null, event: ev ? { name: ev.name as string } : null, contacts },
          note: note ? { contact_id: note.contact_id as string | null, personal_note: note.personal_note as string | null, status: (note.status ?? "new") as FirmNote["status"] } : null,
        };
      })
      .filter(Boolean) as FirmItem[];

    setFirms(items);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { loadContacts(); }, []);

  const filtered = search
    ? firms.filter(f => f.firm.company_name.toLowerCase().includes(search.toLowerCase()) || (f.firm.city ?? "").toLowerCase().includes(search.toLowerCase()))
    : firms;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Kartvizit Defterim</Text>
        <Text style={styles.pageCount}>{firms.length} firma</Text>
      </View>

      <View style={styles.searchBox}>
        <Search color={Colors.muted} size={16} />
        <TextInput
          style={styles.searchInput}
          placeholder="Firma veya şehir ara..."
          placeholderTextColor={Colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {firms.length === 0 ? (
        <View style={styles.emptyBox}>
          <BookOpen color={Colors.muted} size={48} />
          <Text style={styles.emptyTitle}>Henüz kartvizit yok</Text>
          <Text style={styles.emptyText}>Bir fuarda firma QR kodlarını tarayın.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.leadId}
          renderItem={({ item }) => <FirmCard item={item} onSaved={loadContacts} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadContacts(); }} tintColor={Colors.indigo} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 20, paddingTop: 8, marginBottom: 12 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: Colors.white },
  pageCount: { fontSize: 12, color: Colors.muted },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.card, borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  searchInput: { flex: 1, color: Colors.white, fontSize: 14 },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingBottom: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.white },
  emptyText: { fontSize: 13, color: Colors.muted, textAlign: "center" },
  firmCard: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  firmHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  firmAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.indigo + "20", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.indigo + "40" },
  firmAvatarText: { fontSize: 18, fontWeight: "700", color: Colors.indigo },
  firmName: { fontSize: 14, fontWeight: "700", color: Colors.white },
  firmCity: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, backgroundColor: "transparent" },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  firmBody: { borderTopWidth: 1, borderTopColor: Colors.border, padding: 14, gap: 16 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: Colors.muted, letterSpacing: 0.8 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border },
  contactRowSelected: { borderColor: Colors.indigo + "60", backgroundColor: Colors.indigo + "12" },
  contactAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.indigo + "20", alignItems: "center", justifyContent: "center" },
  contactAvatarText: { fontSize: 14, fontWeight: "700", color: Colors.indigoLight },
  contactName: { fontSize: 13, fontWeight: "600", color: Colors.white },
  contactJob: { fontSize: 11, color: Colors.muted },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.card2, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  actionBtnText: { fontSize: 12, fontWeight: "600", color: Colors.white },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: "transparent" },
  statusBtnText: { fontSize: 12, fontWeight: "600", color: Colors.muted },
  noteInput: { backgroundColor: Colors.card2, borderRadius: 12, padding: 12, color: Colors.white, fontSize: 13, borderWidth: 1, borderColor: Colors.border, minHeight: 72, textAlignVertical: "top" },
  saveBtn: { backgroundColor: Colors.indigo, borderRadius: 12, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: Colors.indigo },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
