import { useEffect, useState } from "react";
import {
  Dimensions, Pressable, StyleSheet, Text, View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { openBox } from "@/lib/api/gamification";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");

type Phase =
  | "idle"
  | "countdown"
  | "legendary_buildup"
  | "reveal"
  | "done";

const TIER_COLORS: Record<string, readonly [string, string]> = {
  common:    ["#4a5568", "#718096"],
  rare:      ["#2b6cb0", "#63b3ed"],
  epic:      ["#553c9a", "#b794f4"],
  legendary: ["#744210", "#f6ad55"],
};

const TIER_LABELS: Record<string, string> = {
  common:    "Yaygın",
  rare:      "Nadir",
  epic:      "Destansı",
  legendary: "Efsanevi",
};

type OpenResult = {
  tier: string;
  reward: { name: string; description?: string; image_url?: string } | null;
  pity_applied: boolean;
  result_hash: string;
};

export default function OpenBoxScreen() {
  const { box_id, box_name } = useLocalSearchParams<{ box_id: string; box_name: string }>();
  const router = useRouter();

  const [phase, setPhase]         = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [result, setResult]       = useState<OpenResult | null>(null);
  const [loading, setLoading]     = useState(false);

  const boxScale       = useSharedValue(0);
  const boxRotate      = useSharedValue(0);
  const glowOpacity    = useSharedValue(0.4);
  const countScale     = useSharedValue(1);
  const revealScale    = useSharedValue(0);
  const legendaryFlash = useSharedValue(0);

  useEffect(() => {
    boxScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 900 }),
        withTiming(0.3, { duration: 900 }),
      ),
      -1,
      true
    );
    boxRotate.value = withRepeat(
      withSequence(
        withTiming(-0.05, { duration: 1200 }),
        withTiming(0.05, { duration: 1200 }),
      ),
      -1,
      true
    );
  }, []);

  async function handleOpen() {
    if (loading || phase !== "idle") return;
    setLoading(true);

    boxRotate.value = withSequence(
      withTiming(-0.15, { duration: 80 }),
      withTiming(0.15,  { duration: 80 }),
      withTiming(-0.1,  { duration: 60 }),
      withTiming(0,     { duration: 60 })
    );

    const res: OpenResult = await openBox(box_id);
    setResult(res);
    setLoading(false);

    if (res.tier === "legendary") {
      startLegendaryBuildup();
    } else {
      setPhase("countdown");
      setCountdown(3);
    }
  }

  function startLegendaryBuildup() {
    setPhase("legendary_buildup");
    boxRotate.value = withSequence(
      withRepeat(
        withSequence(
          withTiming(-0.3, { duration: 60 }),
          withTiming(0.3,  { duration: 60 }),
        ),
        8,
        true
      ),
      withTiming(0, { duration: 100 }, () => runOnJS(doReveal)())
    );
    legendaryFlash.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 300 }),
    );
  }

  function handleTap() {
    if (phase !== "countdown") return;

    countScale.value = withSequence(
      withTiming(1.3, { duration: 80, easing: Easing.out(Easing.quad) }),
      withSpring(1),
    );

    setCountdown(prev => {
      const next = prev - 1;
      if (next <= 0) doReveal();
      return next;
    });
  }

  function doReveal() {
    setPhase("reveal");
    revealScale.value = withSpring(1, { damping: 8, stiffness: 120 });
  }

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: boxScale.value },
      { rotate: `${boxRotate.value}rad` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const countStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  const revealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: revealScale.value }],
    opacity: revealScale.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: legendaryFlash.value,
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#fff",
    pointerEvents: "none",
  }));

  const tier   = result?.tier ?? "common";
  const colors = TIER_COLORS[tier] ?? TIER_COLORS.common;

  return (
    <LinearGradient colors={["#0a0a1a", "#1a0a2e", "#0a0a1a"]} style={styles.bg}>
      <SafeAreaView style={styles.safe}>

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>{box_name ?? "Kutu Aç"}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.center}>

          {(phase === "idle" || phase === "countdown") && (
            <Animated.View style={[styles.glow, glowStyle, { backgroundColor: colors[1] + "40" }]} />
          )}

          {phase !== "reveal" && phase !== "done" && (
            <Animated.View style={[styles.boxContainer, boxStyle]}>
              <Text style={styles.boxEmoji}>
                {tier === "legendary" ? "🎁" : tier === "epic" ? "📦" : "📫"}
              </Text>
            </Animated.View>
          )}

          {phase === "countdown" && (
            <Pressable onPress={handleTap} style={styles.countArea}>
              <Animated.Text style={[styles.countText, countStyle]}>
                {countdown}
              </Animated.Text>
              <Text style={styles.tapHint}>Ekrana dokun</Text>
            </Pressable>
          )}

          {(phase === "reveal" || phase === "done") && (
            <Animated.View style={[styles.rewardCard, revealStyle]}>
              <LinearGradient colors={[colors[0], colors[1]]} style={styles.rewardGradient}>
                <Text style={styles.tierBadge}>{TIER_LABELS[tier] ?? tier}</Text>
                <Text style={styles.rewardEmoji}>
                  {tier === "legendary" ? "🏆" : tier === "epic" ? "⭐" : tier === "rare" ? "💎" : "🎀"}
                </Text>
                <Text style={styles.rewardName}>
                  {result?.reward?.name ?? "Ödül Kazandın!"}
                </Text>
                {result?.reward?.description && (
                  <Text style={styles.rewardDesc}>{result.reward.description}</Text>
                )}
                {result?.pity_applied && (
                  <Text style={styles.pityBadge}>Garantili Ödül</Text>
                )}
              </LinearGradient>

              <Pressable style={styles.doneBtn} onPress={() => router.back()}>
                <Text style={styles.doneBtnText}>Harika!</Text>
              </Pressable>
            </Animated.View>
          )}

          {phase === "idle" && (
            <Pressable
              style={[styles.openBtn, loading && styles.openBtnDisabled]}
              onPress={handleOpen}
              disabled={loading}
            >
              <Text style={styles.openBtnText}>{loading ? "Açılıyor..." : "Kutuyu Aç!"}</Text>
            </Pressable>
          )}
        </View>

        <Animated.View style={flashStyle} pointerEvents="none" />

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg:             { flex: 1 },
  safe:           { flex: 1 },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 },
  backBtn:        { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backText:       { color: "#fff", fontSize: 18 },
  title:          { color: "#fff", fontSize: 18, fontWeight: "700" },
  center:         { flex: 1, alignItems: "center", justifyContent: "center" },
  glow:           { position: "absolute", width: 240, height: 240, borderRadius: 120 },
  boxContainer:   { alignItems: "center", justifyContent: "center", marginBottom: 32 },
  boxEmoji:       { fontSize: 120 },
  countArea:      { alignItems: "center", marginTop: 40 },
  countText:      { fontSize: 120, fontWeight: "900", color: "#fff", textShadowColor: "#6366f1", textShadowRadius: 20 },
  tapHint:        { color: "#a0aec0", fontSize: 16, marginTop: 8 },
  rewardCard:     { width: W * 0.85, alignItems: "center" },
  rewardGradient: { width: "100%", borderRadius: 24, padding: 32, alignItems: "center" },
  tierBadge:      { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", opacity: 0.8, marginBottom: 12 },
  rewardEmoji:    { fontSize: 72, marginBottom: 16 },
  rewardName:     { color: "#fff", fontSize: 24, fontWeight: "800", textAlign: "center" },
  rewardDesc:     { color: "#e2e8f0", fontSize: 14, textAlign: "center", marginTop: 8, opacity: 0.9 },
  pityBadge:      { marginTop: 12, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, color: "#fff", fontSize: 12 },
  doneBtn:        { marginTop: 24, backgroundColor: "#6366f1", borderRadius: 16, paddingHorizontal: 48, paddingVertical: 16 },
  doneBtnText:    { color: "#fff", fontSize: 18, fontWeight: "700" },
  openBtn:        { marginTop: 32, backgroundColor: "#6366f1", borderRadius: 20, paddingHorizontal: 56, paddingVertical: 18 },
  openBtnDisabled:{ opacity: 0.5 },
  openBtnText:    { color: "#fff", fontSize: 20, fontWeight: "800" },
});
