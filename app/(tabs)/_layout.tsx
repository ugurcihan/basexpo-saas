import { TouchableOpacity, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Compass, QrCode, BookOpen, Ticket, User, Gamepad2 } from "lucide-react-native";

export default function TabLayout() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.card,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 88,
            paddingBottom: 24,
            paddingTop: 10,
          },
          tabBarActiveTintColor: Colors.indigo,
          tabBarInactiveTintColor: Colors.muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Keşfet",
            tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="tickets"
          options={{
            title: "Biletlerim",
            tabBarIcon: ({ color, size }) => <Ticket color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="game"
          options={{
            title: "Oyunlar",
            tabBarIcon: ({ color, size }) => <Gamepad2 color={color} size={size} />,
          }}
        />
        {/* Boş slot — FAB bu alanın üzerinde yüzer */}
        <Tabs.Screen
          name="scan"
          options={{
            title: "",
            tabBarLabel: () => null,
            tabBarIcon: () => null,
            tabBarButton: () => <View style={{ flex: 1 }} />,
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: "Kartvizitler",
            tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>

      {/* True Ada FAB — tab bar'dan tamamen bağımsız, gerçek floating */}
      <TouchableOpacity
        onPress={() => router.navigate("/(tabs)/scan")}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          bottom: 32,
          alignSelf: "center",
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: Colors.indigo,
          alignItems: "center",
          justifyContent: "center",
          // Güçlü glowing gölge
          shadowColor: Colors.indigo,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.75,
          shadowRadius: 20,
          elevation: 14,
          // Temiz sınır — arka planı keser
          borderWidth: 4,
          borderColor: Colors.bg,
        }}
      >
        <QrCode color="#fff" size={28} />
      </TouchableOpacity>
    </View>
  );
}
