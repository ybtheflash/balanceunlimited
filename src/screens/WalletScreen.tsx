import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Wallet, CreditCard, ExternalLink, ShieldCheck, Zap, Info } from "lucide-react-native";
import { useWallet } from "../contexts/WalletContext";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import { AdBanner } from "../components/AdBanner";

interface WalletScreenProps {
  onBack: () => void;
}

const PRESET_AMOUNTS = [100, 500, 1000, 3000, 5000, 8000, 10000];

export default function WalletScreen({ onBack }: WalletScreenProps) {
  const { balance, totalSpent, transactions, topup } = useWallet();
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);

  const calculateKC = (inr: number) => {
    if (inr >= 50000) return Math.floor(inr * 2.0);
    if (inr > 10000) return Math.floor(inr * 1.2);
    return Math.floor(inr);
  };

  const getMultiplier = (inr: number) => {
    if (inr >= 50000) return "2.0x";
    if (inr > 10000) return "1.2x";
    return "1.0x";
  };

  const currentAmount = isCustom ? parseInt(customAmount) || 0 : selectedAmount || 0;
  const currentKC = calculateKC(currentAmount);

  const handleTopUp = () => {
    if (currentAmount < 100) {
      Alert.alert("Invalid Amount", "Minimum top-up amount is ₹100.");
      return;
    }
    
    if (isCustom && currentAmount <= 10000) {
      Alert.alert("Invalid Custom Amount", "Custom amounts must be greater than ₹10,000.");
      return;
    }

    Alert.alert(
      "Confirm Purchase",
      `You are about to buy ${formatCurrency(currentKC)} for ₹${currentAmount}.\n\nYou'll be redirected to Razorpay (Simulated).\n\nNOTE: KC is non-refundable and non-redeemable.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed to Pay",
          onPress: () => {
            // Mock Razorpay Flow
            setTimeout(() => {
              topup(currentAmount, currentKC);
              setSelectedAmount(null);
              setCustomAmount("");
              setIsCustom(false);
              Alert.alert(
                "Payment Successful! 🎉",
                `${formatCurrency(currentKC)} has been securely added to your wallet.`
              );
            }, 1000);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-zinc-950 items-center"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="w-full max-w-lg flex-1">
        <ScrollView className="flex-1 w-full" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Header / Current Balance */}
          <View className="px-5 pt-14 pb-8 bg-zinc-900 border-b border-zinc-800">
            <View className="flex-row items-center gap-2 mb-6">
              <View className="w-10 h-10 bg-emerald-500/10 rounded-xl items-center justify-center border border-emerald-500/20">
                <Wallet color="#10b981" size={20} />
              </View>
              <Text className="text-white text-xl font-bold tracking-tight">Ka-Ching Store</Text>
            </View>

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
                <Text className="text-zinc-500 text-xs font-medium">Tier Progress</Text>
                <Text className="text-blue-400 font-bold text-base mt-0.5">
                  Tracked
                </Text>
              </View>
            </View>
          </View>

          {/* Store Section */}
          <View className="px-5 py-6">
            <Text className="text-white text-lg font-bold mb-4">Buy Ka-Chings (KC)</Text>
            
            <View className="flex-row flex-wrap gap-3 mb-4">
              {PRESET_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => {
                    setSelectedAmount(amount);
                    setIsCustom(false);
                  }}
                  activeOpacity={0.7}
                  className={`w-[47%] py-4 rounded-2xl items-center justify-center border ${
                    !isCustom && selectedAmount === amount
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <Text className={`font-bold text-lg ${!isCustom && selectedAmount === amount ? "text-blue-400" : "text-white"}`}>
                    ₹{amount}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-1">Get {formatCurrency(calculateKC(amount))}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount */}
            <TouchableOpacity
              onPress={() => {
                setIsCustom(true);
                setSelectedAmount(null);
              }}
              activeOpacity={0.8}
              className={`p-4 rounded-2xl border ${
                isCustom ? "bg-blue-600/10 border-blue-500" : "bg-zinc-900 border-zinc-800"
              }`}
            >
              <Text className="text-white font-bold mb-2">Custom Amount {">"} ₹10,000</Text>
              <TextInput
                className={`bg-zinc-950 text-white px-4 py-3 rounded-xl border ${isCustom ? "border-blue-500/50" : "border-zinc-800"}`}
                placeholder="Enter amount (e.g., 15000)"
                placeholderTextColor="#52525b"
                keyboardType="number-pad"
                value={customAmount}
                onChangeText={(val) => {
                  const digitsOnly = val.replace(/[^0-9]/g, "");
                  setCustomAmount(digitsOnly);
                  setIsCustom(true);
                }}
                onFocus={() => {
                  setIsCustom(true);
                  setSelectedAmount(null);
                }}
              />
              {isCustom && currentAmount > 10000 && (
                <View className="flex-row items-center gap-2 mt-3 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                  <Zap color="#10b981" size={16} />
                  <Text className="text-emerald-400 font-semibold text-xs">
                    {getMultiplier(currentAmount)} Multiplier Applied! Get {formatCurrency(currentKC)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Checkout Button */}
            <View className="mt-8">
              <TouchableOpacity
                onPress={handleTopUp}
                activeOpacity={0.8}
                className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                  currentAmount >= 100 ? "bg-blue-600" : "bg-zinc-800"
                }`}
                disabled={currentAmount < 100}
              >
                <ExternalLink color={currentAmount >= 100 ? "#fff" : "#52525b"} size={18} />
                <Text className={`font-bold text-base ${currentAmount >= 100 ? "text-white" : "text-zinc-500"}`}>
                  {currentAmount >= 100
                    ? `Pay ₹${currentAmount} via Razorpay`
                    : "Select an amount"}
                </Text>
              </TouchableOpacity>
              {currentAmount >= 100 && (
                <Text className="text-center text-zinc-500 text-xs mt-3">
                  You will receive <Text className="text-white font-bold">{formatCurrency(currentKC)}</Text>
                </Text>
              )}
            </View>
          </View>

          {/* TnC Box */}
          <View className="px-5 py-4">
            <View className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
              <View className="flex-row items-center gap-2 mb-2">
                <Info color="#a1a1aa" size={16} />
                <Text className="text-zinc-300 font-bold text-sm">Terms & Conditions</Text>
              </View>
              <Text className="text-zinc-500 text-xs leading-5">
                • Ka-Chings (KC) are a virtual utility token and have no real-world monetary value.{'\n'}
                • All purchases are strictly non-refundable and non-redeemable outside of this app.{'\n'}
                • Your account tier automatically upgrades based on your total cumulative spend.{'\n'}
                • Multipliers: Custom purchases over ₹10,000 grant a 1.2x bonus. Purchases over ₹50,000 grant a 2.0x bonus.
              </Text>
            </View>
          </View>

          {/* Ad Banner */}
          {!user?.adsRemoved && <AdBanner size="large" />}

          {/* Transactions */}
          <View className="px-5 pt-6">
            <Text className="text-white text-lg font-bold mb-4">Transaction History</Text>
            {transactions.length === 0 ? (
              <View className="bg-zinc-900 rounded-2xl p-8 items-center border border-zinc-800">
                <CreditCard color="#52525b" size={32} />
                <Text className="text-zinc-500 mt-3 font-medium">No transactions yet</Text>
              </View>
            ) : (
              <View className="gap-3">
                {transactions.map((txn) => (
                  <View
                    key={txn.id}
                    className="flex-row items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800"
                  >
                    <View className="flex-1 mr-4">
                      <Text className="text-white font-semibold text-sm mb-1">
                        {txn.description}
                      </Text>
                      <Text className="text-zinc-500 text-xs">
                        {new Date(txn.timestamp).toLocaleDateString()}{" "}
                        {new Date(txn.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
    </KeyboardAvoidingView>
  );
}
