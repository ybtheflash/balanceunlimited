import React from "react";
import { View, Text } from "react-native";

/**
 * Google AdMob-compliant banner placeholder.
 * Standard Banner: 320×50, Large Banner: 320×100
 * Non-intrusive, placed at natural content breaks.
 */
export function AdBanner({ size = "banner" }: { size?: "banner" | "large" }) {
  const height = size === "large" ? 100 : 50;

  return (
    <View
      className="w-full items-center my-4 px-5"
      style={{ maxWidth: 320, alignSelf: "center" }}
    >
      <View
        className="w-full bg-zinc-900/50 rounded-xl border border-zinc-800/40 items-center justify-center overflow-hidden"
        style={{ height }}
      >
        <Text className="text-zinc-700 text-[10px] font-medium uppercase tracking-widest">
          Ad Space
        </Text>
      </View>
    </View>
  );
}
