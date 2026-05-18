import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Zap, Mail, KeyRound, User, ArrowRight, Shield, ShieldCheck, CheckCircle2, XCircle, Key } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../db/instant";
import { verifyTotpToken } from "../utils/zestyauth";

interface LoginScreenProps {
  onGuestContinue: () => void;
}

const CAPTCHAS = [
  { question: "What is 2 + 3?", answer: "5" },
  { question: "Type 'apple' backwards", answer: "elppa" },
  { question: "What color is a red apple?", answer: "red" },
  { question: "What is 10 - 4?", answer: "6" },
  { question: "Type 'auth' in all caps", answer: "AUTH" },
  { question: "First letter of 'ZestyAhh'", answer: "Z" },
  { question: "10 multiplied by 2", answer: "20" },
  { question: "Type the number five (digit)", answer: "5" },
  { question: "What is 7 + 1?", answer: "8" },
  { question: "Type 'KC' in lowercase", answer: "kc" },
];

export default function LoginScreen({ onGuestContinue }: LoginScreenProps) {
  const { sendMagicCode, verifyCode, continueAsGuest, pending2FA, complete2FALogin } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  // OTP state
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  
  // 2FA state
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  
  // Captcha state
  const [captchaIndex, setCaptchaIndex] = useState(0);
  const [captchaInput, setCaptchaInput] = useState("");
  
  // Username availability
  const [isUsernameChecking, setIsUsernameChecking] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCaptchaIndex(Math.floor(Math.random() * CAPTCHAS.length));
  }, []);

  const checkUsernameAvailability = async (name: string) => {
    if (!name || name.length < 5 || name.length > 15) {
      setIsUsernameAvailable(null);
      return;
    }
    setIsUsernameChecking(true);
    try {
      const res = await db.queryOnce({ profiles: { $: { where: { username: name } } } });
      setIsUsernameAvailable(res.data.profiles.length === 0);
    } catch (e) {
      setIsUsernameAvailable(null);
    } finally {
      setIsUsernameChecking(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    const cleanedText = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleanedText);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      checkUsernameAvailability(cleanedText);
    }, 500);
  };

  const handleSendCode = async () => {
    if (!email || !password || !username) {
      Alert.alert("Missing Fields", "Please enter your username, email, and password.");
      return;
    }

    const usernameRegex = /^[a-z0-9_]{5,15}$/;
    if (!usernameRegex.test(username)) {
      Alert.alert(
        "Invalid Username",
        "Username must be between 5 and 15 characters, and can only contain lowercase letters, numbers, and underscores (no spaces)."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password Too Short", "Your password must be at least 6 characters.");
      return;
    }

    if (isUsernameAvailable === false) {
      Alert.alert("Username Taken", "Please choose a different username.");
      return;
    }

    if (captchaInput.trim().toLowerCase() !== CAPTCHAS[captchaIndex].answer.toLowerCase()) {
      Alert.alert("Captcha Failed", "Please answer the security question correctly.");
      setCaptchaIndex(Math.floor(Math.random() * CAPTCHAS.length));
      setCaptchaInput("");
      return;
    }

    setLoading(true);
    try {
      await sendMagicCode(email);
      setCodeSent(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      Alert.alert("Code Required", "Please enter the OTP sent to your email.");
      return;
    }
    setLoading(true);
    try {
      await verifyCode(email, code, username);
      // If 2FA is needed, the pending2FA state will be set by AuthContext
      // and we'll show the 2FA screen via the render below
    } catch (err: any) {
      Alert.alert("Error", err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFACode || twoFACode.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code from your authenticator app.");
      return;
    }

    setTwoFALoading(true);
    
    // Look up the user's TOTP secret from DB
    try {
      const res = await db.queryOnce({ profiles: { $: { where: { username: pending2FA?.username || "" } } } });
      let profile = res.data.profiles[0] as any;
      
      // If not found by username, try email-based lookup via auth user
      if (!profile) {
        // The user is authenticated at this point, just blocked by 2FA
        // Since we may not have a direct email field, use the username
        Alert.alert("Error", "Could not verify 2FA. Please try again or contact support@zestyahh.com");
        setTwoFALoading(false);
        return;
      }

      const secret = profile.totpSecret;
      if (!secret) {
        Alert.alert("Error", "2FA secret not found. Contact support@zestyahh.com");
        setTwoFALoading(false);
        return;
      }

      const isValid = verifyTotpToken(twoFACode, secret);
      if (isValid) {
        complete2FALogin();
      } else {
        Alert.alert("Invalid Code", "The code is incorrect. Please try again.\n\nIf you've lost access to your authenticator, contact support@zestyahh.com");
      }
    } catch {
      Alert.alert("Error", "Verification failed. Contact support@zestyahh.com");
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    onGuestContinue();
  };

  // ──────────── 2FA Verification Screen ────────────
  if (pending2FA) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-zinc-950 items-center"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="w-full max-w-lg flex-1">
          <ScrollView
            className="flex-1 w-full"
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-8 py-10 w-full">
              <View className="items-center mb-8">
                <View className="w-16 h-16 bg-blue-500/10 rounded-2xl items-center justify-center mb-4 border border-blue-500/20">
                  <ShieldCheck color="#3b82f6" size={32} />
                </View>
                <Text className="text-white text-2xl font-black tracking-tight text-center">ZestyAuth</Text>
                <Text className="text-zinc-500 text-xs mt-2 uppercase tracking-widest font-bold">
                  Two-Factor Verification
                </Text>
                <Text className="text-zinc-400 text-center text-sm mt-4 leading-5 px-4">
                  Enter the 6-digit code from your authenticator app to complete login.
                </Text>
              </View>

              <View className="flex-row items-center bg-zinc-900/80 rounded-2xl px-4 py-4 border border-zinc-800">
                <Key color="#3b82f6" size={20} />
                <TextInput
                  className="flex-1 text-white ml-3 text-xl font-bold tracking-[0.3em] text-center"
                  placeholder="000000"
                  placeholderTextColor="#52525b"
                  value={twoFACode}
                  onChangeText={(v) => setTwoFACode(v.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                className="bg-blue-600 py-4 rounded-2xl items-center mt-4"
                onPress={handleVerify2FA}
                disabled={twoFALoading}
                activeOpacity={0.8}
              >
                {twoFALoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base uppercase tracking-wide">Verify 2FA</Text>
                )}
              </TouchableOpacity>

              <View className="items-center mt-8">
                <Text className="text-zinc-600 text-xs text-center leading-5">
                  Lost access to your authenticator?{'\n'}
                  Contact <Text className="text-blue-400/70 font-medium" selectable>support@zestyahh.com</Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ──────────── Normal Login Flow ────────────
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-zinc-950 items-center"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="w-full max-w-lg flex-1">
        <ScrollView
          className="flex-1 w-full"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-8 py-10 w-full">
            {/* Brand Header */}
            <View className="items-center mb-10">
              <View className="w-16 h-16 bg-zinc-900 rounded-2xl items-center justify-center mb-5 border border-zinc-800 shadow-xl shadow-blue-500/10">
                <Zap color="#3b82f6" size={32} fill="#3b82f6" />
              </View>
              <Text className="text-3xl font-black text-white tracking-tighter text-center">Balance Unlimited</Text>
              <Text className="text-zinc-500 text-xs mt-2 uppercase tracking-widest font-bold">
                By ZestyAhh
              </Text>
            </View>

            {/* Form */}
            <View className="gap-4 w-full">
              {!codeSent ? (
                <>
                  <Text className="text-white text-lg font-bold mb-2">Sign In / Register</Text>
                  
                  <View className="flex-row items-center bg-zinc-900/80 rounded-2xl px-4 py-3.5 border border-zinc-800">
                    <User color="#52525b" size={20} />
                    <TextInput
                      className="flex-1 text-white ml-3 text-base font-medium"
                      placeholder="Username"
                      placeholderTextColor="#52525b"
                      value={username}
                      onChangeText={handleUsernameChange}
                      autoCapitalize="none"
                    />
                    {username.length >= 3 && (
                      isUsernameChecking ? (
                        <ActivityIndicator size="small" color="#3b82f6" />
                      ) : isUsernameAvailable ? (
                        <CheckCircle2 color="#10b981" size={20} />
                      ) : (
                        <XCircle color="#ef4444" size={20} />
                      )
                    )}
                  </View>

                  {username.length >= 3 && isUsernameAvailable === false && !isUsernameChecking && (
                    <Text className="text-red-400 text-xs mt-1 ml-2 font-medium">Username is already taken</Text>
                  )}

                  <View className="flex-row items-center bg-zinc-900/80 rounded-2xl px-4 py-3.5 border border-zinc-800 mt-3">
                    <Mail color="#52525b" size={20} />
                    <TextInput
                      className="flex-1 text-white ml-3 text-base font-medium"
                      placeholder="Email Address"
                      placeholderTextColor="#52525b"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View className="flex-row items-center bg-zinc-900/80 rounded-2xl px-4 py-3.5 border border-zinc-800 mt-3">
                    <KeyRound color="#52525b" size={20} />
                    <TextInput
                      className="flex-1 text-white ml-3 text-base font-medium"
                      placeholder="Password"
                      placeholderTextColor="#52525b"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  {/* Captcha */}
                  <View className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 mt-2">
                    <View className="flex-row items-center gap-2 mb-3">
                      <Shield color="#3b82f6" size={16} />
                      <Text className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Security Check</Text>
                    </View>
                    <Text className="text-white font-medium mb-3">{CAPTCHAS[captchaIndex].question}</Text>
                    <TextInput
                      className="bg-zinc-950 text-white rounded-xl px-4 py-3 border border-zinc-800 text-base"
                      placeholder="Your Answer"
                      placeholderTextColor="#52525b"
                      value={captchaInput}
                      onChangeText={setCaptchaInput}
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Submit */}
                  <TouchableOpacity
                    className="bg-white py-4 rounded-2xl flex-row items-center justify-center mt-4 shadow-lg shadow-white/10"
                    onPress={handleSendCode}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <>
                        <Text className="text-black font-black text-base mr-2 uppercase tracking-wide">Continue</Text>
                        <ArrowRight color="#000" size={18} />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View className="items-center mb-6">
                    <View className="w-12 h-12 bg-blue-500/10 rounded-full items-center justify-center mb-3">
                      <ShieldCheck color="#3b82f6" size={24} />
                    </View>
                    <Text className="text-white text-xl font-bold text-center">Verify it's you</Text>
                    <Text className="text-zinc-400 text-center text-sm mt-2 px-4 leading-5">
                      We sent an OTP to <Text className="text-blue-400 font-medium">{email}</Text>. Enter it below to confirm your login.
                    </Text>
                  </View>

                  <View className="flex-row items-center bg-zinc-900/80 rounded-2xl px-4 py-4 border border-zinc-800">
                    <KeyRound color="#52525b" size={20} />
                    <TextInput
                      className="flex-1 text-white ml-3 text-lg font-bold tracking-[0.2em]"
                      placeholder="Enter OTP"
                      placeholderTextColor="#52525b"
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  {/* Verify */}
                  <TouchableOpacity
                    className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center mt-4 shadow-lg shadow-blue-500/20"
                    onPress={handleVerify}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-bold text-base uppercase tracking-wide">Authenticate</Text>
                    )}
                  </TouchableOpacity>

                  {/* Go Back */}
                  <TouchableOpacity
                    className="items-center py-4"
                    onPress={() => {
                      setCodeSent(false);
                      setCode("");
                    }}
                  >
                    <Text className="text-zinc-500 text-sm font-medium">
                      Wrong email? <Text className="text-white">Go back</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Divider */}
              {!codeSent && (
                <>
                  <View className="flex-row items-center my-4">
                    <View className="flex-1 h-px bg-zinc-800" />
                    <Text className="text-zinc-600 text-xs mx-4 uppercase tracking-wider font-bold">or</Text>
                    <View className="flex-1 h-px bg-zinc-800" />
                  </View>

                  {/* Guest */}
                  <TouchableOpacity
                    className="py-4 rounded-2xl items-center bg-zinc-900"
                    onPress={handleGuest}
                    activeOpacity={0.7}
                  >
                    <Text className="text-white font-bold text-sm">Explore as Guest</Text>
                    <Text className="text-zinc-500 text-xs mt-1 font-medium">Read-only mode</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Support Email */}
              <View className="items-center mt-6">
                <Text className="text-zinc-700 text-[10px]">
                  Need help? <Text className="text-blue-400/50 font-medium" selectable>support@zestyahh.com</Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
