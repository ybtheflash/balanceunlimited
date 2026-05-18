import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
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
  Edit2,
  Check,
  X,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { formatCurrency } from "../utils/currency";
import { db } from "../db/instant";
import { AdBanner } from "../components/AdBanner";

const DISPLAY_NAME_CHANGE_COST = 500;
const AD_REMOVAL_COST = 500;

export default function ProfileScreen() {
  const { user, isGuest, isLoggedIn, logout, promptLogin } = useAuth();
  const { balance, totalSpent, transactions, spend, canAfford } = useWallet();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isNameChecking, setIsNameChecking] = useState(false);
  const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkNameAvailability = async (name: string) => {
    if (!name || name.length < 3) {
      setIsNameAvailable(null);
      return;
    }
    setIsNameChecking(true);
    try {
      const res = await db.queryOnce({ profiles: { $: { where: { displayName: name } } } });
      // Allow if the only match is the current user
      const taken = res.data.profiles.filter((p: any) => p.id !== user?.id);
      setIsNameAvailable(taken.length === 0);
    } catch {
      setIsNameAvailable(null);
    } finally {
      setIsNameChecking(false);
    }
  };

  const handleNameInputChange = (text: string) => {
    setEditName(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      checkNameAvailability(text);
    }, 500);
  };

  const handleEditSave = () => {
    const trimmed = editName.trim();
    if (trimmed.length < 3) {
      Alert.alert("Invalid Name", "Display name must be at least 3 characters.");
      return;
    }
    if (isNameAvailable === false) {
      Alert.alert("Name Taken", "This display name is already in use.");
      return;
    }
    if (!user) return;

    // Same name? No charge
    if (trimmed === user.displayName) {
      setIsEditing(false);
      return;
    }

    if (!canAfford(DISPLAY_NAME_CHANGE_COST)) {
      Alert.alert(
        "Insufficient Balance",
        `Changing your display name costs ${formatCurrency(DISPLAY_NAME_CHANGE_COST)}.\n\nYour balance: ${formatCurrency(balance)}\n\nPlease top up your wallet first.`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Change Display Name",
      `This action costs ${formatCurrency(DISPLAY_NAME_CHANGE_COST)}.\n\n` +
        `Balance: ${formatCurrency(balance)} → ${formatCurrency(balance - DISPLAY_NAME_CHANGE_COST)}\n` +
        `Consumed: ${formatCurrency(DISPLAY_NAME_CHANGE_COST)}\n\n` +
        `⚠️ This charge is non-refundable.\n\nNew name: "${trimmed}"`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Pay ${formatCurrency(DISPLAY_NAME_CHANGE_COST)}`,
          onPress: () => {
            const success = spend(DISPLAY_NAME_CHANGE_COST, `Display Name Change → "${trimmed}"`);
            if (success) {
              db.transact(
                db.tx.profiles[user.id].update({ displayName: trimmed })
              );
              setIsEditing(false);
              Alert.alert("Success ✓", `Your display name is now "${trimmed}".`);
            }
          },
        },
      ]
    );
  };

  const handleRemoveAds = () => {
    if (!user) return;
    if (user.adsRemoved) {
      Alert.alert("Already Active", "You've already removed ads from your account.");
      return;
    }
    if (!canAfford(AD_REMOVAL_COST)) {
      Alert.alert(
        "Insufficient Balance",
        `Removing ads costs ${formatCurrency(AD_REMOVAL_COST)}.\n\nYour balance: ${formatCurrency(balance)}\n\nPlease top up your wallet first.`,
        [{ text: "OK" }]
      );
      return;
    }
    Alert.alert(
      "Remove Ads",
      `Remove all ad banners from your account.\n\n` +
        `Cost: ${formatCurrency(AD_REMOVAL_COST)}\n` +
        `Balance: ${formatCurrency(balance)} → ${formatCurrency(balance - AD_REMOVAL_COST)}\n\n` +
        `⚠️ This charge is non-refundable.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Pay ${formatCurrency(AD_REMOVAL_COST)}`,
          onPress: () => {
            const success = spend(AD_REMOVAL_COST, "Ad Removal — Permanent");
            if (success) {
              db.transact(
                db.tx.profiles[user.id].update({ adsRemoved: true })
              );
              Alert.alert("Ads Removed! 🎉", "You will no longer see ad banners.");
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-zinc-950 items-center"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="w-full max-w-lg flex-1">
        <ScrollView className="flex-1 w-full" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
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

              {isLoggedIn && !isGuest && (
                <View className="items-center mt-3">
                  {isEditing ? (
                    <View className="w-full items-center">
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          className="bg-zinc-900 text-white px-4 py-2 rounded-xl border border-zinc-700 min-w-[180px] text-center"
                          value={editName}
                          onChangeText={handleNameInputChange}
                          autoFocus
                          maxLength={20}
                        />
                        {editName.length >= 3 && (
                          isNameChecking ? (
                            <ActivityIndicator size="small" color="#3b82f6" />
                          ) : isNameAvailable ? (
                            <CheckCircle2 color="#10b981" size={20} />
                          ) : (
                            <XCircle color="#ef4444" size={20} />
                          )
                        )}
                      </View>
                      {editName.length >= 3 && isNameAvailable === false && !isNameChecking && (
                        <Text className="text-red-400 text-xs mt-1 font-medium">Name is already taken</Text>
                      )}
                      <View className="flex-row gap-2 mt-3">
                        <TouchableOpacity
                          onPress={() => setIsEditing(false)}
                          className="px-5 py-2 bg-zinc-800 rounded-xl"
                        >
                          <Text className="text-zinc-400 font-semibold text-sm">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleEditSave}
                          className="px-5 py-2 bg-blue-600 rounded-xl flex-row items-center gap-1.5"
                        >
                          <Wallet color="#fff" size={14} />
                          <Text className="text-white font-semibold text-sm">{formatCurrency(DISPLAY_NAME_CHANGE_COST)}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white text-xl font-bold tracking-tight">
                        {user?.displayName || user?.username}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setEditName(user?.displayName || user?.username || "");
                          setIsNameAvailable(null);
                          setIsEditing(true);
                        }}
                        className="p-1"
                      >
                        <Edit2 color="#52525b" size={14} />
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text className="text-zinc-500 text-xs mt-1">@{user?.username}</Text>
                  {isEditing && (
                    <Text className="text-zinc-600 text-[10px] mt-1 italic">
                      Changing name costs {formatCurrency(DISPLAY_NAME_CHANGE_COST)} • Non-refundable
                    </Text>
                  )}
                </View>
              )}

              {isGuest && (
                <View className="items-center mt-3">
                  <Text className="text-white text-xl font-bold tracking-tight">Guest User</Text>
                </View>
              )}

              <View className="flex-row items-center gap-1.5 mt-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                <Crown color="#f59e0b" size={13} />
                <Text className="text-amber-500 text-xs font-bold uppercase tracking-wider">
                  {isGuest ? "Guest" : user?.tier || "YaBasic"}
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

            {/* Ad Banner — only if ads not removed */}
            {isLoggedIn && !user?.adsRemoved && <AdBanner size="banner" />}

            {/* Menu Items */}
            <Text className="text-zinc-500 font-semibold uppercase tracking-wider text-xs mb-3">
              Settings
            </Text>

            <View className="bg-zinc-900 rounded-2xl border border-zinc-800/80 overflow-hidden">
              {isLoggedIn ? (
                <>
                  <MenuRow
                    icon={<Edit2 color="#3b82f6" size={18} />}
                    label="Change Display Name"
                    subtitle={`${formatCurrency(DISPLAY_NAME_CHANGE_COST)} per change`}
                    onPress={() => {
                      setEditName(user?.displayName || user?.username || "");
                      setIsNameAvailable(null);
                      setIsEditing(true);
                    }}
                  />
                  <MenuRow
                    icon={user?.adsRemoved ? <Eye color="#10b981" size={18} /> : <Ban color="#f59e0b" size={18} />}
                    label={user?.adsRemoved ? "Ads Removed ✓" : "Remove Ads"}
                    subtitle={user?.adsRemoved ? "Enjoy ad-free experience" : `${formatCurrency(AD_REMOVAL_COST)} — One-time`}
                    onPress={handleRemoveAds}
                  />
                  <MenuRow icon={<FileText color="#10b981" size={18} />} label="Usage History" />
                </>
              ) : (
                <MenuRow icon={<LogIn color="#3b82f6" size={18} />} label="Sign In to unlock features" onPress={promptLogin} />
              )}
            </View>

            {/* All in-app transactions info */}
            {isLoggedIn && (
              <View className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 mt-4">
                <Text className="text-emerald-500/70 text-[10px] text-center font-semibold uppercase tracking-wider">
                  ✦ All in-app transactions are FREE using KC ✦
                </Text>
              </View>
            )}

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
              <Text className="text-zinc-800 text-xs mt-1">{user?.tier || "YaBasic"}™ Tier</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4 border-b border-zinc-800/50"
      activeOpacity={0.7}
      onPress={onPress}
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
