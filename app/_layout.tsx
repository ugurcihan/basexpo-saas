import "expo-dev-client";
import { useEffect, useRef, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator } from "react-native";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { registerForPushNotifications, savePushToken } from "@/lib/notifications";
import type { Session } from "@supabase/supabase-js";

export { ErrorBoundary } from "expo-router";

// Uygulama ön planda iken gelen bildirimleri göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const router                = useRouter();
  const notifSubRef           = useRef<Notifications.Subscription | null>(null);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Push token kaydet & bildirim tap dinleyici
  useEffect(() => {
    if (!session?.user) {
      notifSubRef.current?.remove();
      notifSubRef.current = null;
      return;
    }

    const uid = session.user.id;

    // Token kaydet (sadece gerçek cihazda çalışır, simulator'da null döner)
    registerForPushNotifications().then(token => {
      if (token) savePushToken(uid, token);
    });

    // Bildirime tıklanınca bildirimler ekranına git
    notifSubRef.current = Notifications.addNotificationResponseReceivedListener(() => {
      router.push("/notifications" as any);
    });

    return () => {
      notifSubRef.current?.remove();
      notifSubRef.current = null;
    };
  }, [session?.user?.id]);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
        <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="events/[id]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="organizer/[id]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="gm-panel" options={{ animation: "slide_from_right" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
