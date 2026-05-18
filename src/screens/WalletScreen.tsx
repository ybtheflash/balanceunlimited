import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  useWindowDimensions,
} from "react-native";
import {
  ArrowLeft,
  Wallet,
  Plus,
  ExternalLink,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  IndianRupee,
} from "lucide-react-native";
import { useWallet, Transaction } from "../contexts/WalletContext";
import { formatCurrency } from "../utils/currency";

interface WalletScreenProps {
  onBack: () => void;
}

const TOPUP_OPTIONS = [100, 250, 500, 1000, 2500];
const RAZORPAY_PORTAL_URL = "https://pages.razorpay.com/balanceunlimited-topup"; // Dummy URL

export default function WalletScreen({ onBack }: WalletScreenProps) {
  const { balance, totalSpent, transactions, topup } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width > 600;

  const handleTopup = () => {
    if (!selectedAmount) {
      Alert.alert("Select Amount", "Please select a top-up amount first.");
      return;
    }

    Alert.alert(
      "Top Up via Razorpay",
      `You'll be redirected to Razorpay payment page in your browser to add ${formatCurrency(selectedAmount)} to your wallet.\n\nThis bypasses Play Store fees for your benefit!`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Razorpay",
          onPress: async () => {
            // In production, this would open the Razorpay payment page
            // For dummy purposes, we simulate successful payment
            try {
              // Attempt to open browser (will work on device)
              await Linking.openURL(RAZORPAY_PORTAL_URL).catch(() => {});
            } catch {
              // Ignore browser errors in development
            }

            // Simulate successful payment after "redirect"
            setTimeout(() => {
              topup(selectedAmount);
              setSelectedAmount(null);
              Alert.alert(
                "Payment Successful! 🎉",
                `${formatCurrency(selectedAmount)} has been added to your wallet.`
              );
            }, 1000);
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center gap-2 bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-800"
        >
          <ArrowLeft color="#a1a1aa" size={18} />
          <Text className="text-zinc-400 font-semibold text-sm">Back</Text>
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <Wallet color="#10b981" size={20} />
          <Text className="text-white font-bold text-lg">My Wallet</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Balance Card */}
        <View className="mx-5 mt-4 bg-zinc-900 rounded-3xl p-6 border border-zinc-800/80">
          <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">
            Available Balance
          </Text>
          <Text className="text-white text-4xl font-bold tracking-tight mb-4">
            {formatCurrency(balance)}
          </Text>

          <View className="flex-row gap-4">
            <View className="flex-1 bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
              <Text className="text-zinc-500 text-xs font-medium">Total Spent</Text>
              <Text className="text-red-400 font-bold text-base mt-0.5">
                {formatCurrency(totalSpent)}
              </Text>
            </View>
            <View className="flex-1 bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
              <Text className="text-zinc-500 text-xs font-medium">Transactions</Text>
              <Text className="text-blue-400 font-bold text-base mt-0.5">
                {transactions.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Top-up Section */}
        <View className="px-5 mt-8">
          <View className="flex-row items-center gap-2 mb-4">
            <Plus color="#10b981" size={18} />
            <Text className="text-white font-bold text-lg">Top Up Wallet</Text>
          </View>

          <View className={`flex-row flex-wrap gap-3 mb-5`}>
            {TOPUP_OPTIONS.map((amount) => (
              <TouchableOpacity
                key={amount}
                className={`px-5 py-3.5 rounded-2xl border ${
                  selectedAmount === amount
                    ? "bg-blue-600/20 border-blue-500/50"
                    : "bg-zinc-900 border-zinc-800"
                }`}
                onPress={() => setSelectedAmount(amount)}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-bold text-base ${
                    selectedAmount === amount ? "text-blue-400" : "text-zinc-300"
                  }`}
                >
                  {formatCurrency(amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className={`flex-row items-center justify-center gap-2 py-4 rounded-2xl ${
              selectedAmount ? "bg-emerald-600" : "bg-zinc-800"
            }`}
            onPress={handleTopup}
            activeOpacity={0.8}
            disabled={!selectedAmount}
          >
            <ExternalLink color="#fff" size={18} />
            <Text className="text-white font-bold text-base">
              {selectedAmount
                ? `Pay ${formatCurrency(selectedAmount)} via Razorpay`
                : "Select an amount"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center gap-2 mt-3">
            <ShieldCheck color="#10b981" size={14} />
            <Text className="text-emerald-500/60 text-xs font-semibold tracking-wide">
              Opens in browser • No Play Store fees
            </Text>
          </View>
        </View>

        {/* Transaction History */}
        <View className="px-5 mt-8">
          <Text className="text-zinc-500 font-semibold uppercase tracking-wider text-xs mb-4">
            Transaction History
          </Text>

          {transactions.length === 0 ? (
            <View className="bg-zinc-900 rounded-2xl p-8 items-center border border-zinc-800/80">
              <IndianRupee color="#52525b" size={32} />
              <Text className="text-zinc-500 text-sm mt-3 text-center">
                No transactions yet.{"\n"}Top up your wallet to get started!
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {transactions.map((txn) => (
                <View
                  key={txn.id}
                  className="flex-row items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800/80"
                >
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                      txn.type === "topup"
                        ? "bg-emerald-500/15"
                        : "bg-red-500/15"
                    }`}
                  >
                    {txn.type === "topup" ? (
                      <ArrowDownRight color="#10b981" size={20} />
                    ) : (
                      <ArrowUpRight color="#ef4444" size={20} />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                      {txn.description}
                    </Text>
                    <Text className="text-zinc-600 text-xs mt-0.5">
                      {formatTime(txn.timestamp)}
                    </Text>
                  </View>

                  <Text
                    className={`font-bold text-base ${
                      txn.type === "topup" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {txn.type === "topup" ? "+" : "-"}
                    {formatCurrency(txn.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
