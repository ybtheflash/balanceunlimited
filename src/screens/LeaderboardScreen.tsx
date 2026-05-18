import React from "react";
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { Trophy, TrendingUp } from "lucide-react-native";
import { formatCurrency } from "../utils/currency";

const MOCK_LEADERBOARD = [
  { id: "1", username: "Whale King", avatar: "🐳", tier: "Whale", totalSpent: 25000 },
  { id: "2", username: "Dolphin", avatar: "🐬", tier: "Power User", totalSpent: 12000 },
  { id: "3", username: "Dev Admin", avatar: "👑", tier: "Whale", totalSpent: 5000 },
  { id: "4", username: "Basic Bro", avatar: "🧑‍💻", tier: "Ya Basic", totalSpent: 150 },
];

export default function LeaderboardScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 600;

  const getMedalColor = (index: number) => {
    if (index === 0) return "#fbbf24"; // Gold
    if (index === 1) return "#94a3b8"; // Silver
    if (index === 2) return "#d97706"; // Bronze
    return null;
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  const getTierColor = (tier: string) => {
    if (tier === "Whale") return "#3b82f6";
    if (tier === "Power User") return "#a855f7";
    return "#71717a";
  };

  const leaderboardData = MOCK_LEADERBOARD.sort((a, b) => b.totalSpent - a.totalSpent);
  const totalSpent = leaderboardData.reduce((sum, e) => sum + e.totalSpent, 0);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const medal = getMedalEmoji(index);
    const medalColor = getMedalColor(index);
    const isTop3 = index < 3;

    return (
      <View
        className={`flex-row items-center px-5 py-4 ${
          isTop3 ? "bg-zinc-900/80" : ""
        } ${index < leaderboardData.length - 1 ? "border-b border-zinc-800/50" : ""}`}
      >
        {/* Rank */}
        <View className="w-10 items-center">
          {medal ? (
            <Text className="text-lg">{medal}</Text>
          ) : (
            <Text className="text-zinc-600 font-bold text-sm">#{index + 1}</Text>
          )}
        </View>

        {/* Avatar */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{
            backgroundColor: medalColor ? `${medalColor}20` : "#27272a",
            borderWidth: medalColor ? 1 : 0,
            borderColor: medalColor ? `${medalColor}40` : "transparent",
          }}
        >
          <Text className="text-lg">{item.avatar || "🧑‍💻"}</Text>
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text className="text-white font-bold text-sm" numberOfLines={1}>
            {item.username}
          </Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <View
              className="px-2 py-0.5 rounded"
              style={{ backgroundColor: `${getTierColor(item.tier)}20` }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: getTierColor(item.tier) }}
              >
                {item.tier || "Ya Basic"}
              </Text>
            </View>
          </View>
        </View>

        {/* Amount */}
        <View className="items-end">
          <Text
            className="font-bold text-base"
            style={{ color: medalColor || "#e4e4e7" }}
          >
            {formatCurrency(item.totalSpent)}
          </Text>
          <Text className="text-zinc-600 text-xs mt-0.5">spent</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="px-5 pt-14 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 bg-amber-500/15 rounded-xl items-center justify-center border border-amber-500/20">
              <Trophy color="#f59e0b" size={22} />
            </View>
            <View>
              <Text className="text-white text-xl font-bold tracking-tight">Leaderboard</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Top Spenders</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className={`${isWide ? "flex-row" : "flex-row"} gap-3 mb-2`}>
          <View className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800/80">
            <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Total Spent</Text>
            <Text className="text-white text-xl font-bold mt-1">{formatCurrency(totalSpent)}</Text>
          </View>
          <View className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800/80">
            <View className="flex-row items-center gap-1.5">
              <TrendingUp color="#10b981" size={14} />
              <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Users</Text>
            </View>
            <Text className="text-white text-xl font-bold mt-1">{leaderboardData.length}</Text>
          </View>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={leaderboardData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
