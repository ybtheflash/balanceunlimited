import { useState, useRef } from "react";
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
  Modal,
} from "react-native";
import {
  User,
  Crown,
  LogOut,
  LogIn,
  Wallet,
  Calculator,
  ChevronRight,
  Zap,
  Edit2,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  ShieldCheck,
  ShieldOff,
  Mail,
  Palette,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { formatCurrency } from "../utils/currency";
import { db } from "../db/instant";
import { AdBanner } from "../components/AdBanner";
import { UserAvatar, AVATAR_KEYS } from "../components/UserAvatar";
import PaymentModal from "../components/PaymentModal";

const USERNAME_CHANGE_COST = 500;
const AD_REMOVAL_COST = 500;

interface ProfileScreenProps {
  onNavigateToStore?: () => void;
  onNavigateToZestyAuth?: () => void;
}

export default function ProfileScreen({ onNavigateToStore, onNavigateToZestyAuth }: ProfileScreenProps) {
  const { user, isGuest, isLoggedIn, logout, promptLogin } = useAuth();
  const theme = user?.activeTheme || "dark";
  const isLight = theme === "light";
  
  const { balance, totalSpent, transactions, spend, canAfford } = useWallet();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [isUsernameChecking, setIsUsernameChecking] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safe Payment Modal State
  const [pmVisible, setPmVisible] = useState(false);
  const [pmTitle, setPmTitle] = useState("");
  const [pmAmount, setPmAmount] = useState(0);
  const [pmAmountStr, setPmAmountStr] = useState("");
  const pmOnPayRef = useRef<(() => void) | null>(null);

  // Theme Picker
  const [showThemePicker, setShowThemePicker] = useState(false);

  const handleThemeSelect = (selectedTheme: "light" | "dark" | "liquidGlass") => {
    if (!user) return;
    if (selectedTheme === user.activeTheme) {
      setShowThemePicker(false);
      return;
    }

    if (selectedTheme === "liquidGlass" && !user.liquidGlassUnlocked) {
      // Must purchase
      if (!canAfford(500)) {
        Alert.alert(
          "💰 Insufficient Balance",
          `Unlocking Liquid Glass costs 💰 500 KC.\n\nYour balance: ${formatCurrency(balance)}\n\nPlease top up your wallet first.`,
          [
            { text: "Cancel", style: "cancel" },
            ...(onNavigateToStore ? [{ text: "🏪 Go to Store", onPress: onNavigateToStore }] : []),
          ]
        );
        return;
      }
      
      setShowThemePicker(false); // Close theme picker before showing payment modal

      setPmTitle("Unlock Liquid Glass");
      setPmAmount(500);
      setPmAmountStr("💰 500 KC");
      pmOnPayRef.current = () => {
        const success = spend(500, "Theme: Liquid Glass Unlock");
        if (success) {
          db.transact(
            db.tx.profiles[user.id].update({
              liquidGlassUnlocked: true,
              activeTheme: "liquidGlass"
            })
          );
          setPmVisible(false);
          Alert.alert("Theme Unlocked! 🎉", "Liquid Glass is now active!");
        }
      };
      setPmVisible(true);
      return;
    }

    // Free themes — apply immediately
    setShowThemePicker(false);
    db.transact(db.tx.profiles[user.id].update({ activeTheme: selectedTheme }));
  };

  // ─── Username availability checker ──────────────────────────────────
  const checkUsernameAvailability = async (name: string) => {
    if (!name || name.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }
    setIsUsernameChecking(true);
    try {
      const res = await db.queryOnce({ profiles: { $: { where: { username: name } } } });
      const taken = res.data.profiles.filter((p: any) => p.id !== user?.id);
      setIsUsernameAvailable(taken.length === 0);
    } catch {
      setIsUsernameAvailable(null);
    } finally {
      setIsUsernameChecking(false);
    }
  };

  const handleUsernameInputChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setEditUsername(cleaned);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      checkUsernameAvailability(cleaned);
    }, 500);
  };

  // ─── Username change (CHARGED 500 KC) ───────────────────────────────
  const handleUsernameSave = () => {
    const trimmed = editUsername.trim();
    if (trimmed.length < 3) {
      Alert.alert("Invalid Username", "Username must be at least 3 characters.");
      return;
    }
    if (isUsernameAvailable === false) {
      Alert.alert("Username Taken", "This username is already in use.");
      return;
    }
    if (!user) return;

    if (trimmed === user.username) {
      setIsEditingUsername(false);
      return;
    }

    if (!canAfford(USERNAME_CHANGE_COST)) {
      Alert.alert(
        "💰 Insufficient Balance",
        `Changing your username costs ${formatCurrency(USERNAME_CHANGE_COST)}.\n\nYour balance: ${formatCurrency(balance)}\n\nPlease top up your wallet first.`,
        [
          { text: "Cancel", style: "cancel" },
          ...(onNavigateToStore ? [{ text: "🏪 Go to Store", onPress: onNavigateToStore }] : []),
        ]
      );
      return;
    }

    setPmTitle(`Change Username to @${trimmed}`);
    setPmAmount(USERNAME_CHANGE_COST);
    setPmAmountStr(`💰 ${USERNAME_CHANGE_COST} KC`);
    pmOnPayRef.current = () => {
      const success = spend(USERNAME_CHANGE_COST, `Username Change → @${trimmed}`);
      if (success) {
        db.transact(db.tx.profiles[user.id].update({ username: trimmed }));
        setIsEditingUsername(false);
        setPmVisible(false);
        Alert.alert("Success ✓", `Your username is now @${trimmed}.`);
      }
    };
    setPmVisible(true);
  };

  // ─── Display name change (FREE) ─────────────────────────────────────
  const handleDisplayNameSave = () => {
    const trimmed = editDisplayName.trim();
    if (trimmed.length < 2) {
      Alert.alert("Invalid Name", "Display name must be at least 2 characters.");
      return;
    }
    if (!user) return;
    db.transact(db.tx.profiles[user.id].update({ displayName: trimmed }));
    setIsEditingDisplayName(false);
    Alert.alert("Updated ✓", `Display name changed to "${trimmed}".`);
  };

  // ─── Avatar change ──────────────────────────────────────────────────
  const handleAvatarChange = (key: string) => {
    if (!user) return;
    db.transact(db.tx.profiles[user.id].update({ avatar: key }));
    setShowAvatarPicker(false);
  };

  // ─── Ad removal (500 KC) ────────────────────────────────────────────
  const handleRemoveAds = () => {
    if (!user) return;
    if (user.adsRemoved) {
      Alert.alert("Already Active", "You've already removed ads from your account.");
      return;
    }
    if (!canAfford(AD_REMOVAL_COST)) {
      Alert.alert(
        "💰 Insufficient Balance",
        `Removing ads costs ${formatCurrency(AD_REMOVAL_COST)}.\n\nYour balance: ${formatCurrency(balance)}\n\nPlease top up your wallet first.`,
        [
          { text: "Cancel", style: "cancel" },
          ...(onNavigateToStore ? [{ text: "🏪 Go to Store", onPress: onNavigateToStore }] : []),
        ]
      );
      return;
    }
    
    setPmTitle("Remove Ads Permanently");
    setPmAmount(AD_REMOVAL_COST);
    setPmAmountStr(`💰 ${AD_REMOVAL_COST} KC`);
    pmOnPayRef.current = () => {
      const success = spend(AD_REMOVAL_COST, "Ad Removal — Permanent");
      if (success) {
        db.transact(db.tx.profiles[user.id].update({ adsRemoved: true }));
        setPmVisible(false);
        Alert.alert("Ads Removed! 🎉", "You will no longer see ad banners.");
      }
    };
    setPmVisible(true);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <KeyboardAvoidingView
      className={`flex-1 ${theme === "liquidGlass" ? "bg-transparent" : isLight ? "bg-zinc-50" : "bg-zinc-950"} items-center`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="w-full max-w-lg flex-1">
        <ScrollView className="flex-1 w-full" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-14 pb-4">
            {/* Profile Header */}
            <View className="items-center mb-8">
              {/* Avatar */}
              <TouchableOpacity onPress={() => isLoggedIn && setShowAvatarPicker(!showAvatarPicker)} activeOpacity={0.8}>
                {isGuest ? (
                  <View className={`w-24 h-24 ${isLight ? "bg-white" : "bg-zinc-900"} rounded-3xl items-center justify-center border-2 ${isLight ? "border-zinc-200" : "border-zinc-800"}`}>
                    <User color="#52525b" size={40} />
                  </View>
                ) : (
                  <View>
                    <UserAvatar avatarKey={user?.avatar || "default"} size={96} />
                    {/* 2FA Verified Badge */}
                    {user?.totpEnabled && (
                      <View
                        className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full items-center justify-center border-2 border-zinc-950"
                      >
                        <ShieldCheck color="#fff" size={14} />
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>

              {/* Avatar Picker */}
              {showAvatarPicker && isLoggedIn && (
                <View className={`flex-row flex-wrap justify-center gap-3 mt-4 ${isLight ? "bg-white" : "bg-zinc-900"} p-4 rounded-2xl border ${isLight ? "border-zinc-200" : "border-zinc-800"}`}>
                  {AVATAR_KEYS.map((key) => {
                    const isActive = key === (user?.avatar || "default");
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => handleAvatarChange(key)}
                        activeOpacity={0.7}
                      >
                        <View style={{ opacity: isActive ? 1 : 0.5 }}>
                          <UserAvatar avatarKey={key} size={48} />
                        </View>
                        {isActive && (
                          <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full items-center justify-center">
                            <CheckCircle2 color="#fff" size={12} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Display Name + Username */}
              {isLoggedIn && !isGuest && (
                <View className="items-center mt-3 w-full">
                  {/* Display Name (FREE) */}
                  {isEditingDisplayName ? (
                    <View className="items-center w-full">
                      <TextInput
                        className={`${isLight ? "bg-white text-zinc-900 border-zinc-200" : "bg-zinc-900 text-white border-zinc-700"} px-4 py-2 rounded-xl border min-w-[200px] text-center`}
                        value={editDisplayName}
                        onChangeText={setEditDisplayName}
                        autoFocus
                        maxLength={25}
                        placeholder="New display name"
                        placeholderTextColor="#52525b"
                      />
                      <View className="flex-row gap-2 mt-2">
                        <TouchableOpacity onPress={() => setIsEditingDisplayName(false)} className={`px-4 py-2 ${isLight ? "bg-zinc-200" : "bg-zinc-800"} rounded-xl`}>
                          <Text className={`${isLight ? "text-zinc-700" : "text-zinc-400"} font-semibold text-xs`}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDisplayNameSave} className="px-4 py-2 bg-emerald-600 rounded-xl">
                          <Text className="text-white font-semibold text-xs">Save (Free)</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Text className={`${isLight ? "text-zinc-900" : "text-white"} text-xl font-bold tracking-tight`}>
                        {user?.displayName || user?.username}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setEditDisplayName(user?.displayName || "");
                          setIsEditingDisplayName(true);
                        }}
                        className="p-1"
                      >
                        <Edit2 color="#52525b" size={14} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Username (CHARGED) */}
                  {isEditingUsername ? (
                    <View className="items-center w-full mt-3">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-zinc-500 text-sm">@</Text>
                        <TextInput
                          className={`${isLight ? "bg-white text-zinc-900 border-zinc-200" : "bg-zinc-900 text-white border-zinc-700"} px-4 py-2 rounded-xl border min-w-[160px]`}
                          value={editUsername}
                          onChangeText={handleUsernameInputChange}
                          autoFocus
                          maxLength={20}
                          placeholder="new_username"
                          placeholderTextColor="#52525b"
                          autoCapitalize="none"
                        />
                        {editUsername.length >= 3 && (
                          isUsernameChecking ? (
                            <ActivityIndicator size="small" color="#3b82f6" />
                          ) : isUsernameAvailable ? (
                            <CheckCircle2 color="#10b981" size={20} />
                          ) : (
                            <XCircle color="#ef4444" size={20} />
                          )
                        )}
                      </View>
                      {editUsername.length >= 3 && isUsernameAvailable === false && !isUsernameChecking && (
                        <Text className="text-red-400 text-xs mt-1 font-medium">Username is already taken</Text>
                      )}
                      <View className="flex-row gap-2 mt-2">
                        <TouchableOpacity onPress={() => setIsEditingUsername(false)} className={`px-4 py-2 ${isLight ? "bg-zinc-200" : "bg-zinc-800"} rounded-xl`}>
                          <Text className={`${isLight ? "text-zinc-700" : "text-zinc-400"} font-semibold text-xs`}>Cancel</Text>
                        </TouchableOpacity>
                        {!canAfford(USERNAME_CHANGE_COST) ? (
                          <TouchableOpacity
                            onPress={onNavigateToStore}
                            className="px-4 py-2 bg-amber-600/20 border border-amber-500/50 rounded-xl flex-row items-center gap-1.5"
                          >
                            <Text className="text-amber-500 font-semibold text-xs">Low Balance! Top up →</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={handleUsernameSave}
                            className="px-4 py-2 bg-blue-600 rounded-xl flex-row items-center gap-1.5"
                          >
                            <Text className="text-white font-semibold text-xs">💰 {USERNAME_CHANGE_COST} KC</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text className={`${isLight ? "text-zinc-500" : "text-zinc-600"} text-[10px] mt-1 italic`}>
                        Username change costs 💰 {USERNAME_CHANGE_COST} KC • Non-refundable
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="flex-row items-center gap-1 mt-1"
                      onPress={() => {
                        setEditUsername(user?.username || "");
                        setIsUsernameAvailable(null);
                        setIsEditingUsername(true);
                      }}
                    >
                      <Text className={`${isLight ? "text-zinc-500" : "text-zinc-400"} text-xs`}>@{user?.username}</Text>
                      <Edit2 color="#52525b" size={10} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Guest */}
              {isGuest && (
                <View className="items-center mt-3">
                  <Text className={`${isLight ? "text-zinc-900" : "text-white"} text-xl font-bold tracking-tight`}>Guest User</Text>
                  <TouchableOpacity
                    onPress={promptLogin}
                    className="mt-3 flex-row items-center gap-2 bg-blue-600/20 px-5 py-2.5 rounded-xl border border-blue-500/30"
                  >
                    <LogIn color="#3b82f6" size={16} />
                    <Text className="text-blue-400 font-bold text-sm">Sign In / Register</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View className="flex-row items-center gap-1.5 mt-3 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                <Crown color="#f59e0b" size={13} />
                <Text className="text-amber-500 text-xs font-bold uppercase tracking-wider">
                  {isGuest ? "Guest" : user?.tier || "YaBasic"}
                </Text>
              </View>
            </View>

            {/* Stats */}
            {isLoggedIn && (
              <View className="flex-row gap-3 mb-8">
                <View className={`flex-1 ${isLight ? "bg-white" : "bg-zinc-900"} rounded-2xl p-4 items-center border ${isLight ? "border-zinc-200" : "border-zinc-800/80"}`}>
                  <Wallet color="#10b981" size={20} />
                  <Text className={`${isLight ? "text-zinc-900" : "text-white"} font-bold text-lg mt-2`}>{formatCurrency(balance)}</Text>
                  <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs mt-0.5`}>Balance</Text>
                </View>
                <View className={`flex-1 ${isLight ? "bg-white" : "bg-zinc-900"} rounded-2xl p-4 items-center border ${isLight ? "border-zinc-200" : "border-zinc-800/80"}`}>
                  <Zap color="#3b82f6" size={20} />
                  <Text className={`${isLight ? "text-zinc-900" : "text-white"} font-bold text-lg mt-2`}>{formatCurrency(totalSpent)}</Text>
                  <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs mt-0.5`}>Total Spent</Text>
                </View>
                <View className={`flex-1 ${isLight ? "bg-white" : "bg-zinc-900"} rounded-2xl p-4 items-center border ${isLight ? "border-zinc-200" : "border-zinc-800/80"}`}>
                  <Calculator color="#a855f7" size={20} />
                  <Text className={`${isLight ? "text-zinc-900" : "text-white"} font-bold text-lg mt-2`}>{transactions.length}</Text>
                  <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} text-xs mt-0.5`}>Txns</Text>
                </View>
              </View>
            )}

            {/* Ad Banner */}
            {isLoggedIn && !user?.adsRemoved && <AdBanner size="banner" />}

            {/* Settings */}
            <Text className={`${isLight ? "text-zinc-500" : "text-zinc-500"} font-semibold uppercase tracking-wider text-xs mb-3`}>
              Settings
            </Text>

            <View className={`${isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800/80"} rounded-2xl border overflow-hidden`}>
              {isLoggedIn ? (
                <>
                  {/* ZestyAuth 2FA */}
                  <MenuRow
                    isLight={isLight}
                    icon={
                      user?.totpEnabled
                        ? <ShieldCheck color="#3b82f6" size={18} />
                        : <ShieldOff color="#52525b" size={18} />
                    }
                    label="ZestyAuth 2FA"
                    subtitle={user?.totpEnabled ? "Active 🛡️ — Tap to manage" : "Not enabled — Tap to setup"}
                    badge={user?.totpEnabled ? "verified" : undefined}
                    onPress={() => onNavigateToZestyAuth && onNavigateToZestyAuth()}
                  />
                  {/* App Theme */}
                  <MenuRow
                    isLight={isLight}
                    icon={<Palette color="#a855f7" size={18} />}
                    label="App Theme"
                    subtitle={
                      theme === "liquidGlass" ? "Liquid Glass" : 
                      theme === "light" ? "Light Mode" : "Dark Mode"
                    }
                    onPress={() => setShowThemePicker(true)}
                  />
                  <MenuRow
                    isLight={isLight}
                    icon={<Edit2 color="#3b82f6" size={18} />}
                    label="Change Username"
                    subtitle={`💰 ${USERNAME_CHANGE_COST} KC per change`}
                    onPress={() => {
                      setEditUsername(user?.username || "");
                      setIsUsernameAvailable(null);
                      setIsEditingUsername(true);
                    }}
                  />
                  <MenuRow
                    isLight={isLight}
                    icon={<Edit2 color="#10b981" size={18} />}
                    label="Change Display Name"
                    subtitle="Free"
                    onPress={() => {
                      setEditDisplayName(user?.displayName || "");
                      setIsEditingDisplayName(true);
                    }}
                  />
                  <MenuRow
                    isLight={isLight}
                    icon={user?.adsRemoved ? <Eye color="#10b981" size={18} /> : <Ban color="#f59e0b" size={18} />}
                    label={user?.adsRemoved ? "Ads Removed ✓" : "Remove Ads"}
                    subtitle={user?.adsRemoved ? "Ad-free experience" : `💰 ${AD_REMOVAL_COST} KC — One-time`}
                    onPress={handleRemoveAds}
                  />
                </>
              ) : (
                <MenuRow isLight={isLight} icon={<LogIn color="#3b82f6" size={18} />} label="Sign In to unlock features" onPress={promptLogin} />
              )}
            </View>

            {/* App Unique ID */}
            {isLoggedIn && (
              <View className={`mt-4 ${isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800/30"} px-4 py-3 rounded-xl border`}>
                <Text className={`${isLight ? "text-zinc-500" : "text-zinc-700"} text-[10px] uppercase tracking-widest font-medium mb-1`}>
                  App ID
                </Text>
                <Text className={`${isLight ? "text-zinc-600" : "text-zinc-600"} text-xs font-mono tracking-wider`}>
                  {user?.appUniqueId || "----------"}
                </Text>
              </View>
            )}

            {/* In-app transactions notice */}
            {isLoggedIn && (
              <View className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 mt-4">
                <Text className="text-emerald-500/70 text-[10px] text-center font-semibold uppercase tracking-wider">
                  ✦ All in-app transactions use KC ✦
                </Text>
              </View>
            )}

            {/* Support */}
            <View className="items-center mt-6">
              <View className="flex-row items-center gap-1.5">
                <Mail color="#52525b" size={12} />
                <Text className={`${isLight ? "text-zinc-500" : "text-zinc-600"} text-xs`}>Need help?</Text>
              </View>
              <Text className="text-blue-400/80 text-xs font-medium mt-1" selectable>
                support@zestyahh.com
              </Text>
            </View>

            {/* Logout */}
            {isLoggedIn && (
              <TouchableOpacity
                className="flex-row items-center justify-center gap-2 mt-6 bg-red-500/10 py-4 rounded-2xl border border-red-500/20"
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <LogOut color="#ef4444" size={18} />
                <Text className="text-red-400 font-bold text-sm">Logout</Text>
              </TouchableOpacity>
            )}

            {/* App Info */}
            <View className="items-center mt-8">
              <Text className={`${isLight ? "text-zinc-500" : "text-zinc-700"} text-xs`}>Balance Unlimited v1.0.0</Text>
              <Text className={`${isLight ? "text-zinc-400" : "text-zinc-800"} text-xs mt-1`}>{user?.tier || "YaBasic"}™ Tier</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Payment Modal for KC transactions — always mounted */}
      <PaymentModal
        visible={pmVisible}
        title={pmTitle}
        amount={pmAmount}
        amountString={pmAmountStr}
        onPay={() => { if (pmOnPayRef.current) pmOnPayRef.current(); }}
        onCancel={() => setPmVisible(false)}
        cancelText="Cancel"
      />

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-4">
          <View className={`${isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"} w-full max-w-sm rounded-3xl border overflow-hidden`}>
            <View className={`p-5 border-b ${isLight ? "border-zinc-200" : "border-zinc-800"} flex-row justify-between items-center`}>
              <Text className={`${isLight ? "text-zinc-900" : "text-white"} font-bold text-lg`}>App Theme</Text>
              <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                <XCircle color="#52525b" size={24} />
              </TouchableOpacity>
            </View>

            <View className="p-2">
              <ThemeOption
                isLight={isLight}
                title="Light Mode"
                subtitle="Free"
                icon={<Palette color="#f59e0b" size={20} />}
                isActive={theme === "light"}
                onPress={() => handleThemeSelect("light")}
              />
              <ThemeOption
                isLight={isLight}
                title="Dark Mode"
                subtitle="Free"
                icon={<Palette color="#3b82f6" size={20} />}
                isActive={theme === "dark"}
                onPress={() => handleThemeSelect("dark")}
              />
              <ThemeOption
                isLight={isLight}
                title="Liquid Glass"
                subtitle={user?.liquidGlassUnlocked ? "Unlocked ✓" : "💰 500 KC"}
                icon={<Zap color="#a855f7" size={20} />}
                isActive={theme === "liquidGlass"}
                onPress={() => handleThemeSelect("liquidGlass")}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function ThemeOption({ isLight, title, subtitle, icon, isActive, onPress }: any) {
  return (
    <TouchableOpacity
      className={`flex-row justify-between items-center p-4 rounded-2xl ${isActive ? (isLight ? "bg-zinc-100" : "bg-zinc-800") : ""}`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 bg-zinc-800/50 rounded-full items-center justify-center">
          {icon}
        </View>
        <View>
          <Text className={`${isLight ? "text-zinc-900" : "text-white"} font-bold text-base`}>{title}</Text>
          <Text className={`${isActive ? "text-emerald-400 font-medium" : "text-zinc-500"} text-xs mt-0.5`}>{subtitle}</Text>
        </View>
      </View>
      {isActive && <CheckCircle2 color="#10b981" size={20} />}
    </TouchableOpacity>
  );
}

function MenuRow({
  isLight,
  icon,
  label,
  subtitle,
  badge,
  onPress
}: {
  isLight: boolean;
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between p-4 border-b ${isLight ? "border-zinc-100" : "border-zinc-800/50"}`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className={`w-10 h-10 ${isLight ? "bg-zinc-100" : "bg-zinc-800/50"} rounded-xl items-center justify-center`}>
          {icon}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className={`${isLight ? "text-zinc-900" : "text-white"} font-bold text-base`}>{label}</Text>
            {badge === "verified" && (
              <View className="bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                <Text className="text-blue-400 text-[9px] font-bold uppercase tracking-wider">Verified</Text>
              </View>
            )}
          </View>
          {subtitle && (
            <Text className={`${isLight ? "text-zinc-500" : "text-zinc-400"} text-xs mt-0.5`}>{subtitle}</Text>
          )}
        </View>
      </View>
      <ChevronRight color="#52525b" size={20} />
    </TouchableOpacity>
  );
}
