import React, { useEffect, useState, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { Crown } from "lucide-react-native";
import { formatCurrency } from "../utils/currency";

interface FlexScoreWidgetProps {
  score: number;
}

export default function FlexScoreWidget({ score }: FlexScoreWidgetProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (score !== displayScore) {
      // Animate scale pump
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Tick up animation
      let start = displayScore;
      const end = score;
      const duration = 1000;
      const increment = (end - start) / (duration / 16); // 60fps

      const timer = setInterval(() => {
        start += increment;
        if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
          setDisplayScore(end);
          clearInterval(timer);
        } else {
          setDisplayScore(Math.round(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [score]);

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleValue }] }}
      className="flex-row items-center bg-zinc-900/80 px-4 py-2 rounded-full border border-amber-500/30 shadow-lg shadow-amber-500/20"
    >
      <Crown color="#f59e0b" size={16} />
      <Text className="text-amber-500 font-black text-lg tracking-widest ml-2">
        {formatCurrency(displayScore)}
      </Text>
    </Animated.View>
  );
}
