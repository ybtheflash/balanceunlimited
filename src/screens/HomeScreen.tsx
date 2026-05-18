import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, useWindowDimensions } from "react-native";
import { Calculator, FileText, Lock, Zap, Wallet, ChevronRight, Crown } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { formatCurrency } from "../utils/currency";
import { AdBanner } from "../components/AdBanner";

interface Utility {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  costPerUse: number; // KC
  route: string;
}

const UTILITIES: Utility[] = [
  {
    id: "calculator",
    name: "Calculator",
    description: "Advanced calculations with history",
    icon: <Calculator color="#3b82f6" size={28} />,
    iconColor: "#3b82f6",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    costPerUse: 5,
    route: "Calculator",
  },
  {
    id: "notepad",
    name: "Smart Notepad",
    description: "AI-powered notes & formatting",
    icon: <FileText color="#10b981" size={28} />,
    iconColor: "#10b981",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    costPerUse: 10,
    route: "Notepad",
  },
];

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onOpenWallet: () => void;
}

export default function HomeScreen({ onNavigate, onOpenWallet }: HomeScreenProps) {
  const { user, isGuest, isLoggedIn, promptLogin } = useAuth();
  const { balance } = useWallet();
  const { width } = useWindowDimensions();
  const isWide = width > 700;

  const handleUtilityPress = (utility: Utility) => {
    if (isGuest || !isLoggedIn) {
      Alert.alert(
        "Login Required",
        "You need to sign in to use premium utilities.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: promptLogin }
        ]
      );
      return;
    }
    onNavigate(utility.route);
  };

  return (
    <View className="flex-1 bg-zinc-950 items-center">
      <View className="w-full max-w-lg flex-1">
        <ScrollView className="flex-1 w-full" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-14 pb-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 bg-blue-600/20 rounded-xl items-center justify-center border border-blue-500/30">
                  <Zap color="#3b82f6" size={22} fill="#3b82f6" />
                </View>
                <View>
                  <Text className="text-white text-xl font-bold tracking-tight">Balance Unlimited</Text>
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Crown color="#f59e0b" size={11} />
                    <Text className="text-amber-500 text-xs font-bold uppercase tracking-wider">{user?.tier || "YaBasic"}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* User Greeting */}
            <View className="mt-6 mb-6">
              <Text className="text-zinc-500 text-sm">
                {isGuest ? "Browsing as" : "Logged in as"}
              </Text>
              <Text className="text-white text-2xl font-bold mt-0.5">
                {isGuest ? "Guest 👋" : `${user?.username ?? "User"} 👋`}
              </Text>
            </View>

            {/* Wallet Card — only for logged in users */}
            {isLoggedIn && (
              <TouchableOpacity
                className="bg-zinc-900 rounded-3xl p-5 mb-8 border border-zinc-800/80"
                onPress={onOpenWallet}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 bg-emerald-500/15 rounded-2xl items-center justify-center border border-emerald-500/20">
                      <Wallet color="#10b981" size={22} />
                    </View>
                    <View>
                      <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Wallet Balance</Text>
                      <Text className="text-white text-2xl font-bold mt-0.5">
                        {formatCurrency(balance)}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-emerald-500/15 px-4 py-2 rounded-xl border border-emerald-500/20">
                    <Text className="text-emerald-400 font-bold text-sm">Top Up</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Guest Banner */}
            {isGuest && (
              <View className="bg-amber-500/10 rounded-2xl p-4 mb-8 border border-amber-500/20">
                <View className="flex-row items-center gap-2 mb-1">
                  <Lock color="#f59e0b" size={16} />
                  <Text className="text-amber-400 font-bold text-sm">Guest Mode</Text>
                </View>
                <Text className="text-amber-500/70 text-xs leading-5">
                  You can browse utilities but cannot use them. Sign in to unlock full access and start using paid features.
                </Text>
              </View>
            )}

            {/* Ad Banner */}
            {!user?.adsRemoved && <AdBanner size="banner" />}

            {/* Utilities */}
            <Text className="text-zinc-500 mb-4 font-semibold uppercase tracking-wider text-xs">
              Utilities
            </Text>

            <View className={isWide ? "flex-row flex-wrap gap-4" : "gap-4"}>
              {UTILITIES.map((utility) => (
                <TouchableOpacity
                  key={utility.id}
                  className={`bg-zinc-900 rounded-3xl p-5 border border-zinc-800/80 ${isWide ? "w-[48%]" : ""}`}
                  onPress={() => handleUtilityPress(utility)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View className={`w-14 h-14 ${utility.bgColor} rounded-2xl items-center justify-center border ${utility.borderColor}`}>
                      {utility.icon}
                    </View>
                    <View className="flex-row items-center gap-1 bg-zinc-800/80 px-3 py-1.5 rounded-full">
                      <Text className="text-sm">🪙</Text>
                      <Text className="text-emerald-400 text-xs font-bold">{utility.costPerUse}</Text>
                    </View>
                  </View>

                  <Text className="text-white font-bold text-lg tracking-tight">{utility.name}</Text>
                  <Text className="text-zinc-500 text-sm mt-1 leading-5">{utility.description}</Text>

                  <View className="flex-row items-center mt-4 justify-between">
                    {isGuest || !isLoggedIn ? (
                      <View className="flex-row items-center bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                        <Lock color="#ef4444" size={12} />
                        <Text className="text-red-400 text-xs ml-1.5 font-bold uppercase tracking-wider">Login Required</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                        <Text className="text-blue-400 text-xs font-bold uppercase tracking-wider">Open</Text>
                      </View>
                    )}
                    <ChevronRight color="#52525b" size={20} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
