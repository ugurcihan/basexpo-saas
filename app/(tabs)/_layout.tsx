import { TouchableOpacity } from "react-native";
import { Tabs } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Compass, QrCode, BookOpen, Ticket, User, Gamepad2 } from "lucide-react-native";

function QrAdaButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        top: -22,
        justifyContent: "center",
        alignItems: "center",
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.indigo,
        shadowColor: Colors.indigo,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 14,
        elevation: 10,
        borderWidth: 3,
        borderColor: Colors.card,
      }}
    >
      <QrCode color="#fff" size={26} />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
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
      <Tabs.Screen
        name="scan"
        options={{
          title: "",
          tabBarLabel: () => null,
          tabBarButton: (props) => <QrAdaButton onPress={props.onPress ?? undefined} />,
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
  );
}
