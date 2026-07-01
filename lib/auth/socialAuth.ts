import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { supabase } from "@/lib/supabase";

// Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs
// "Web client" türünde oluşturulan client ID buraya girilir (iOS client ID değil).
const GOOGLE_WEB_CLIENT_ID = "REPLACE_WITH_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com";

let googleConfigured = false;
function ensureGoogleConfigured() {
  if (googleConfigured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  googleConfigured = true;
}

async function fillNameIfEmpty(fullName: string | null | undefined) {
  if (!fullName) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("profiles").update({ full_name: fullName }).eq("id", data.user.id).eq("full_name", "");
}

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error("Apple kimlik doğrulama başarısız.");
  }
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;

  const fullName = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(" ")
    : null;
  await fillNameIfEmpty(fullName);
}

export async function signInWithGoogle() {
  ensureGoogleConfigured();
  await GoogleSignin.hasPlayServices().catch(() => {});
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken;
  if (!idToken) {
    throw new Error("Google kimlik doğrulama başarısız.");
  }
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;

  await fillNameIfEmpty(userInfo.data?.user?.name);
}

export function isSocialSignInCancelled(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "ERR_REQUEST_CANCELED") return true;
  }
  if (isErrorWithCode(error)) {
    return error.code === statusCodes.SIGN_IN_CANCELLED;
  }
  return false;
}
