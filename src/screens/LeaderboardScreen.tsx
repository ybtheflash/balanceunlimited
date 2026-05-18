import React from "react";
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { Trophy, TrendingUp, Users } from "lucide-react-native";
import { db } from "../db/instant";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";
import { AdBanner } from "../components/AdBanner";

export default function LeaderboardScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  // Fetch all profiles + all transactions from Instant DB
  const { isLoading, data, error } = db.useQuery({ profiles: {}, transactions: {} });

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
    if (tier === "Giga-rich") return "#ec4899";
    if (tier === "Whale") return "#3b82f6";
    if (tier === "Count de Monet") return "#a855f7";
    if (tier === "Trust-Funder") return "#10b981";
    return "#71717a";
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <Text className="text-red-500">Failed to load leaderboard</Text>
      </View>
    );
  }

  const allProfiles = data?.profiles || [];
  const allTransactions = data?.transactions || [];

  // Total users = everyone who registered
  const totalUsersCount = allProfiles.length;

  // Spender users = users who have at least 1 transaction (topup or spend)
  const userIdsWithTransactions = new Set(
    allTransactions.map((t: any) => t.userId)
  );
  const spenderCount = userIdsWithTransactions.size;

  // Leaderboard: only users with totalSpent > 0, sorted descending
  const leaderboardData = allProfiles
    .filter((p: any) => p.totalSpent > 0)
    .sort((a: any, b: any) => b.totalSpent - a.totalSpent);
  const totalSpent = leaderboardData.reduce((sum: number, e: any) => sum + e.totalSpent, 0);

  const showAds = !user?.adsRemoved;

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const medal = getMedalEmoji(index);
    const medalColor = getMedalColor(index);
    const isTop3 = index < 3;

    return (
      <>
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
              {item.displayName || item.username}
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
                  {item.tier || "YaBasic"}
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

        {/* Insert ad after rank 5 */}
        {showAds && index === 4 && <AdBanner size="banner" />}
      </>
    );
  };

  return (
    <View className="flex-1 bg-zinc-950 items-center">
      <View className="w-full max-w-lg flex-1">
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

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-2">
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800/80">
              <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Total Spent</Text>
              <Text className="text-white text-xl font-bold mt-1">{formatCurrency(totalSpent)}</Text>
            </View>
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800/80">
              <View className="flex-row items-center gap-1.5">
                <Users color="#a855f7" size={14} />
                <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider">All Users</Text>
              </View>
              <Text className="text-white text-xl font-bold mt-1">{totalUsersCount}</Text>
            </View>
          </View>

          {/* Second stats row */}
          <View className="flex-row gap-3 mb-2">
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800/80">
              <View className="flex-row items-center gap-1.5">
                <TrendingUp color="#10b981" size={14} />
                <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Active Spenders</Text>
              </View>
              <Text className="text-emerald-400 text-xl font-bold mt-1">{spenderCount}</Text>
            </View>
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800/80">
              <View className="flex-row items-center gap-1.5">
                <Trophy color="#f59e0b" size={14} />
                <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider">On Board</Text>
              </View>
              <Text className="text-amber-400 text-xl font-bold mt-1">{leaderboardData.length}</Text>
            </View>
          </View>
        </View>

        {/* Ad at top of list */}
        {showAds && <AdBanner size="banner" />}

        {/* List */}
        <FlatList
          data={leaderboardData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          className="w-full"
          ListEmptyComponent={
            <View className="items-center py-20 px-5">
              <Trophy color="#3f3f46" size={40} />
              <Text className="text-zinc-600 font-bold text-base mt-4">No spenders yet</Text>
              <Text className="text-zinc-700 text-xs mt-1 text-center">
                Be the first to use KC and climb the leaderboard!
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
