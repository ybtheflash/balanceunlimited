import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { ArrowLeft, ShieldCheck, ShieldOff, Key, Mail } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../db/instant";
import {
  generateTotpSecret,
  getTotpUri,
  verifyTotpToken,
  formatSecretForDisplay,
} from "../utils/zestyauth";

interface ZestyAuthScreenProps {
  onBack: () => void;
}

export default function ZestyAuthScreen({ onBack }: ZestyAuthScreenProps) {
  const { user } = useAuth();
  const is2FAEnabled = user?.totpEnabled || false;

  const [setupMode, setSetupMode] = useState(false);
  const [newSecret, setNewSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = () => {
    const secret = generateTotpSecret();
    setNewSecret(secret);
    setVerifyCode("");
    setSetupMode(true);
  };

  const handleVerifyAndEnable = () => {
    if (!verifyCode || verifyCode.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code from your authenticator app.");
      return;
    }

    const isValid = verifyTotpToken(verifyCode, newSecret);
    if (!isValid) {
      Alert.alert("Invalid Code", "The code you entered is incorrect. Make sure your authenticator app is set up correctly and try again.");
      return;
    }

    if (!user) return;
    setLoading(true);

    db.transact(
      db.tx.profiles[user.id].update({
        totpEnabled: true,
        totpSecret: newSecret,
      })
    );

    setTimeout(() => {
      setLoading(false);
      setSetupMode(false);
      Alert.alert(
        "ZestyAuth Enabled! 🛡️",
        "Two-factor authentication is now active on your account.\n\nFrom your next login, you'll need your authenticator app OR email OTP to verify."
      );
    }, 500);
  };

  const handleDisable2FA = () => {
    Alert.alert(
      "Disable ZestyAuth",
      "Are you sure you want to disable two-factor authentication?\n\nYour account will only be protected by email OTP.\n\nContact support@zestyahh.com if you need help.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable 2FA",
          style: "destructive",
          onPress: () => {
            if (!user) return;
            db.transact(
              db.tx.profiles[user.id].update({
                totpEnabled: false,
                totpSecret: "",
              })
            );
            Alert.alert("2FA Disabled", "Two-factor authentication has been removed from your account.");
          },
        },
      ]
    );
  };

  const handleReset2FA = () => {
    Alert.alert(
      "Reset ZestyAuth",
      "This will generate a new secret. You'll need to set up your authenticator app again.\n\nContact support@zestyahh.com if you need help.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset & Re-setup",
          onPress: () => {
            if (!user) return;
            db.transact(
              db.tx.profiles[user.id].update({
                totpEnabled: false,
                totpSecret: "",
              })
            );
            startSetup();
          },
        },
      ]
    );
  };

  const otpauthUri = newSecret && user ? getTotpUri(newSecret, user.email) : "";
  const formattedSecret = newSecret ? formatSecretForDisplay(newSecret) : "";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-zinc-950 items-center"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="w-full max-w-lg flex-1">
        <ScrollView className="flex-1 w-full" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-5 pt-14 pb-6">
            <View className="flex-row items-center gap-3 mb-6">
              <TouchableOpacity
                onPress={onBack}
                className="w-10 h-10 bg-zinc-900 rounded-xl items-center justify-center border border-zinc-800"
              >
                <ArrowLeft color="#a1a1aa" size={18} />
              </TouchableOpacity>
              <View className="flex-row items-center gap-2">
                <View className="w-10 h-10 bg-blue-500/10 rounded-xl items-center justify-center border border-blue-500/20">
                  <ShieldCheck color="#3b82f6" size={20} />
                </View>
                <View>
                  <Text className="text-white text-lg font-bold tracking-tight">ZestyAuth</Text>
                  <Text className="text-zinc-500 text-xs">Two-Factor Authentication</Text>
                </View>
              </View>
            </View>

            {/* Current Status */}
            <View className={`p-4 rounded-2xl border mb-6 ${is2FAEnabled ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
              <View className="flex-row items-center gap-3">
                {is2FAEnabled ? (
                  <ShieldCheck color="#10b981" size={24} />
                ) : (
                  <ShieldOff color="#f59e0b" size={24} />
                )}
                <View className="flex-1">
                  <Text className={`font-bold text-base ${is2FAEnabled ? "text-emerald-400" : "text-amber-400"}`}>
                    {is2FAEnabled ? "2FA Active 🛡️" : "2FA Not Enabled"}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">
                    {is2FAEnabled
                      ? "Your account is protected with authenticator app verification."
                      : "Enable 2FA to add an extra layer of security to your account."}
                  </Text>
                </View>
              </View>
            </View>

            {/* Setup Mode */}
            {setupMode ? (
              <View className="gap-5">
                <Text className="text-white text-lg font-bold">Setup ZestyAuth</Text>
                
                {/* Step 1: Open Authenticator */}
                <View className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                  <View className="flex-row items-center gap-2 mb-3">
                    <View className="w-7 h-7 bg-blue-600 rounded-lg items-center justify-center">
                      <Text className="text-white font-bold text-xs">1</Text>
                    </View>
                    <Text className="text-white font-semibold text-sm">Open Your Authenticator App</Text>
                  </View>
                  <Text className="text-zinc-400 text-xs leading-5">
                    Open Google Authenticator, Authy, Microsoft Authenticator, or any TOTP-compatible app on your phone.
                  </Text>
                </View>

                {/* Step 2: Manual Entry */}
                <View className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                  <View className="flex-row items-center gap-2 mb-3">
                    <View className="w-7 h-7 bg-blue-600 rounded-lg items-center justify-center">
                      <Text className="text-white font-bold text-xs">2</Text>
                    </View>
                    <Text className="text-white font-semibold text-sm">Add Account Manually</Text>
                  </View>
                  <Text className="text-zinc-400 text-xs leading-5 mb-3">
                    In your authenticator app, choose "Add account" → "Enter setup key manually" and enter the details below:
                  </Text>

                  <View className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 mb-2">
                    <Text className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold mb-1">Account Name</Text>
                    <Text className="text-white text-sm font-medium">Balance Unlimited ({user?.email})</Text>
                  </View>

                  <View className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <Text className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold mb-1">Secret Key</Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-emerald-400 text-sm font-mono font-bold tracking-wider flex-1" selectable>
                        {formattedSecret}
                      </Text>
                    </View>
                    <Text className="text-zinc-600 text-[10px] mt-2">⚠️ Save this key securely. You'll need it if you lose your phone.</Text>
                  </View>

                  {/* QR Code */}
                  <View className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mt-2 items-center">
                    <Text className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold mb-4">Scan QR Code</Text>
                    {otpauthUri ? (
                      <View className="p-2 bg-white rounded-xl">
                        <Image
                          source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}` }}
                          style={{ width: 150, height: 150 }}
                        />
                      </View>
                    ) : null}
                    <Text className="text-zinc-600 text-[10px] mt-4 text-center">Scan this with your authenticator app</Text>
                  </View>

                  <Text className="text-zinc-600 text-[10px] mt-2">
                    Type: Time-based (TOTP) • Digits: 6 • Period: 30s
                  </Text>
                </View>

                {/* Step 3: Verify */}
                <View className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                  <View className="flex-row items-center gap-2 mb-3">
                    <View className="w-7 h-7 bg-blue-600 rounded-lg items-center justify-center">
                      <Text className="text-white font-bold text-xs">3</Text>
                    </View>
                    <Text className="text-white font-semibold text-sm">Verify Setup</Text>
                  </View>
                  <Text className="text-zinc-400 text-xs leading-5 mb-3">
                    Enter the 6-digit code currently shown in your authenticator app to confirm setup:
                  </Text>

                  <View className="flex-row items-center bg-zinc-950 rounded-xl px-4 py-3 border border-zinc-800">
                    <Key color="#3b82f6" size={18} />
                    <TextInput
                      className="flex-1 text-white ml-3 text-lg font-bold tracking-[0.3em] text-center"
                      placeholder="000000"
                      placeholderTextColor="#52525b"
                      value={verifyCode}
                      onChangeText={(v) => setVerifyCode(v.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleVerifyAndEnable}
                    className="bg-blue-600 py-3.5 rounded-xl items-center mt-4"
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    <Text className="text-white font-bold text-sm uppercase tracking-wide">
                      {loading ? "Verifying..." : "Verify & Enable 2FA"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Cancel */}
                <TouchableOpacity
                  onPress={() => {
                    setSetupMode(false);
                    setNewSecret("");
                    setVerifyCode("");
                  }}
                  className="items-center py-3"
                >
                  <Text className="text-zinc-500 text-sm font-medium">Cancel Setup</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-4">
                {/* Actions */}
                {is2FAEnabled ? (
                  <>
                    <TouchableOpacity
                      onPress={handleReset2FA}
                      className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex-row items-center gap-3"
                    >
                      <Key color="#3b82f6" size={20} />
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-sm">Reset ZestyAuth</Text>
                        <Text className="text-zinc-500 text-xs mt-0.5">Generate a new secret key</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleDisable2FA}
                      className="bg-red-500/5 p-4 rounded-2xl border border-red-500/20 flex-row items-center gap-3"
                    >
                      <ShieldOff color="#ef4444" size={20} />
                      <View className="flex-1">
                        <Text className="text-red-400 font-semibold text-sm">Disable 2FA</Text>
                        <Text className="text-zinc-500 text-xs mt-0.5">Remove two-factor authentication</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={startSetup}
                    className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/30 flex-row items-center gap-3"
                    activeOpacity={0.8}
                  >
                    <ShieldCheck color="#3b82f6" size={24} />
                    <View className="flex-1">
                      <Text className="text-blue-400 font-bold text-base">Enable ZestyAuth 2FA</Text>
                      <Text className="text-zinc-400 text-xs mt-1 leading-4">
                        Protect your account with an authenticator app. Compatible with Google Authenticator, Authy & more.
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* How it works */}
                <View className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 mt-2">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">How ZestyAuth Works</Text>
                  <Text className="text-zinc-500 text-xs leading-5">
                    • When 2FA is enabled, logging in requires email OTP OR authenticator code{'\n'}
                    • Without 2FA, only email OTP is used{'\n'}
                    • Your authenticator app generates a new code every 30 seconds{'\n'}
                    • Keep your secret key backed up safely
                  </Text>
                </View>

                {/* Support */}
                <View className="items-center mt-6">
                  <View className="flex-row items-center gap-1.5">
                    <Mail color="#52525b" size={12} />
                    <Text className="text-zinc-600 text-xs">Need help? Contact</Text>
                  </View>
                  <Text className="text-blue-400/70 text-xs font-medium mt-1" selectable>
                    support@zestyahh.com
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
