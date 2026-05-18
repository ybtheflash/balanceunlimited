import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { Trophy, TrendingUp, Users, Info, XCircle } from "lucide-react-native";
import { db } from "../db/instant";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";
import { AdBanner } from "../components/AdBanner";
import { UserAvatar } from "../components/UserAvatar";
import { useState } from "react";

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const theme = user?.activeTheme || "dark";
  const isLight = theme === "light";
  const [showInfoModal, setShowInfoModal] = useState(false);

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
      <View className="flex-1 bg-transparent items-center justify-center">
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-transparent items-center justify-center">
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
    const bgClass = isTop3 ? (isLight ? "bg-white/80" : "bg-zinc-900/80") : "bg-transparent";
    const borderClass = index < leaderboardData.length - 1 ? (isLight ? "border-b border-zinc-200" : "border-b border-zinc-800/50") : "";

    return (
      <>
        <View className={`flex-row items-center px-5 py-4 ${bgClass} ${borderClass}`}>
          {/* Rank */}
          <View className="w-10 items-center">
            {medal ? (
              <Text className="text-lg">{medal}</Text>
            ) : (
              <Text className={`${isLight ? "text-zinc-500" : "text-zinc-600"} font-bold text-sm`}>#{index + 1}</Text>
            )}
          </View>

          {/* Avatar */}
          <View className="mr-3">
            <UserAvatar avatarKey={item.avatar || "default"} size={40} />
          </View>

          {/* Info */}
          <View className="flex-1">
            <Text className={`${isLight ? "text-zinc-900" : "text-white"} font-bold text-sm`} numberOfLines={1}>
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
              style={{ color: medalColor || (isLight ? "#52525b" : "#e4e4e7") }}
            >
              {formatCurrency(item.totalSpent)}
            </Text>
            <Text className={`${isLight ? "text-zinc-500" : "text-zinc-600"} text-xs mt-0.5`}>spent</Text>
          </View>
        </View>

        {/* Insert ad after rank 5 */}
        {showAds && index === 4 && <AdBanner size="banner" />}
      </>
    );
  };

  return (
    <View className={`flex-1 ${theme === "liquidGlass" ? "bg-transparent" : isLight ? "bg-zinc-50" : "bg-zinc-950"} items-center`}>
      <View className="w-full max-w-lg flex-1">
        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-11 h-11 bg-amber-500/15 rounded-xl items-center justify-center border border-amber-500/20">
                <Trophy color="#f59e0b" size={22} />
              </View>
              <View>
                <Text className={`${isLight ? "text-zinc-900" : "text-white"} text-xl font-bold tracking-tight`}>Leaderboard</Text>
                <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs mt-0.5`}>Top Spenders</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowInfoModal(true)} className={`w-10 h-10 ${isLight ? "bg-white" : "bg-zinc-900"} rounded-full items-center justify-center border ${isLight ? "border-zinc-200" : "border-zinc-800"}`}>
              <Info color="#3b82f6" size={20} />
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-2">
            <View className={`flex-1 ${isLight ? "bg-white" : "bg-zinc-900"} rounded-2xl p-4 border ${isLight ? "border-zinc-200" : "border-zinc-800/80"}`}>
              <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs font-medium uppercase tracking-wider`}>Total Spent</Text>
              <Text className={`${isLight ? "text-zinc-900" : "text-white"} text-xl font-bold mt-1`}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View className={`flex-1 ${isLight ? "bg-white" : "bg-zinc-900"} rounded-2xl p-4 border ${isLight ? "border-zinc-200" : "border-zinc-800/80"}`}>
              <View className="flex-row items-center gap-1.5">
                <Users color="#a855f7" size={14} />
                <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs font-medium uppercase tracking-wider`}>All Users</Text>
              </View>
              <Text className={`${isLight ? "text-zinc-900" : "text-white"} text-xl font-bold mt-1`}>{totalUsersCount}</Text>
            </View>
          </View>

          {/* Second stats row */}
          <View className="flex-row gap-3 mb-2">
            <View className={`flex-1 ${isLight ? "bg-white" : "bg-zinc-900"} rounded-2xl p-4 border ${isLight ? "border-zinc-200" : "border-zinc-800/80"}`}>
              <View className="flex-row items-center gap-1.5">
                <TrendingUp color="#10b981" size={14} />
                <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs font-medium uppercase tracking-wider`}>Active Spenders</Text>
              </View>
              <Text className="text-emerald-400 text-xl font-bold mt-1">{spenderCount}</Text>
            </View>
            <View className={`flex-1 ${isLight ? "bg-white" : "bg-zinc-900"} rounded-2xl p-4 border ${isLight ? "border-zinc-200" : "border-zinc-800/80"}`}>
              <View className="flex-row items-center gap-1.5">
                <Trophy color="#f59e0b" size={14} />
                <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs font-medium uppercase tracking-wider`}>On Board</Text>
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
              <Text className={`${isLight ? "text-zinc-500" : "text-zinc-600"} font-bold text-base mt-4`}>No spenders yet</Text>
              <Text className={`${isLight ? "text-zinc-400" : "text-zinc-700"} text-xs mt-1 text-center`}>
                Be the first to use KC and climb the leaderboard!
              </Text>
            </View>
          }
        />
      </View>

      <Modal visible={showInfoModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <TouchableOpacity className="absolute inset-0 bg-black/60" activeOpacity={1} onPress={() => setShowInfoModal(false)} />
          <View className={`${isLight ? "bg-white" : "bg-zinc-950"} rounded-t-3xl border-t ${isLight ? "border-zinc-200" : "border-zinc-800"} p-6 h-[80%]`}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`${isLight ? "text-zinc-900" : "text-white"} font-bold text-2xl`}>Ranking & Tiers</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)} className={`p-2 rounded-full ${isLight ? "bg-zinc-100" : "bg-zinc-900"}`}>
                <XCircle color={isLight ? "#52525b" : "#a1a1aa"} size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View className="mb-6">
                <Text className={`${isLight ? "text-zinc-500" : "text-zinc-400"} font-bold uppercase tracking-wider mb-3 ml-1`}>The Ladder</Text>
                <View className={`${isLight ? "bg-zinc-50" : "bg-zinc-900"} rounded-2xl p-4 border ${isLight ? "border-zinc-200" : "border-zinc-800"}`}>
                  <View className="flex-row items-center justify-between mb-3 border-b border-zinc-800/50 pb-3">
                    <Text className="text-xl">🥇</Text>
                    <Text className="text-amber-400 font-bold flex-1 ml-3 text-lg">Rank 1</Text>
                    <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs`}>Top Spender</Text>
                  </View>
                  <View className="flex-row items-center justify-between mb-3 border-b border-zinc-800/50 pb-3">
                    <Text className="text-xl">🥈</Text>
                    <Text className="text-zinc-400 font-bold flex-1 ml-3 text-lg">Rank 2</Text>
                    <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs`}>Runner Up</Text>
                  </View>
                  <View className="flex-row items-center justify-between mb-3 border-b border-zinc-800/50 pb-3">
                    <Text className="text-xl">🥉</Text>
                    <Text className="text-amber-700 font-bold flex-1 ml-3 text-lg">Rank 3</Text>
                    <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs`}>Third Place</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className={`${isLight ? "text-zinc-500" : "text-zinc-600"} font-bold w-6 text-center text-sm`}>4+</Text>
                    <Text className={`${isLight ? "text-zinc-500" : "text-zinc-400"} font-bold flex-1 ml-3 text-base`}>Others</Text>
                    <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs`}>Contenders</Text>
                  </View>
                </View>
              </View>

              <View>
                <Text className={`${isLight ? "text-zinc-500" : "text-zinc-400"} font-bold uppercase tracking-wider mb-3 ml-1`}>Spending Tiers</Text>
                <View className={`${isLight ? "bg-zinc-50" : "bg-zinc-900"} rounded-2xl p-4 border ${isLight ? "border-zinc-200" : "border-zinc-800"} gap-3`}>
                  <TierRow name="Giga-rich" color="#ec4899" threshold="500,000 KC" desc="The ultimate elite" />
                  <TierRow name="Whale" color="#3b82f6" threshold="100,000 KC" desc="Making massive waves" />
                  <TierRow name="Count de Monet" color="#a855f7" threshold="50,000 KC" desc="Certified royalty" />
                  <TierRow name="Trust-Funder" color="#10b981" threshold="10,000 KC" desc="Comfortably wealthy" />
                  <TierRow name="YaBasic" color="#71717a" threshold="0 KC" desc="Welcome to the club" />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TierRow({ name, color, threshold, desc }: { name: string, color: string, threshold: string, desc: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-zinc-800/30 pb-3 mb-1">
      <View>
        <Text className="font-bold text-base" style={{ color }}>{name}</Text>
        <Text className="text-zinc-500 text-xs mt-0.5">{desc}</Text>
      </View>
      <View className="items-end bg-zinc-800/40 px-3 py-1.5 rounded-lg border border-zinc-700/50">
        <Text className="text-emerald-400 font-bold text-xs">{threshold}</Text>
      </View>
    </View>
  );
}
