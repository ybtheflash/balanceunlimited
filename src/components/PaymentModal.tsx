import { useEffect, useState } from "react";
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { CreditCard, Fingerprint, Lock, ShieldCheck } from "lucide-react-native";
import { formatCurrency } from "../utils/currency";

interface PaymentModalProps {
  visible: boolean;
  title: string;
  amount: number; // in cents or whole numbers, we'll format as $X.XX
  amountString?: string; // override formatting
  onPay: () => void;
  onCancel: () => void;
  cancelText?: string;
}

export default function PaymentModal({
  visible,
  title,
  amount,
  onPay,
  onCancel,
  cancelText = "Cancel",
  amountString,
}: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      setProcessing(false);
      setSuccess(false);
    }
  }, [visible]);

  const handlePay = () => {
    setProcessing(true);
    // Fake processing delay
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      // Brief success state before resolving
      setTimeout(() => {
        onPay();
      }, 800);
    }, 1500);
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-800 shadow-2xl pb-10">
          
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 bg-zinc-700 rounded-full mb-6" />
            <View className="w-16 h-16 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700 shadow-xl mb-4">
              <CreditCard color="#e4e4e7" size={32} />
            </View>
            <Text className="text-white text-xl font-bold tracking-tight mb-2 text-center">
              {title}
            </Text>
            <Text className="text-zinc-400 text-sm mb-6 text-center">
              Secure Transaction • Encrypted
            </Text>
            
            <View className="bg-zinc-950 px-8 py-4 rounded-2xl border border-zinc-800 w-full items-center mb-6">
              <Text className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1">
                Amount Due
              </Text>
              <Text className="text-white text-4xl font-black tracking-tighter">
                {amountString ? amountString : formatCurrency(amount)}
              </Text>
            </View>
          </View>

          {processing ? (
            <View className="items-center py-6">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-blue-400 font-semibold mt-4 tracking-widest uppercase text-xs">
                Processing Payment...
              </Text>
            </View>
          ) : success ? (
            <View className="items-center py-6">
              <View className="w-16 h-16 bg-emerald-500/20 rounded-full items-center justify-center border border-emerald-500">
                <ShieldCheck color="#10b981" size={32} />
              </View>
              <Text className="text-emerald-400 font-bold mt-4 tracking-widest uppercase text-xs">
                Payment Approved
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              <TouchableOpacity
                onPress={handlePay}
                className="bg-zinc-100 rounded-2xl py-4 flex-row justify-center items-center gap-2"
                activeOpacity={0.8}
              >
                <Fingerprint color="#18181b" size={20} />
                <Text className="text-zinc-900 font-bold text-lg">Pay & Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onCancel}
                className="py-4 justify-center items-center"
              >
                <Text className="text-zinc-500 font-semibold text-sm">{cancelText}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-center justify-center gap-1.5 mt-8 opacity-50">
            <Lock color="#a1a1aa" size={12} />
            <Text className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">
              Protected by Balance Pay
            </Text>
          </View>

        </View>
      </View>
    </Modal>
  );
}
