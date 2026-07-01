import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { QrCode } from "lucide-react-native";

export default function ScanScreenWeb() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center", gap: 16 }}>
      <QrCode color={Colors.indigo} size={64} />
      <Text style={{ color: Colors.white, fontSize: 20, fontWeight: "800" }}>QR Tarama</Text>
      <Text style={{ color: Colors.muted, fontSize: 14, textAlign: "center", paddingHorizontal: 40 }}>
        QR kod tarama özelliği yalnızca mobil uygulamada kullanılabilir.
      </Text>
    </SafeAreaView>
  );
}
