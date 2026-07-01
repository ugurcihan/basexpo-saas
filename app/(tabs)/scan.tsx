import { useEffect, useRef, useState } from "react";
import {
  Animated, Modal, View, Text, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { ScanLine, CheckCircle, QrCode } from "lucide-react-native";

// ── Altın QR Modal ───────────────────────────────────────────────

type GoldenPrize = { label: string; prize_description: string | null };

function GoldenPrizeModal({ prize, onClose }: { prize: GoldenPrize | null; onClose: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!prize) return;
    scale.setValue(0);
    glow.setValue(0);
    const anim = Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1100, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.4, duration: 1100, useNativeDriver: true }),
        ]),
        { iterations: 20 }
      ),
    ]);
    anim.start();
    return () => anim.stop();
  }, [prize]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Modal transparent animationType="fade" visible={!!prize} onRequestClose={onClose}>
      <View style={gm.backdrop}>
        <Animated.View style={[gm.card, { transform: [{ scale }] }]}>
          <Animated.Text style={[gm.sparkleTop, { opacity: glowOpacity }]}>✨ ALTIN QR ✨</Animated.Text>
          <Animated.Text style={[gm.trophy, { opacity: glowOpacity }]}>🏆</Animated.Text>
          <Text style={gm.title}>{prize?.label ?? ""}</Text>
          <Text style={gm.desc}>
            {prize?.prize_description ?? "Tebrikler! Bu ödülü kazandınız."}
          </Text>
          <View style={gm.divider} />
          <Text style={gm.hint}>Standa gidin ve bu ekranı gösterin.</Text>
          <TouchableOpacity style={gm.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={gm.closeBtnText}>Kapat</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Ana Ekran ────────────────────────────────────────────────────

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned]           = useState(false);
  const [processing, setProcessing]     = useState(false);
  const [goldenPrize, setGoldenPrize]   = useState<GoldenPrize | null>(null);
  const router   = useRouter();
  const lastScan = useRef<string>("");

  function reset() {
    setScanned(false);
    setProcessing(false);
    lastScan.current = "";
  }

  function closeGoldenModal() {
    setGoldenPrize(null);
    reset();
  }

  async function handleGoldenQR(token: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("Giriş Gerekli", "Altın QR taramak için giriş yapmalısınız.", [{ text: "Tamam", onPress: reset }]);
      return;
    }

    const { data: qr } = await supabase
      .from("golden_qr_codes")
      .select("id, label, prize_description, is_active, scan_limit")
      .eq("token", token)
      .single();

    if (!qr || !qr.is_active) {
      Alert.alert("Geçersiz QR", "Bu Altın QR kodu artık aktif değil.", [{ text: "Tamam", onPress: reset }]);
      return;
    }

    if (qr.scan_limit) {
      const { count } = await supabase
        .from("golden_qr_scans")
        .select("*", { count: "exact", head: true })
        .eq("golden_qr_id", qr.id);
      if ((count ?? 0) >= qr.scan_limit) {
        Alert.alert("Kontenjan Doldu", "Bu ödülün kontenjanı dolmuş. Bir dahaki sefere!", [{ text: "Tamam", onPress: reset }]);
        return;
      }
    }

    const { error } = await supabase
      .from("golden_qr_scans")
      .insert({ visitor_id: user.id, golden_qr_id: qr.id });

    if (error?.code === "23505") {
      Alert.alert("Zaten Taradınız", "Bu Altın QR'ı daha önce taradınız.", [{ text: "Tamam", onPress: reset }]);
      return;
    }

    if (error) {
      Alert.alert("Hata", "Tarama kaydedilemedi. Lütfen tekrar deneyin.", [{ text: "Tamam", onPress: reset }]);
      return;
    }

    setProcessing(false);
    setGoldenPrize({ label: qr.label, prize_description: qr.prize_description ?? null });
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || processing || data === lastScan.current) return;
    lastScan.current = data;
    setScanned(true);
    setProcessing(true);

    // ── Altın QR pattern: /golden-scan/TOKEN ────────────────────
    const goldenMatch = data.match(/\/golden-scan\/([a-zA-Z0-9_-]+)/);
    if (goldenMatch) {
      await handleGoldenQR(goldenMatch[1]);
      return;
    }

    // ── Booth QR pattern: /scan/[booth/]TOKEN ───────────────────
    const match = data.match(/\/scan\/(?:booth\/)?([a-zA-Z0-9_-]+)\/?(?:\?.*)?$/);
    if (!match) {
      Alert.alert(
        "Geçersiz QR",
        `Bu QR kodu BasExpo'ya ait değil.\n\nOkunan: ${data}`,
        [{ text: "Tekrar Dene", onPress: reset }],
      );
      return;
    }

    const token = match[1];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { reset(); return; }

    const { data: exhibitor } = await supabase
      .from("exhibitors")
      .select("id, company_name, event_id")
      .eq("qr_token", token)
      .single();

    if (!exhibitor) {
      Alert.alert(
        "Bulunamadı",
        `Token "${token}" ile eşleşen firma bulunamadı.`,
        [{ text: "Tekrar Dene", onPress: reset }],
      );
      return;
    }

    await supabase.from("leads").upsert(
      { visitor_id: user.id, exhibitor_id: exhibitor.id, source: "qr", score: 50 },
      { onConflict: "visitor_id,exhibitor_id" },
    );

    await supabase.from("qr_scans").insert({
      visitor_id: user.id,
      exhibitor_id: exhibitor.id,
      event_id: exhibitor.event_id ?? null,
    });

    await supabase.from("loyalty_points").upsert(
      { visitor_id: user.id, exhibitor_id: exhibitor.id, points: 20, reason: "booth_visit", event_id: exhibitor.event_id ?? null },
      { onConflict: "visitor_id,exhibitor_id,reason" },
    );

    setProcessing(false);

    Alert.alert(
      "Başarılı!",
      `${exhibitor.company_name} kartvizit defterine eklendi. +20 puan!`,
      [
        { text: "Kartvizite Git", onPress: () => { reset(); router.push("/(tabs)/contacts"); } },
        { text: "Taramaya Devam", onPress: reset },
      ],
    );
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <QrCode color={Colors.indigo} size={56} />
          <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
          <Text style={styles.permissionText}>QR kod taramak için kameraya erişim izni ver.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>İzin Ver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          {processing ? (
            <ActivityIndicator color={Colors.indigo} size="large" />
          ) : scanned ? (
            <CheckCircle color={Colors.indigo} size={40} />
          ) : (
            <>
              <ScanLine color={Colors.indigo} size={28} />
              <Text style={styles.scanHint}>Firma QR veya Altın QR kodunu çerçeveye getirin</Text>
            </>
          )}
        </View>
      </View>

      <GoldenPrizeModal prize={goldenPrize} onClose={closeGoldenModal} />
    </View>
  );
}

// ── Stiller ──────────────────────────────────────────────────────

const OVERLAY = "rgba(10,10,26,0.72)";
const BOX     = 260;
const CORNER  = 24;
const BORDER  = 3;

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg },
  overlay:         { ...StyleSheet.absoluteFill },
  topOverlay:      { flex: 1, backgroundColor: OVERLAY },
  middleRow:       { flexDirection: "row", height: BOX },
  sideOverlay:     { flex: 1, backgroundColor: OVERLAY },
  scanBox:         { width: BOX, height: BOX },
  bottomOverlay:   { flex: 1, backgroundColor: OVERLAY, alignItems: "center", justifyContent: "center", gap: 12 },
  corner:          { position: "absolute", width: CORNER, height: CORNER, borderColor: Colors.indigo, borderWidth: BORDER },
  topLeft:         { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  topRight:        { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bottomLeft:      { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  bottomRight:     { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  scanHint:        { color: Colors.white, fontSize: 14, fontWeight: "600", textAlign: "center", paddingHorizontal: 32 },
  permissionBox:   { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },
  permissionTitle: { fontSize: 22, fontWeight: "800", color: Colors.white, textAlign: "center" },
  permissionText:  { fontSize: 14, color: Colors.muted, textAlign: "center", lineHeight: 20 },
  permBtn:         { backgroundColor: Colors.indigo, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  permBtnText:     { color: "#fff", fontSize: 16, fontWeight: "700" },
});

const gm = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: "rgba(0,0,0,0.88)", alignItems: "center", justifyContent: "center" },
  card:         { backgroundColor: "#1a1000", borderRadius: 28, padding: 28, alignItems: "center", gap: 10, marginHorizontal: 24, borderWidth: 2, borderColor: "#f59e0b60", width: "88%" },
  sparkleTop:   { fontSize: 14, fontWeight: "800", color: "#f59e0b", letterSpacing: 2 },
  trophy:       { fontSize: 72, marginVertical: 4 },
  title:        { fontSize: 22, fontWeight: "900", color: "#f59e0b", textAlign: "center" },
  desc:         { fontSize: 15, color: "#fef3c7", textAlign: "center", lineHeight: 22 },
  divider:      { width: "80%", height: 1, backgroundColor: "#f59e0b30", marginVertical: 4 },
  hint:         { fontSize: 13, color: "#92400e", textAlign: "center", fontStyle: "italic" },
  closeBtn:     { marginTop: 6, backgroundColor: "#f59e0b", borderRadius: 14, paddingHorizontal: 36, paddingVertical: 14 },
  closeBtnText: { color: "#1a1000", fontSize: 16, fontWeight: "900" },
});
