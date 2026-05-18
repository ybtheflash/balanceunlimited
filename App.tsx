import "./global.css";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, Text, View, TouchableOpacity, Modal, Alert } from "react-native";
import { Calculator, Zap, Lock, CreditCard, ShieldCheck, X, Camera, Globe, Image as ImageIcon } from "lucide-react-native";
import { useState } from "react";

export default function App() {
  const [selectedUtility, setSelectedUtility] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handleOpenUtility = (name: string) => {
    setSelectedUtility(name);
    setShowPayment(true);
  };

  const processPayment = () => {
    setShowPayment(false);
    Alert.alert("Payment Successful", `You have unlocked ${selectedUtility}! (Dummy Flow)`);
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <StatusBar style="light" />
      <View className="p-6 pt-16 flex-1">
        <View className="mb-10 flex-row items-center justify-center gap-3">
          <Zap color="#3b82f6" size={36} />
          <View>
            <Text className="text-3xl font-bold text-white tracking-tight">Balance</Text>
            <Text className="text-blue-500 font-bold tracking-[0.2em] uppercase text-xs">Unlimited</Text>
          </View>
        </View>

        <Text className="text-zinc-500 mb-6 font-semibold uppercase tracking-wider text-xs">Premium Utilities</Text>

        <View className="flex-row flex-wrap gap-4 justify-between">
          <UtilityCard 
            name="Pro Calculator" 
            icon={<Calculator color="#3b82f6" size={28} />} 
            onPress={() => handleOpenUtility('Pro Calculator')} 
          />
          <UtilityCard 
            name="AI Scanner" 
            icon={<Camera color="#10b981" size={28} />} 
            onPress={() => handleOpenUtility('AI Scanner')} 
          />
          <UtilityCard 
            name="Web Proxy" 
            icon={<Globe color="#a855f7" size={28} />} 
            onPress={() => handleOpenUtility('Web Proxy')} 
          />
          <UtilityCard 
            name="Image Gen" 
            icon={<ImageIcon color="#f59e0b" size={28} />} 
            onPress={() => handleOpenUtility('Image Gen')} 
          />
        </View>
      </View>

      {/* Razorpay Dummy Modal */}
      <Modal visible={showPayment} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-zinc-900 rounded-t-3xl p-6 h-[75%] border-t border-zinc-800">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center gap-3">
                <View className="bg-blue-500/20 p-2 rounded-lg">
                  <CreditCard color="#3b82f6" size={20} />
                </View>
                <Text className="text-white text-xl font-bold tracking-tight">Razorpay Dummy</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPayment(false)} className="p-2 bg-zinc-800 rounded-full">
                <X color="#a1a1aa" size={20} />
              </TouchableOpacity>
            </View>

            <View className="bg-zinc-800/80 p-5 rounded-2xl mb-6 border border-zinc-700/50">
              <Text className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Unlock Utility</Text>
              <Text className="text-white text-2xl font-bold mt-1 mb-4">{selectedUtility}</Text>
              
              <View className="h-px bg-zinc-700/50 mb-4" />
              
              <View className="flex-row justify-between items-center">
                <Text className="text-zinc-300 font-medium">Amount to Pay</Text>
                <Text className="text-emerald-400 font-bold text-2xl">₹99.00</Text>
              </View>
            </View>

            <Text className="text-zinc-400 text-sm mb-4 font-medium">Choose Payment Method</Text>
            
            <TouchableOpacity className="flex-row items-center justify-between bg-zinc-800/80 p-4 rounded-2xl mb-3 border border-blue-500/40">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center">
                  <CreditCard color="#3b82f6" size={20} />
                </View>
                <View>
                  <Text className="text-white font-semibold text-base">UPI / QR Code</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">Google Pay, PhonePe, Paytm</Text>
                </View>
              </View>
              <View className="w-5 h-5 rounded-full border-2 border-blue-500 items-center justify-center">
                <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between bg-zinc-800/50 p-4 rounded-2xl mb-6 border border-transparent">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-purple-500/20 rounded-xl items-center justify-center">
                  <CreditCard color="#a855f7" size={20} />
                </View>
                <View>
                  <Text className="text-white font-semibold text-base">Cards</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">Credit, Debit & ATM Cards</Text>
                </View>
              </View>
              <View className="w-5 h-5 rounded-full border-2 border-zinc-600" />
            </TouchableOpacity>

            <View className="flex-1 justify-end pb-8">
              <View className="flex-row items-center justify-center gap-2 mb-4">
                <ShieldCheck color="#10b981" size={16} />
                <Text className="text-emerald-500/80 text-xs font-semibold tracking-wide">100% SECURE PAYMENTS</Text>
              </View>
              <TouchableOpacity 
                className="bg-blue-600 p-4 rounded-2xl items-center shadow-lg shadow-blue-900/20"
                onPress={processPayment}
              >
                <Text className="text-white font-bold text-lg">Pay ₹99.00</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function UtilityCard({ name, icon, onPress }: { name: string, icon: React.ReactNode, onPress: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-zinc-900 w-[47%] aspect-[4/3] rounded-3xl p-5 justify-between border border-zinc-800/80 shadow-sm"
    >
      <View className="w-12 h-12 bg-zinc-950 rounded-2xl items-center justify-center border border-zinc-800/50">
        {icon}
      </View>
      <View>
        <Text className="text-white font-bold text-base tracking-tight">{name}</Text>
        <View className="flex-row items-center mt-1.5 bg-red-500/10 self-start px-2 py-0.5 rounded-full border border-red-500/20">
          <Lock color="#ef4444" size={10} />
          <Text className="text-red-400 text-[10px] ml-1 font-bold uppercase tracking-wider">Locked</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
