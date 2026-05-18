import { View, Text, TouchableOpacity, ScrollView, Alert, useWindowDimensions } from "react-native";
import { Calculator, FileText, Lock, Zap, Wallet, ChevronRight, Crown } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { formatCurrency } from "../utils/currency";
import { AdBanner } from "../components/AdBanner";
import PaymentModal from "../components/PaymentModal";
import { useState, useRef } from "react";

interface Utility {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  costPerUse: number; // KC
  route: string;
}

const UTILITIES: Utility[] = [
  {
    id: "calculator",
    name: "Calculator",
    description: "Advanced calculations with history",
    icon: <Calculator color="#3b82f6" size={28} />,
    iconColor: "#3b82f6",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    costPerUse: 10,
    route: "Calculator",
  },
  {
    id: "notepad",
    name: "Smart Notepad",
    description: "AI-powered notes & formatting",
    icon: <FileText color="#10b981" size={28} />,
    iconColor: "#10b981",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    costPerUse: 10,
    route: "Notepad",
  },
];

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onOpenWallet: () => void;
}

export default function HomeScreen({ onNavigate, onOpenWallet }: HomeScreenProps) {
  const { user, isGuest, isLoggedIn, promptLogin } = useAuth();
  const theme = user?.activeTheme || "dark";
  const isLight = theme === "light";
  const { balance, spend, canAfford } = useWallet();
  const { width } = useWindowDimensions();
  const isWide = width > 700;

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTitle, setPaymentTitle] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentAmountStr, setPaymentAmountStr] = useState("");
  const pendingRouteRef = useRef<string | null>(null);
  const pendingCostRef = useRef<number>(0);

  const handleUtilityPress = (utility: Utility) => {
    onNavigate(utility.route);
  };

  const handlePayConfirmed = () => {
    const route = pendingRouteRef.current;
    const cost = pendingCostRef.current;
    if (!route) return;

    const success = spend(cost, `App Access: ${route}`);
    if (success) {
      setShowPaymentModal(false);
      pendingRouteRef.current = null;
      onNavigate(route);
    }
  };

  const handlePayCancel = () => {
    setShowPaymentModal(false);
    pendingRouteRef.current = null;
  };

  return (
    <View className={`flex-1 ${theme === "liquidGlass" ? "bg-transparent" : isLight ? "bg-zinc-50" : "bg-zinc-950"} items-center`}>
      <View className="w-full max-w-lg flex-1">
        <ScrollView className="flex-1 w-full" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-14 pb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 bg-blue-600/20 rounded-xl items-center justify-center border border-blue-500/30">
                  <Zap color="#3b82f6" size={22} fill="#3b82f6" />
                </View>
                <View>
                  <Text className={`${isLight ? "text-zinc-900" : "text-white"} text-xl font-bold tracking-tight`}>Balance Unlimited</Text>
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Crown color="#f59e0b" size={11} />
                    <Text className="text-amber-500 text-xs font-bold uppercase tracking-wider">{user?.tier || "YaBasic"}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-6 mb-6">
              <Text className={`${isLight ? "text-zinc-500" : "text-zinc-400"} text-sm`}>
                {isGuest ? "Browsing as" : "Logged in as"}
              </Text>
              <Text className={`${isLight ? "text-zinc-900" : "text-white"} text-2xl font-bold mt-0.5`}>
                {isGuest ? "Guest 👋" : `${user?.username ?? "User"} 👋`}
              </Text>
            </View>

            {isLoggedIn && (
              <TouchableOpacity
                className={`${isLight ? "bg-white" : "bg-zinc-900"} rounded-3xl p-5 mb-8 border ${isLight ? "border-zinc-200" : "border-zinc-800"}`}
                onPress={onOpenWallet}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 bg-emerald-500/15 rounded-2xl items-center justify-center border border-emerald-500/20">
                      <Wallet color="#10b981" size={22} />
                    </View>
                    <View>
                      <Text className={`${isLight ? "text-zinc-500" : "text-zinc-400"} text-xs font-medium uppercase tracking-wider`}>Wallet Balance</Text>
                      <Text className={`${isLight ? "text-zinc-900" : "text-white"} text-2xl font-bold mt-0.5`}>
                        {formatCurrency(balance)}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-emerald-500/15 px-4 py-2 rounded-xl border border-emerald-500/20">
                    <Text className="text-emerald-400 font-bold text-sm">Top Up</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {isGuest && (
              <View className="bg-amber-500/10 rounded-2xl p-4 mb-8 border border-amber-500/20">
                <View className="flex-row items-center gap-2 mb-1">
                  <Lock color="#f59e0b" size={16} />
                  <Text className="text-amber-400 font-bold text-sm">Guest Mode</Text>
                </View>
                <Text className="text-amber-500/70 text-xs leading-5">
                  You are browsing the app as a guest. All utilities are free to launch, but internal paid features require an account and wallet balance!
                </Text>
              </View>
            )}

            {!user?.adsRemoved && <AdBanner size="banner" />}

            <Text className={`${isLight ? "text-zinc-500" : "text-zinc-400"} mb-4 font-semibold uppercase tracking-wider text-xs`}>
              Utilities
            </Text>

            <View className={isWide ? "flex-row flex-wrap gap-4" : "gap-4"}>
              {UTILITIES.map((utility) => (
                <TouchableOpacity
                  key={utility.id}
                  className={`${isLight ? "bg-white" : "bg-zinc-900"} rounded-3xl p-5 border ${isLight ? "border-zinc-200" : "border-zinc-800"} ${isWide ? "w-[48%]" : ""}`}
                  onPress={() => handleUtilityPress(utility)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View className={`w-14 h-14 ${utility.bgColor} rounded-2xl items-center justify-center border ${utility.borderColor}`}>
                      {utility.icon}
                    </View>
                    <View className={`flex-row items-center gap-1 ${isLight ? "bg-zinc-100" : "bg-zinc-800/80"} px-3 py-1.5 rounded-full`}>
                      <Text className="text-sm">💰</Text>
                      <Text className={`text-xs font-bold ${isLight ? "text-emerald-600" : "text-emerald-400"}`}>{utility.costPerUse} KC</Text>
                    </View>
                  </View>

                  <Text className={`${isLight ? "text-zinc-900" : "text-white"} font-bold text-lg tracking-tight`}>{utility.name}</Text>
                  <Text className={`${isLight ? "text-zinc-500" : "text-zinc-400"} text-sm mt-1 leading-5`}>{utility.description}</Text>

                  <View className="flex-row items-center mt-4 justify-between">
                    <View className="flex-row items-center bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                      <Text className="text-blue-400 text-xs font-bold uppercase tracking-wider">Open</Text>
                    </View>
                    <ChevronRight color="#52525b" size={20} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <PaymentModal
        visible={showPaymentModal}
        title={paymentTitle}
        amount={paymentAmount}
        amountString={paymentAmountStr}
        onPay={handlePayConfirmed}
        onCancel={handlePayCancel}
        cancelText="Cancel"
      />
    </View>
  );
}
