import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import {
  User,
  Crown,
  LogOut,
  LogIn,
  Wallet,
  Calculator,
  FileText,
  ChevronRight,
  Zap,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { formatCurrency } from "../utils/currency";

export default function ProfileScreen() {
  const { user, isGuest, isLoggedIn, logout } = useAuth();
  const { balance, totalSpent, transactions } = useWallet();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-zinc-950" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-5 pt-14 pb-4">
        {/* Profile Header */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-zinc-900 rounded-3xl items-center justify-center mb-4 border-2 border-zinc-800">
            {isGuest ? (
              <User color="#52525b" size={40} />
            ) : (
              <Text className="text-5xl">{user?.avatar ?? "🧑‍💻"}</Text>
            )}
          </View>

          <Text className="text-white text-2xl font-bold tracking-tight">
            {isGuest ? "Guest User" : user?.username ?? "User"}
          </Text>
          {isLoggedIn && (
            <Text className="text-zinc-500 text-sm mt-0.5">{user?.email}</Text>
          )}

          <View className="flex-row items-center gap-1.5 mt-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
            <Crown color="#f59e0b" size={13} />
            <Text className="text-amber-500 text-xs font-bold uppercase tracking-wider">
              {isGuest ? "Guest" : "Ya Basic"}
            </Text>
          </View>
        </View>

        {/* Stats — logged in only */}
        {isLoggedIn && (
          <View className="flex-row gap-3 mb-8">
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4 items-center border border-zinc-800/80">
              <Wallet color="#10b981" size={20} />
              <Text className="text-white font-bold text-lg mt-2">{formatCurrency(balance)}</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Balance</Text>
            </View>
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4 items-center border border-zinc-800/80">
              <Zap color="#3b82f6" size={20} />
              <Text className="text-white font-bold text-lg mt-2">{formatCurrency(totalSpent)}</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Total Spent</Text>
            </View>
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4 items-center border border-zinc-800/80">
              <Calculator color="#a855f7" size={20} />
              <Text className="text-white font-bold text-lg mt-2">{transactions.length}</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Uses</Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <Text className="text-zinc-500 font-semibold uppercase tracking-wider text-xs mb-3">
          Account
        </Text>

        <View className="bg-zinc-900 rounded-2xl border border-zinc-800/80 overflow-hidden">
          {isLoggedIn ? (
            <>
              <MenuRow icon={<User color="#3b82f6" size={18} />} label="Edit Profile" />
              <MenuRow icon={<Crown color="#f59e0b" size={18} />} label="Upgrade Tier" subtitle="Coming Soon" />
              <MenuRow icon={<FileText color="#10b981" size={18} />} label="Usage History" />
            </>
          ) : (
            <MenuRow icon={<LogIn color="#3b82f6" size={18} />} label="Sign In to unlock features" />
          )}
        </View>

        {/* Logout */}
        {isLoggedIn && (
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 mt-8 bg-red-500/10 py-4 rounded-2xl border border-red-500/20"
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut color="#ef4444" size={18} />
            <Text className="text-red-400 font-bold text-sm">Logout</Text>
          </TouchableOpacity>
        )}

        {/* App Info */}
        <View className="items-center mt-10">
          <Text className="text-zinc-700 text-xs">Balance Unlimited v1.0.0</Text>
          <Text className="text-zinc-800 text-xs mt-1">Ya Basic™ Tier</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function MenuRow({
  icon,
  label,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4 border-b border-zinc-800/50"
      activeOpacity={0.7}
    >
      <View className="w-9 h-9 bg-zinc-950 rounded-xl items-center justify-center mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-sm">{label}</Text>
        {subtitle && <Text className="text-zinc-600 text-xs mt-0.5">{subtitle}</Text>}
      </View>
      <ChevronRight color="#3f3f46" size={18} />
    </TouchableOpacity>
  );
}
