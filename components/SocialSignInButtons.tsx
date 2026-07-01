import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { signInWithApple, signInWithGoogle, isSocialSignInCancelled } from "@/lib/auth/socialAuth";
import { Colors } from "@/constants/Colors";

export default function SocialSignInButtons({ onSuccess }: { onSuccess: () => void }) {
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleApple() {
    try {
      await signInWithApple();
      onSuccess();
    } catch (e) {
      if (!isSocialSignInCancelled(e)) {
        Alert.alert("Apple Giriş Hatası", e instanceof Error ? e.message : "Bir hata oluştu.");
      }
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (e) {
      if (!isSocialSignInCancelled(e)) {
        Alert.alert("Google Giriş Hatası", e instanceof Error ? e.message : "Bir hata oluştu.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>veya</Text>
        <View style={styles.dividerLine} />
      </View>

      {Platform.OS === "ios" && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={14}
          style={styles.appleBtn}
          onPress={handleApple}
        />
      )}

      <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={googleLoading}>
        {googleLoading ? (
          <ActivityIndicator color={Colors.bg} />
        ) : (
          <>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Google ile Giriş Yap</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 18 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.muted, fontSize: 13, marginHorizontal: 10 },
  appleBtn: { width: "100%", height: 50, marginBottom: 12 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    height: 50,
    gap: 8,
  },
  googleG: { fontSize: 18, fontWeight: "800", color: "#4285F4" },
  googleText: { fontSize: 15, fontWeight: "700", color: Colors.bg },
});
