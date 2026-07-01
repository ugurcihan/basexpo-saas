import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { Colors } from "@/constants/Colors";

type Props = {
  height?: number;
};

export default function GradientOverlay({ height = 100 }: Props) {
  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]} pointerEvents="none">
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.bg} stopOpacity="0" />
            <Stop offset="1" stopColor={Colors.bg} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={height} fill="url(#fade)" />
      </Svg>
    </View>
  );
}
