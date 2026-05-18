import { useState } from "react";
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
import { Wallet, CreditCard, ExternalLink, Zap, Info, ArrowLeft, ChevronDown } from "lucide-react-native";
import { useWallet, Transaction } from "../contexts/WalletContext";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import { AdBanner } from "../components/AdBanner";
import PaymentModal from "../components/PaymentModal";

interface WalletScreenProps {
  onBack: () => void;
}

const PRESET_AMOUNTS = [100, 500, 1000, 3000, 5000, 8000, 10000];
const PAGE_SIZE = 5;

export default function WalletScreen({ onBack }: WalletScreenProps) {
  const { balance, totalSpent, transactions, topup } = useWallet();
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [activeTab, setActiveTab] = useState<"topup" | "spend">("spend");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  const handleCustomInput = (val: string) => {
    // Only allow digits
    const digitsOnly = val.replace(/[^0-9]/g, "");
    setCustomAmount(digitsOnly);
    setIsCustom(true);
  };

  const handleTopUp = () => {
    if (currentAmount < 100) {
      Alert.alert("Invalid Amount", "Minimum top-up amount is ₹100.");
      return;
    }
    
    if (isCustom && currentAmount < 10000) {
      Alert.alert("Invalid Custom Amount", "Custom amounts must be ₹10,000 or more.");
      return;
    }

    if (isCustom && currentAmount % 10 !== 0) {
      Alert.alert("Invalid Amount", "Custom amounts must end with 0 (whole round numbers only).");
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    topup(currentAmount, currentKC);
    setSelectedAmount(null);
    setCustomAmount("");
    setIsCustom(false);
    setShowPaymentModal(false);
    Alert.alert(
      "Payment Successful! 🎉",
      `${formatCurrency(currentKC)} has been securely added to your wallet.`
    );
  };

  // Split transactions
  const spendTxns = transactions.filter((t) => t.type === "spend");
  const topupTxns = transactions.filter((t) => t.type === "topup");
  const activeTxns = activeTab === "spend" ? spendTxns : topupTxns;
  const paginatedTxns = activeTxns.slice(0, visibleCount);
  const hasMore = activeTxns.length > visibleCount;

  // Compute current tier display
  const tierDisplay = user?.tier || "YaBasic";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-zinc-950 items-center"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="w-full max-w-lg flex-1">
        <ScrollView className="flex-1 w-full" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Header / Current Balance */}
          <View className="px-5 pt-14 pb-8 bg-zinc-900 border-b border-zinc-800">
            {/* Back + Title */}
            <View className="flex-row items-center gap-3 mb-6">
              <TouchableOpacity
                onPress={onBack}
                className="w-10 h-10 bg-zinc-800 rounded-xl items-center justify-center border border-zinc-700"
              >
                <ArrowLeft color="#a1a1aa" size={18} />
              </TouchableOpacity>
              <View className="flex-row items-center gap-2">
                <View className="w-10 h-10 bg-emerald-500/10 rounded-xl items-center justify-center border border-emerald-500/20">
                  <Wallet color="#10b981" size={20} />
                </View>
                <Text className="text-white text-xl font-bold tracking-tight">Ka-Ching Store</Text>
              </View>
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
                <Text className="text-zinc-500 text-xs font-medium">Current Tier</Text>
                <Text className="text-blue-400 font-bold text-base mt-0.5">
                  {tierDisplay}
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
                    ₹{amount.toLocaleString()}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-1">💰 {calculateKC(amount)} KC</Text>
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
              <Text className="text-white font-bold mb-2">Custom Amount — ₹10,000+</Text>
              <Text className="text-zinc-600 text-[10px] mb-2">Must be ≥ ₹10,000 • Whole numbers ending with 0 only</Text>
              <TextInput
                className={`bg-zinc-950 text-white px-4 py-3 rounded-xl border ${isCustom ? "border-blue-500/50" : "border-zinc-800"}`}
                placeholder="Enter amount (e.g., 15000)"
                placeholderTextColor="#52525b"
                keyboardType="number-pad"
                value={customAmount}
                onChangeText={handleCustomInput}
                onFocus={() => {
                  setIsCustom(true);
                  setSelectedAmount(null);
                }}
              />
              {isCustom && currentAmount >= 10000 && currentAmount % 10 === 0 && (
                <View className="flex-row items-center gap-2 mt-3 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                  <Zap color="#10b981" size={16} />
                  <Text className="text-emerald-400 font-semibold text-xs">
                    {getMultiplier(currentAmount)} Multiplier! 💰 {currentKC} KC
                  </Text>
                </View>
              )}
              {isCustom && currentAmount > 0 && currentAmount < 10000 && (
                <Text className="text-red-400 text-xs mt-2">⚠️ Minimum ₹10,000 for custom amounts</Text>
              )}
              {isCustom && currentAmount >= 10000 && currentAmount % 10 !== 0 && (
                <Text className="text-red-400 text-xs mt-2">⚠️ Amount must end with 0</Text>
              )}
            </TouchableOpacity>

            {/* Checkout Button */}
            <View className="mt-8">
              <TouchableOpacity
                onPress={handleTopUp}
                activeOpacity={0.8}
                className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                  (isCustom ? currentAmount >= 10000 && currentAmount % 10 === 0 : currentAmount >= 100) ? "bg-blue-600" : "bg-zinc-800"
                }`}
                disabled={isCustom ? currentAmount < 10000 || currentAmount % 10 !== 0 : currentAmount < 100}
              >
                <ExternalLink color={(isCustom ? currentAmount >= 10000 && currentAmount % 10 === 0 : currentAmount >= 100) ? "#fff" : "#52525b"} size={18} />
                <Text className={`font-bold text-base ${(isCustom ? currentAmount >= 10000 && currentAmount % 10 === 0 : currentAmount >= 100) ? "text-white" : "text-zinc-500"}`}>
                  {(isCustom ? currentAmount >= 10000 && currentAmount % 10 === 0 : currentAmount >= 100)
                    ? `Pay ₹${currentAmount.toLocaleString()} via Razorpay`
                    : "Select an amount"}
                </Text>
              </TouchableOpacity>
              {(isCustom ? currentAmount >= 10000 && currentAmount % 10 === 0 : currentAmount >= 100) && (
                <Text className="text-center text-zinc-500 text-xs mt-3">
                  You will receive 💰 <Text className="text-white font-bold">{currentKC} KC</Text>
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

          {/* Transaction History — Tabbed */}
          <View className="px-5 pt-6">
            <Text className="text-white text-lg font-bold mb-4">Transaction History</Text>

            {/* Tabs: KC Usage / Top-Up */}
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity
                onPress={() => { setActiveTab("spend"); setVisibleCount(PAGE_SIZE); }}
                className={`flex-1 py-3 rounded-xl items-center border ${
                  activeTab === "spend" ? "bg-red-500/10 border-red-500/30" : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <Text className={`font-bold text-xs uppercase tracking-wider ${activeTab === "spend" ? "text-red-400" : "text-zinc-500"}`}>
                  🔥 KC Usage ({spendTxns.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setActiveTab("topup"); setVisibleCount(PAGE_SIZE); }}
                className={`flex-1 py-3 rounded-xl items-center border ${
                  activeTab === "topup" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <Text className={`font-bold text-xs uppercase tracking-wider ${activeTab === "topup" ? "text-emerald-400" : "text-zinc-500"}`}>
                  💳 Top-Up ({topupTxns.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Transaction List */}
            {paginatedTxns.length === 0 ? (
              <View className="bg-zinc-900 rounded-2xl p-8 items-center border border-zinc-800">
                <CreditCard color="#52525b" size={32} />
                <Text className="text-zinc-500 mt-3 font-medium">
                  {activeTab === "spend" ? "No KC usage yet" : "No top-ups yet"}
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {paginatedTxns.map((txn: Transaction) => (
                  <View
                    key={txn.id}
                    className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-white font-semibold text-sm flex-1 mr-3" numberOfLines={1}>
                        {txn.description}
                      </Text>
                      <Text
                        className={`font-bold text-base ${
                          txn.type === "topup" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {txn.type === "topup" ? "+" : "-"}
                        {txn.amount} KC
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-zinc-600 text-[10px] font-mono">
                        {txn.chargeId || "—"}
                      </Text>
                      <Text className="text-zinc-500 text-xs">
                        {new Date(txn.timestamp).toLocaleDateString()}{" "}
                        {new Date(txn.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Pagination */}
                {hasMore && (
                  <TouchableOpacity
                    onPress={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="flex-row items-center justify-center gap-1.5 py-3 bg-zinc-900 rounded-xl border border-zinc-800 mt-1"
                  >
                    <ChevronDown color="#3b82f6" size={16} />
                    <Text className="text-blue-400 font-semibold text-xs">
                      Load More ({activeTxns.length - visibleCount} remaining)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          {/* Payment Modal */}
          <PaymentModal
            visible={showPaymentModal}
            title="Razorpay (Simulated)"
            amount={currentAmount}
            onPay={handlePaymentSuccess}
            onCancel={() => setShowPaymentModal(false)}
          />

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
