import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

const EXPO_PROJECT_ID = "e3218a01-8351-47ac-ae58-5c75e99ce787";

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    // Genel kanal
    await Notifications.setNotificationChannelAsync("default", {
      name: "Genel Bildirimler",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    // Organizatör duyuruları (yüksek öncelik)
    await Notifications.setNotificationChannelAsync("announcements", {
      name: "Duyurular",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId: EXPO_PROJECT_ID })
  ).data;

  return token;
}

export async function savePushToken(userId: string, token: string) {
  await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: userId, token, platform: Platform.OS },
      { onConflict: "user_id" },
    );
}
