// Web'de push notification yok — stub
export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}

export async function savePushToken(_userId: string, _token: string) {
  // no-op on web
}
