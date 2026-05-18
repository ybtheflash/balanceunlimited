import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Alert, KeyboardAvoidingView, Platform, Keyboard
} from "react-native";
import { ArrowLeft, Save, Trash2, Lock, FileText } from "lucide-react-native";
import { useWallet } from "../contexts/WalletContext";
import FlexScoreWidget from "../components/FlexScoreWidget";
import PaymentModal from "../components/PaymentModal";

interface NotepadScreenProps {
  onBack: () => void;
}

interface Note {
  id: string;
  title: string;
  content: string;
  isUnlocked: boolean;
}

import { formatCurrency } from "../utils/currency";

export default function NotepadScreen({ onBack }: NotepadScreenProps) {
  const { totalSpent, spend } = useWallet();
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentText, setCurrentText] = useState("");
  
  // Modals state
  const [paymentConfig, setPaymentConfig] = useState<{
    visible: boolean;
    title: string;
    amount: number;
    actionType: "save" | "unlock" | "delete" | null;
    targetNoteId: string | null;
    cancelText?: string;
  }>({
    visible: false,
    title: "",
    amount: 0,
    actionType: null,
    targetNoteId: null,
  });

  const closePayment = () => setPaymentConfig(prev => ({ ...prev, visible: false }));

  const handleSavePress = () => {
    if (!currentText.trim()) return;
    Keyboard.dismiss();
    setPaymentConfig({
      visible: true,
      title: `Save Note? That will be ${formatCurrency(99)}.`,
      amount: 99,
      actionType: "save",
      targetNoteId: null,
      cancelText: "Discard (Free)"
    });
  };

  const handleUnlockPress = (note: Note) => {
    if (note.isUnlocked) {
      setCurrentText(note.content);
      return;
    }
    setPaymentConfig({
      visible: true,
      title: `Unlock Memory? ${formatCurrency(50)} admission fee.`,
      amount: 50,
      actionType: "unlock",
      targetNoteId: note.id,
      cancelText: "Keep Locked"
    });
  };

  const handleDeletePress = (noteId: string) => {
    setPaymentConfig({
      visible: true,
      title: `Erase History? ${formatCurrency(200)} Disposal Fee.`,
      amount: 200,
      actionType: "delete",
      targetNoteId: noteId,
      cancelText: "Keep Note"
    });
  };

  const executePaymentAction = () => {
    const { amount, actionType, targetNoteId } = paymentConfig;
    
    // Attempt to spend
    const success = spend(amount, `Notepad: ${actionType}`);
    
    if (!success) {
      Alert.alert("Insufficient Balance", "You don't have enough KC to perform this action. Top up your wallet!");
      closePayment();
      return;
    }

    // Process action
    if (actionType === "save") {
      const newNote: Note = {
        id: Date.now().toString(),
        title: currentText.split("\n")[0].substring(0, 20) || "Untitled",
        content: currentText,
        isUnlocked: true,
      };
      setNotes([newNote, ...notes]);
      setCurrentText("");
    } 
    else if (actionType === "unlock" && targetNoteId) {
      setNotes(notes.map(n => n.id === targetNoteId ? { ...n, isUnlocked: true } : n));
      const unlockedNote = notes.find(n => n.id === targetNoteId);
      if (unlockedNote) {
        setCurrentText(unlockedNote.content);
      }
    } 
    else if (actionType === "delete" && targetNoteId) {
      setNotes(notes.filter(n => n.id !== targetNoteId));
      setCurrentText("");
    }
    
    closePayment();
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-zinc-950" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3 border-b border-zinc-900">
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center gap-2 bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-800"
        >
          <ArrowLeft color="#a1a1aa" size={18} />
          <Text className="text-zinc-400 font-semibold text-sm">Back</Text>
        </TouchableOpacity>

        <FlexScoreWidget score={totalSpent} />
      </View>

      <View className="flex-1 flex-row">
        {/* Main Editor */}
        <View className="flex-1 p-5">
          <TextInput
            className="flex-1 text-white text-lg text-left"
            placeholder="Start typing your premium thoughts..."
            placeholderTextColor="#52525b"
            multiline
            textAlignVertical="top"
            value={currentText}
            onChangeText={setCurrentText}
          />
          
          <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-zinc-900">
            <Text className="text-zinc-500 text-xs font-medium">
              {currentText.length} characters
            </Text>
            
            <TouchableOpacity
              onPress={handleSavePress}
              className={`flex-row items-center gap-2 px-6 py-3 rounded-full ${
                currentText.trim() ? "bg-amber-500" : "bg-zinc-800"
              }`}
              disabled={!currentText.trim()}
            >
              <Save color={currentText.trim() ? "#000" : "#52525b"} size={18} />
              <Text className={`font-bold ${currentText.trim() ? "text-black" : "text-zinc-500"}`}>
                Save Note
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sidebar / Notes List */}
        {notes.length > 0 && (
          <View className="w-1/3 border-l border-zinc-900 bg-zinc-950/50 p-4">
            <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider mb-4">Saved History</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {notes.map(note => (
                <View key={note.id} className="bg-zinc-900 rounded-2xl mb-3 border border-zinc-800 overflow-hidden">
                  <TouchableOpacity
                    onPress={() => handleUnlockPress(note)}
                    className="p-4"
                  >
                    <View className="flex-row items-center gap-2 mb-2">
                      <FileText color="#3b82f6" size={16} />
                      <Text className="text-zinc-200 font-bold text-sm flex-1" numberOfLines={1}>
                        {note.title}
                      </Text>
                      {!note.isUnlocked && <Lock color="#f59e0b" size={14} />}
                    </View>
                    
                    <View className="relative">
                      <Text 
                        className={`text-xs ${note.isUnlocked ? "text-zinc-400" : "text-transparent"}`}
                        numberOfLines={3}
                      >
                        {note.isUnlocked ? note.content : "Blurred content hidden..."}
                      </Text>
                      
                      {!note.isUnlocked && (
                        <View className="absolute inset-0 bg-zinc-900/80 items-center justify-center rounded">
                          <Text className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                            Locked Memory
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  {/* Delete Button */}
                  <View className="border-t border-zinc-800 flex-row justify-end p-2 bg-zinc-950/50">
                    <TouchableOpacity 
                      onPress={() => handleDeletePress(note.id)}
                      className="p-2"
                    >
                      <Trash2 color="#ef4444" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <PaymentModal
        visible={paymentConfig.visible}
        title={paymentConfig.title}
        amount={paymentConfig.amount}
        cancelText={paymentConfig.cancelText}
        onPay={executePaymentAction}
        onCancel={() => {
          if (paymentConfig.actionType === "save") {
            // "Discard (Free)" mechanic
            setCurrentText("");
          }
          closePayment();
        }}
      />
    </KeyboardAvoidingView>
  );
}
