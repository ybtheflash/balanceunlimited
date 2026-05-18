import React, { useState } from "react";
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
import { Zap, Mail, KeyRound, User, ArrowRight } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";

interface LoginScreenProps {
  onGuestContinue: () => void;
}

export default function LoginScreen({ onGuestContinue }: LoginScreenProps) {
  const { sendMagicCode, verifyCode, continueAsGuest, devLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Email Required", "Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      await sendMagicCode(email);
      setCodeSent(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      Alert.alert("Code Required", "Please enter the magic code.");
      return;
    }
    setLoading(true);
    try {
      await verifyCode(email, code, username);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    onGuestContinue();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-zinc-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-8 py-12">
          {/* Brand */}
          <View className="items-center mb-12">
            <View className="w-16 h-16 bg-blue-600/20 rounded-2xl items-center justify-center mb-4 border border-blue-500/30">
              <Zap color="#3b82f6" size={32} fill="#3b82f6" />
            </View>
            <Text className="text-3xl font-bold text-white tracking-tight">Balance Unlimited</Text>
            <Text className="text-zinc-500 text-sm mt-1">
              {codeSent ? "Check your email for the code" : "Sign in or Create account"}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {!codeSent ? (
              <>
                <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
                  <Mail color="#71717a" size={20} />
                  <TextInput
                    className="flex-1 text-white ml-3 text-base"
                    placeholder="Email"
                    placeholderTextColor="#52525b"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Submit */}
                <TouchableOpacity
                  className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center mt-2"
                  onPress={handleSendCode}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text className="text-white font-bold text-base mr-2">Send Magic Code</Text>
                      <ArrowRight color="#fff" size={18} />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
                  <User color="#71717a" size={20} />
                  <TextInput
                    className="flex-1 text-white ml-3 text-base"
                    placeholder="Username (optional for existing users)"
                    placeholderTextColor="#52525b"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>

                <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
                  <KeyRound color="#71717a" size={20} />
                  <TextInput
                    className="flex-1 text-white ml-3 text-base"
                    placeholder="Magic Code"
                    placeholderTextColor="#52525b"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                  />
                </View>

                {/* Verify */}
                <TouchableOpacity
                  className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center mt-2"
                  onPress={handleVerify}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text className="text-white font-bold text-base mr-2">Verify & Sign In</Text>
                      <ArrowRight color="#fff" size={18} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Go Back */}
                <TouchableOpacity
                  className="items-center py-3"
                  onPress={() => setCodeSent(false)}
                >
                  <Text className="text-zinc-500 text-sm">
                    Didn't receive it? <Text className="text-blue-500 font-semibold">Try again</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Divider */}
            <View className="flex-row items-center my-2">
              <View className="flex-1 h-px bg-zinc-800" />
              <Text className="text-zinc-600 text-xs mx-4 uppercase tracking-wider">or</Text>
              <View className="flex-1 h-px bg-zinc-800" />
            </View>

            {/* Guest */}
            <TouchableOpacity
              className="border border-zinc-800 py-4 rounded-2xl items-center bg-zinc-900/50"
              onPress={handleGuest}
              activeOpacity={0.7}
            >
              <Text className="text-zinc-400 font-semibold text-sm">Continue as Guest</Text>
              <Text className="text-zinc-600 text-xs mt-1">Utilities are view-only</Text>
            </TouchableOpacity>

            {/* Dev Admin Login */}
            <TouchableOpacity
              className="border border-amber-500/30 py-4 rounded-2xl items-center bg-amber-500/5"
              onPress={devLogin}
              activeOpacity={0.7}
            >
              <Text className="text-amber-400 font-bold text-sm">👑 Dev Admin Login</Text>
              <Text className="text-amber-600 text-xs mt-1">Full access • 1000 KC • No email needed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
