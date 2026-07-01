import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  ActivityIndicator, Linking, TextInput, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { ChevronDown, ChevronRight, Mail, Phone, Globe, Lock } from "lucide-react-native";

// ── Types ────────────────────────────────────────────────────

type Contact = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
};

type FirmItem = {
  id: string;
  company_name: string;
  phone: string | null;
  website: string | null;
  city: string | null;
  contacts: Contact[];
  event_id: string | null;
  // card viewed (points awarded) flag
  card_viewed: boolean;
};

type FairSection = {
  fair_id: string | null;
  fair_name: string;
  checked_in: boolean;
  data: FirmItem[];
};

// ── Firma kartı ──────────────────────────────────────────────

function FirmCard({ item, fairId, onViewed }: { item: FirmItem; fairId: string | null; onViewed: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);

    // İlk kez açılıyorsa +1 puan ver
    if (next && !item.card_viewed && fairId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Puan ekle
        await supabase.from("loyalty_points").insert({
          visitor_id: user.id,
          event_id:   fairId,
          exhibitor_id: item.id,
          points:     1,
          reason:     "card_view",
        });
        // visitor_firm_notes upsert ile "görüldü" işaretle
        await supabase.from("visitor_firm_notes").upsert(
          { visitor_id: user.id, exhibitor_id: item.id, status: "new" },
          { onConflict: "visitor_id,exhibitor_id", ignoreDuplicates: true }
        );
        onViewed(item.id);
      } catch {
        // Sessizce geç
      }
    }
  }

  const phone = item.contacts.find(c => c.phone)?.phone ?? item.phone;
  const email = item.contacts.find(c => c.email)?.email;

  return (
    <View style={styles.firmCard}>
      <TouchableOpacity style={styles.firmHeader} onPress={handleExpand} activeOpacity={0.75}>
        <View style={styles.firmAvatar}>
          <Text style={styles.firmAvatarText}>{item.company_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.firmName}>{item.company_name}</Text>
          {item.city && <Text style={styles.firmCity}>{item.city}</Text>}
        </View>
        {!item.card_viewed && (
          <View style={styles.newBadge}><Text style={styles.newBadgeText}>+1 puan</Text></View>
        )}
        {expanded ? <ChevronDown color={Colors.muted} size={18} /> : <ChevronRight color={Colors.muted} size={18} />}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.firmBody}>
          {/* Yetkili kişiler */}
          {item.contacts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>YETKİLİ KİŞİLER</Text>
              {item.contacts.map(c => (
                <View key={c.id} style={styles.contactRow}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>{(c.full_name ?? "?").charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{c.full_name}</Text>
                    {c.job_title && <Text style={styles.contactJob}>{c.job_title}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Hızlı iletişim */}
          <View style={styles.actionsRow}>
            {email && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`mailto:${email}`)}>
                <Mail color={Colors.indigo} size={15} />
                <Text style={styles.actionBtnText}>Mail</Text>
              </TouchableOpacity>
            )}
            {phone && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${phone}`)}>
                <Phone color={Colors.cyan} size={15} />
                <Text style={styles.actionBtnText}>Ara</Text>
              </TouchableOpacity>
            )}
            {item.website && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(item.website!)}>
                <Globe color={Colors.muted} size={15} />
                <Text style={styles.actionBtnText}>Web</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Kilitli fuar bölümü ──────────────────────────────────────

function LockedSection({ name }: { name: string }) {
  return (
    <View style={styles.lockedSection}>
      <Lock color={Colors.muted} size={20} />
      <View>
        <Text style={styles.lockedName}>{name}</Text>
        <Text style={styles.lockedHint}>Fuara giriş yaptıktan sonra açılır</Text>
      </View>
    </View>
  );
}

// ── Fuar bölüm başlığı ───────────────────────────────────────

function SectionHeader({ section }: { section: FairSection }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionHeadEmoji}>{section.checked_in ? "📂" : "🔒"}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionHeadName}>{section.fair_name}</Text>
        {section.checked_in && (
          <Text style={styles.sectionHeadCount}>{section.data.length} firma</Text>
        )}
      </View>
      {section.checked_in && (
        <View style={styles.unlockedBadge}>
          <Text style={styles.unlockedBadgeText}>Açık</Text>
        </View>
      )}
    </View>
  );
}

// ── Ana Ekran ─────────────────────────────────────────────────

export default function ContactsScreen() {
  const [sections, setSections] = useState<FairSection[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewedIds, setViewedIds]   = useState<Set<string>>(new Set());

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Paralel sorgular
    const [regsRes, checkinsRes, leadsRes, notesRes] = await Promise.all([
      supabase
        .from("event_registrations")
        .select("event_id, events(id, name)")
        .eq("visitor_id", user.id),
      supabase
        .from("fair_checkins")
        .select("event_id")
        .eq("visitor_id", user.id),
      supabase
        .from("leads")
        .select(`exhibitor_id, exhibitors(id, company_name, phone, website, city, event_id, contacts:exhibitor_contacts(id, full_name, email, phone, job_title, sort_order))`)
        .eq("visitor_id", user.id),
      supabase
        .from("visitor_firm_notes")
        .select("exhibitor_id")
        .eq("visitor_id", user.id),
    ]);

    const checkedInSet = new Set((checkinsRes.data ?? []).map(c => c.event_id as string));
    const viewedSet    = new Set((notesRes.data ?? []).map(n => n.exhibitor_id as string));
    setViewedIds(viewedSet);

    // Lead'leri firma bazlı tekilleştir
    const seen = new Set<string>();
    const firmsByEvent = new Map<string, FirmItem[]>();

    for (const lead of (leadsRes.data ?? [])) {
      const ex = Array.isArray(lead.exhibitors) ? lead.exhibitors[0] : lead.exhibitors;
      if (!ex || seen.has(ex.id as string)) continue;
      seen.add(ex.id as string);

      const eventId = ex.event_id as string | null;
      const key = eventId ?? "__standalone__";
      if (!firmsByEvent.has(key)) firmsByEvent.set(key, []);

      const contacts: Contact[] = ((Array.isArray(ex.contacts) ? ex.contacts : []) as any[])
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(c => ({ id: c.id, full_name: c.full_name, email: c.email, phone: c.phone, job_title: c.job_title }));

      firmsByEvent.get(key)!.push({
        id:           ex.id as string,
        company_name: ex.company_name as string,
        phone:        ex.phone as string | null,
        website:      ex.website as string | null,
        city:         ex.city as string | null,
        event_id:     eventId,
        contacts,
        card_viewed:  viewedSet.has(ex.id as string),
      });
    }

    // Fuar bölümleri: önce kayıtlı fuarlar
    const built: FairSection[] = [];

    for (const reg of (regsRes.data ?? [])) {
      const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
      const eventId = reg.event_id as string;
      const checkedIn = checkedInSet.has(eventId);
      const firms = firmsByEvent.get(eventId) ?? [];

      built.push({
        fair_id:    eventId,
        fair_name:  ev?.name ?? "Fuar",
        checked_in: checkedIn,
        data:       checkedIn ? firms : [],
      });
    }

    // Bağımsız QR'lar (event_id=null), her zaman görünür
    const standalone = firmsByEvent.get("__standalone__") ?? [];
    if (standalone.length > 0) {
      built.push({ fair_id: null, fair_name: "Diğer Firmalar", checked_in: true, data: standalone });
    }

    // Sıralama: açık + firma var > açık + boş > kilitli
    built.sort((a, b) => {
      const scoreA = a.checked_in ? (a.data.length > 0 ? 2 : 1) : 0;
      const scoreB = b.checked_in ? (b.data.length > 0 ? 2 : 1) : 0;
      return scoreB - scoreA;
    });

    setSections(built);
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  function markViewed(firmId: string) {
    setViewedIds(prev => new Set([...prev, firmId]));
    setSections(prev => prev.map(s => ({
      ...s,
      data: s.data.map(f => f.id === firmId ? { ...f, card_viewed: true } : f),
    })));
  }

  const totalFirms = sections.reduce((s, sec) => s + sec.data.length, 0);
  const newCards   = sections.reduce((s, sec) => s + sec.data.filter(f => !f.card_viewed).length, 0);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Kartvizit Defterim</Text>
          <Text style={styles.pageSubtitle}>{totalFirms} firma{newCards > 0 ? ` · ${newCards} yeni` : ""}</Text>
        </View>
        {newCards > 0 && (
          <View style={styles.newBadgeLg}>
            <Text style={styles.newBadgeLgText}>+{newCards} yeni kart</Text>
          </View>
        )}
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🃏</Text>
          <Text style={styles.emptyTitle}>Henüz kartvizit yok</Text>
          <Text style={styles.emptyText}>Fuarlarda firma standlarını ziyaret et, QR kodlarını tara.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.indigo} />
          }
          contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}
          renderSectionHeader={({ section }) => (
            <View>
              <SectionHeader section={section as FairSection} />
              {!section.checked_in && <LockedSection name={(section as FairSection).fair_name} />}
              {section.checked_in && section.data.length === 0 && (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>Henüz stant ziyaret etmedin. QR tara, kartvizit topla!</Text>
                </View>
              )}
            </View>
          )}
          renderItem={({ item, section }) =>
            (section as FairSection).checked_in ? (
              <View style={{ paddingHorizontal: 16 }}>
                <FirmCard item={item} fairId={(section as FairSection).fair_id} onViewed={markViewed} />
              </View>
            ) : null
          }
          renderSectionFooter={() => <View style={{ height: 16 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg },
  pageHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  pageTitle:       { fontSize: 22, fontWeight: "800", color: Colors.white },
  pageSubtitle:    { fontSize: 12, color: Colors.muted, marginTop: 2 },
  newBadgeLg:      { backgroundColor: Colors.indigo + "25", borderRadius: 12, borderWidth: 1, borderColor: Colors.indigo + "50", paddingHorizontal: 12, paddingVertical: 6 },
  newBadgeLgText:  { color: Colors.indigoLight, fontSize: 12, fontWeight: "700" },

  // Bölüm başlığı
  sectionHead:     { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionHeadEmoji:{ fontSize: 22 },
  sectionHeadName: { fontSize: 15, fontWeight: "700", color: Colors.white },
  sectionHeadCount:{ fontSize: 11, color: Colors.muted, marginTop: 2 },
  unlockedBadge:   { backgroundColor: Colors.green + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  unlockedBadgeText:{ fontSize: 10, fontWeight: "700", color: Colors.green },

  // Kilitli bölüm
  lockedSection:   { flexDirection: "row", alignItems: "center", gap: 12, margin: 16, backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, opacity: 0.6 },
  lockedName:      { color: Colors.white, fontWeight: "600", fontSize: 14 },
  lockedHint:      { color: Colors.muted, fontSize: 12, marginTop: 2 },

  // Boş bölüm
  emptySection:    { margin: 16, backgroundColor: Colors.card, borderRadius: 14, padding: 16, alignItems: "center" },
  emptySectionText:{ color: Colors.muted, fontSize: 13, textAlign: "center" },

  // Firma kartı
  firmCard:        { backgroundColor: Colors.card, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  firmHeader:      { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  firmAvatar:      { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.indigo + "20", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.indigo + "40" },
  firmAvatarText:  { fontSize: 18, fontWeight: "700", color: Colors.indigo },
  firmName:        { fontSize: 14, fontWeight: "700", color: Colors.white },
  firmCity:        { fontSize: 11, color: Colors.muted, marginTop: 1 },
  newBadge:        { backgroundColor: Colors.indigo + "25", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: Colors.indigo + "40", marginRight: 4 },
  newBadgeText:    { fontSize: 10, fontWeight: "700", color: Colors.indigoLight },
  firmBody:        { borderTopWidth: 1, borderTopColor: Colors.border, padding: 14, gap: 14 },
  section:         { gap: 8 },
  sectionLabel:    { fontSize: 10, fontWeight: "700", color: Colors.muted, letterSpacing: 0.8 },
  contactRow:      { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border },
  contactAvatar:   { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.indigo + "20", alignItems: "center", justifyContent: "center" },
  contactAvatarText:{ fontSize: 14, fontWeight: "700", color: Colors.indigoLight },
  contactName:     { fontSize: 13, fontWeight: "600", color: Colors.white },
  contactJob:      { fontSize: 11, color: Colors.muted },
  actionsRow:      { flexDirection: "row", gap: 8 },
  actionBtn:       { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.card2, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  actionBtnText:   { fontSize: 12, fontWeight: "600", color: Colors.white },

  // Boş ekran
  emptyBox:        { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingBottom: 60 },
  emptyEmoji:      { fontSize: 52 },
  emptyTitle:      { fontSize: 18, fontWeight: "700", color: Colors.white },
  emptyText:       { fontSize: 13, color: Colors.muted, textAlign: "center", paddingHorizontal: 40 },
});
