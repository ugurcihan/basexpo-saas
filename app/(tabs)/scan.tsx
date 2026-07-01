import { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { ScanLine, CheckCircle, QrCode } from "lucide-react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const lastScan = useRef<string>("");

  function reset() {
    setScanned(false);
    setProcessing(false);
    lastScan.current = "";
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || processing || data === lastScan.current) return;
    lastScan.current = data;
    setScanned(true);
    setProcessing(true);

    // URL'den token çıkar — örn: https://domain.com/scan/abc123 veya /scan/booth/abc123
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
              <Text style={styles.scanHint}>Firma QR kodunu çerçeveye getirin</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const OVERLAY = "rgba(10,10,26,0.72)";
const BOX = 260;
const CORNER = 24;
const BORDER = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  overlay: { ...StyleSheet.absoluteFill },
  topOverlay: { flex: 1, backgroundColor: OVERLAY },
  middleRow: { flexDirection: "row", height: BOX },
  sideOverlay: { flex: 1, backgroundColor: OVERLAY },
  scanBox: { width: BOX, height: BOX },
  bottomOverlay: { flex: 1, backgroundColor: OVERLAY, alignItems: "center", justifyContent: "center", gap: 12 },
  corner: { position: "absolute", width: CORNER, height: CORNER, borderColor: Colors.indigo, borderWidth: BORDER },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  scanHint: { color: Colors.white, fontSize: 14, fontWeight: "600", textAlign: "center" },
  permissionBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },
  permissionTitle: { fontSize: 22, fontWeight: "800", color: Colors.white, textAlign: "center" },
  permissionText: { fontSize: 14, color: Colors.muted, textAlign: "center", lineHeight: 20 },
  permBtn: { backgroundColor: Colors.indigo, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  permBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
