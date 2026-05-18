import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft, FileText, Lock, Sparkles, Clock } from "lucide-react-native";

interface NotepadScreenProps {
  onBack: () => void;
}

export default function NotepadScreen({ onBack }: NotepadScreenProps) {
  return (
    <View className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-14 pb-3">
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center gap-2 bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-800"
        >
          <ArrowLeft color="#a1a1aa" size={18} />
          <Text className="text-zinc-400 font-semibold text-sm">Back</Text>
        </TouchableOpacity>
      </View>

      {/* Placeholder Content */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-28 h-28 bg-emerald-500/10 rounded-3xl items-center justify-center mb-8 border border-emerald-500/20">
          <FileText color="#10b981" size={48} />
        </View>

        <Text className="text-white text-3xl font-bold text-center tracking-tight mb-3">
          Smart Notepad
        </Text>
        <Text className="text-zinc-500 text-center text-base leading-6 mb-10 max-w-[320px]">
          AI-powered note-taking with smart formatting, auto-tags, and cloud sync. Each save costs from your wallet.
        </Text>

        {/* Feature Preview */}
        <View className="w-full max-w-[400px] gap-3">
          <View className="flex-row items-center gap-3 bg-zinc-900 p-4 rounded-2xl border border-zinc-800/80">
            <View className="w-10 h-10 bg-purple-500/15 rounded-xl items-center justify-center">
              <Sparkles color="#a855f7" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-sm">AI Formatting</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Auto-structure your notes</Text>
            </View>
            <Lock color="#52525b" size={16} />
          </View>

          <View className="flex-row items-center gap-3 bg-zinc-900 p-4 rounded-2xl border border-zinc-800/80">
            <View className="w-10 h-10 bg-blue-500/15 rounded-xl items-center justify-center">
              <Clock color="#3b82f6" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-sm">Version History</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Track all your changes</Text>
            </View>
            <Lock color="#52525b" size={16} />
          </View>
        </View>

        {/* Coming Soon Badge */}
        <View className="mt-10 bg-amber-500/10 px-6 py-3 rounded-full border border-amber-500/20">
          <Text className="text-amber-400 font-bold text-sm tracking-wider uppercase">Coming Soon</Text>
        </View>
      </View>
    </View>
  );
}
