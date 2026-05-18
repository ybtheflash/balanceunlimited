import React, { useEffect, useState } from "react";
import { View, Text, Dimensions } from "react-native";
import { Zap } from "lucide-react-native";

const { width } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinish, 300);
          return 100;
        }
        return prev + 4;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      {/* Brand */}
      <View className="items-center mb-16">
        <View className="w-24 h-24 bg-blue-600/20 rounded-3xl items-center justify-center mb-6 border border-blue-500/30">
          <Zap color="#3b82f6" size={48} fill="#3b82f6" />
        </View>
        <Text className="text-4xl font-bold text-white tracking-tight mb-1">Balance</Text>
        <Text className="text-blue-500 font-bold tracking-[0.35em] uppercase text-sm">Unlimited</Text>
      </View>

      {/* Progress Bar */}
      <View className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <View
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
      <Text className="text-zinc-600 text-xs mt-3 tracking-wider">LOADING</Text>

      {/* Bottom tag */}
      <View className="absolute bottom-12 items-center">
        <Text className="text-zinc-700 text-xs">Ya Basic™ Tier</Text>
      </View>
    </View>
  );
}
