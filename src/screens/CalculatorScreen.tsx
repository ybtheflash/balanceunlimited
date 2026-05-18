import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
} from "react-native";
import { ArrowLeft, Delete, Lock, Unlock, RotateCcw } from "lucide-react-native";
import { useWallet } from "../contexts/WalletContext";
import { formatCurrency } from "../utils/currency";

const COST_PER_RESULT = 5; // KC

interface CalculatorScreenProps {
  onBack: () => void;
  onOpenWallet: () => void;
}

export default function CalculatorScreen({ onBack, onOpenWallet }: CalculatorScreenProps) {
  const { balance, spend, canAfford } = useWallet();
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isResultLocked, setIsResultLocked] = useState(true);
  const { width } = useWindowDimensions();
  const isWide = width > 500;
  const buttonSize = isWide ? 80 : 68;

  const buttons = [
    ["C", "(", ")", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "⌫", "="],
  ];

  const handlePress = (btn: string) => {
    if (btn === "C") {
      setExpression("");
      setResult(null);
      setIsResultLocked(true);
      return;
    }

    if (btn === "⌫") {
      setExpression((prev) => prev.slice(0, -1));
      return;
    }

    if (btn === "=") {
      if (!expression) return;
      try {
        const evalExpr = expression
          .replace(/×/g, "*")
          .replace(/÷/g, "/");
        // eslint-disable-next-line no-eval
        const evalResult = Function('"use strict"; return (' + evalExpr + ")")();
        setResult(String(evalResult));
        setIsResultLocked(true);
      } catch {
        setResult("Error");
        setIsResultLocked(false);
      }
      return;
    }

    setExpression((prev) => prev + btn);
    setResult(null);
    setIsResultLocked(true);
  };

  const handleUnlockResult = () => {
    if (!canAfford(COST_PER_RESULT)) {
      Alert.alert(
        "Insufficient Balance",
        `You need ${formatCurrency(COST_PER_RESULT)} to unlock this result. Current balance: ${formatCurrency(balance)}`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Top Up Wallet", onPress: onOpenWallet },
        ]
      );
      return;
    }

    Alert.alert(
      "Unlock Result",
      `This will cost ${formatCurrency(COST_PER_RESULT)} from your wallet.\n\nBalance: ${formatCurrency(balance)} → ${formatCurrency(balance - COST_PER_RESULT)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay & Unlock",
          onPress: () => {
            const success = spend(COST_PER_RESULT, "Calculator Result Unlock");
            if (success) {
              setIsResultLocked(false);
            }
          },
        },
      ]
    );
  };

  const getButtonStyle = (btn: string) => {
    if (btn === "=") return "bg-blue-600";
    if (btn === "C") return "bg-red-500/20";
    if (["÷", "×", "-", "+", "(", ")"].includes(btn)) return "bg-zinc-800";
    return "bg-zinc-900";
  };

  const getTextColor = (btn: string) => {
    if (btn === "=") return "#ffffff";
    if (btn === "C") return "#ef4444";
    if (["÷", "×", "-", "+", "(", ")"].includes(btn)) return "#3b82f6";
    return "#ffffff";
  };

  return (
    <View className="flex-1 bg-zinc-950 items-center">
      <View className="w-full max-w-lg flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
          <TouchableOpacity
            onPress={onBack}
            className="flex-row items-center gap-2 bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-800"
          >
            <ArrowLeft color="#a1a1aa" size={18} />
            <Text className="text-zinc-400 font-semibold text-sm">Back</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-2 bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-800">
            <Text className="text-zinc-500 text-xs">BAL:</Text>
            <Text className="text-emerald-400 font-bold text-sm">{formatCurrency(balance)}</Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}>
          {/* Display */}
          <View className="px-5 mb-6">
            <View className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800/80 min-h-[160px] justify-end">
              {/* Expression */}
              <Text
                className="text-zinc-400 text-right text-xl mb-2"
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {expression || "0"}
              </Text>

              {/* Result */}
              {result !== null && (
                <View className="items-end">
                  {result === "Error" ? (
                    <Text className="text-red-400 text-3xl font-bold">Error</Text>
                  ) : isResultLocked ? (
                    <TouchableOpacity
                      onPress={handleUnlockResult}
                      className="flex-row items-center gap-3 bg-blue-500/10 px-5 py-3 rounded-2xl border border-blue-500/30"
                      activeOpacity={0.7}
                    >
                      <Lock color="#3b82f6" size={20} />
                      <View>
                        <Text className="text-blue-400 font-bold text-base">Unlock Result</Text>
                        <Text className="text-blue-500/60 text-xs mt-0.5">
                          Pay {formatCurrency(COST_PER_RESULT)} to reveal
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Unlock color="#10b981" size={16} />
                      <Text className="text-emerald-400 text-4xl font-bold">= {result}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Buttons */}
          <View className="px-5 pb-8 items-center">
            {buttons.map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-3 mb-3 justify-center">
                {row.map((btn) => (
                  <TouchableOpacity
                    key={btn}
                    className={`${getButtonStyle(btn)} rounded-2xl items-center justify-center border border-zinc-800/50`}
                    style={{ width: buttonSize, height: buttonSize }}
                    onPress={() => handlePress(btn)}
                    activeOpacity={0.6}
                  >
                    {btn === "⌫" ? (
                      <Delete color="#ef4444" size={22} />
                    ) : (
                      <Text
                        className="font-bold text-xl"
                        style={{ color: getTextColor(btn) }}
                      >
                        {btn}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Cost Indicator */}
        <View className="bg-zinc-900/95 border-t border-zinc-800 py-3 px-5">
          <View className="flex-row items-center justify-center gap-2">
            <Lock color="#f59e0b" size={12} />
            <Text className="text-amber-500/80 text-xs font-semibold tracking-wide">
              Each result costs {formatCurrency(COST_PER_RESULT)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
