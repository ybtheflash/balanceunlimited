import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Alert, KeyboardAvoidingView, Platform, Keyboard, useWindowDimensions
} from "react-native";
import { ArrowLeft, Save, Trash2, Lock, FileText, Unlock } from "lucide-react-native";
import { useWallet } from "../contexts/WalletContext";
import { useAuth } from "../contexts/AuthContext";
import FlexScoreWidget from "../components/FlexScoreWidget";
import PaymentModal from "../components/PaymentModal";
import { db } from "../db/instant";
import { id } from "@instantdb/react-native";
import { encryptNote, decryptNote } from "../utils/encryption";
import { formatCurrency } from "../utils/currency";

interface NotepadScreenProps {
  onBack: () => void;
}

interface Note {
  id: string;
  title: string;
  content: string;
  isUnlocked: boolean;
  createdAt: number;
  creatorId: string;
}

export default function NotepadScreen({ onBack }: NotepadScreenProps) {
  const { totalSpent, spend } = useWallet();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  
  // Use InstantDB links: we query notes where profile is our user
  const { isLoading, error, data } = (db as any).useQuery({ 
    notes: { 
      $: { 
        where: { creatorId: user?.id || "unknown" } 
      }
    } 
  });
  
  console.log("[Notepad] Query state:", { isLoading, error: error?.message || error, notesCount: data?.notes?.length, userId: user?.id });
  
  // Sort notes by createdAt descending and decrypt contents
  const notes = (data?.notes as Note[] | undefined) ? [...(data?.notes as Note[])].sort((a, b) => b.createdAt - a.createdAt).map(note => ({
    ...note,
    content: decryptNote(note.content, user?.id || "unknown")
  })) : [];

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
    
    console.log("[Notepad] executePaymentAction called:", { actionType, amount, userId: user?.id, hasUser: !!user });
    
    // Try to spend — but don't block note saves on it
    const success = spend(amount, `Notepad: ${actionType}`);
    console.log("[Notepad] spend() returned:", success);

    // Process action
    if (actionType === "save") {
      const newNoteId = id();
      const userId = user?.id || "unknown";
      // Encrypt the content before saving
      const encryptedContent = encryptNote(currentText, userId);
      
      const newNote = {
        title: currentText.split("\n")[0].substring(0, 20) || "Untitled",
        content: encryptedContent,
        isUnlocked: true,
        creatorId: userId,
        createdAt: Date.now(),
      };
      
      console.log("[Notepad] About to transact. noteId:", newNoteId, "userId:", userId);
      
      db.transact(
        db.tx.notes[newNoteId].update(newNote)
      ).then(() => {
        console.log("[Notepad] ✅ Note saved successfully!");
      }).catch((err: any) => {
        console.error("[Notepad] ❌ Failed to save note:", err);
        Alert.alert("Save Failed", "Could not save the note: " + String(err));
      });
      setCurrentText("");
    } 
    else if (actionType === "unlock" && targetNoteId) {
      if (!success) {
        Alert.alert("Insufficient Balance", "You need KC to unlock this note.");
        closePayment();
        return;
      }
      db.transact(
        db.tx.notes[targetNoteId].update({ isUnlocked: true })
      );
      const unlockedNote = notes.find(n => n.id === targetNoteId);
      if (unlockedNote) {
        setCurrentText(unlockedNote.content);
      }
    } 
    else if (actionType === "delete" && targetNoteId) {
      db.transact(
        db.tx.notes[targetNoteId].delete()
      );
      setCurrentText("");
    }
    
    closePayment();
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-zinc-950" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-10">
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center gap-2 bg-zinc-900/80 px-4 py-2.5 rounded-full border border-zinc-800/50"
        >
          <ArrowLeft color="#a1a1aa" size={18} />
          <Text className="text-zinc-300 font-semibold text-sm">Back</Text>
        </TouchableOpacity>

        <FlexScoreWidget score={totalSpent} />
      </View>

      <View className={`flex-1 ${isDesktop ? 'flex-row' : 'flex-col'}`}>
        {/* Main Editor */}
        <View className={`flex-1 p-6 ${isDesktop ? '' : 'min-h-[50vh]'}`}>
          <TextInput
            className="flex-1 text-zinc-100 text-lg leading-relaxed text-left font-medium"
            placeholder="Start typing your premium thoughts... Everything is encrypted."
            placeholderTextColor="#52525b"
            multiline
            textAlignVertical="top"
            value={currentText}
            onChangeText={setCurrentText}
            style={Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}}
          />
          
          <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-zinc-900/50">
            <View className="flex-row items-center gap-2">
              <Lock color="#52525b" size={12} />
              <Text className="text-zinc-500 text-xs font-medium tracking-wide uppercase">
                {currentText.length} chars • E2E Encrypted
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={handleSavePress}
              className={`flex-row items-center gap-2 px-6 py-3 rounded-full shadow-lg ${
                currentText.trim() ? "bg-amber-500 shadow-amber-500/20" : "bg-zinc-800/50 shadow-none"
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
          <View className={`${isDesktop ? 'w-1/3 border-l' : 'h-2/5 border-t'} border-zinc-900 bg-zinc-950 p-5`}>
            <Text className="text-zinc-400 font-bold text-xs uppercase tracking-widest mb-4 flex-row items-center">
              Encrypted Vault
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {notes.map(note => (
                <View key={note.id} className="bg-zinc-900/60 rounded-2xl mb-3 border border-zinc-800/60 overflow-hidden relative group">
                  <TouchableOpacity
                    onPress={() => handleUnlockPress(note)}
                    className="p-4"
                  >
                    <View className="flex-row items-center gap-3 mb-2">
                      <View className={`p-2 rounded-lg ${note.isUnlocked ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
                        {note.isUnlocked ? (
                          <Unlock color="#3b82f6" size={16} />
                        ) : (
                          <Lock color="#f59e0b" size={16} />
                        )}
                      </View>
                      <Text className="text-zinc-200 font-bold text-sm flex-1" numberOfLines={1}>
                        {note.title}
                      </Text>
                    </View>
                    
                    <View className="relative mt-1">
                      <Text 
                        className={`text-xs leading-relaxed ${note.isUnlocked ? "text-zinc-400" : "text-transparent"}`}
                        numberOfLines={3}
                      >
                        {note.isUnlocked ? note.content : "Blurred content hidden for your privacy..."}
                      </Text>
                      
                      {!note.isUnlocked && (
                        <View className="absolute inset-0 items-center justify-center rounded">
                          <View className="bg-zinc-950/80 px-3 py-1.5 rounded-full border border-zinc-800/50">
                            <Text className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                              Locked Memory
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  {/* Delete Button */}
                  <View className="border-t border-zinc-800/50 flex-row justify-between items-center p-2 px-4 bg-zinc-950/30">
                    <Text className="text-zinc-600 text-[10px]">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => handleDeletePress(note.id)}
                      className="p-1.5 rounded-full hover:bg-red-500/10"
                    >
                      <Trash2 color="#ef4444" size={14} />
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
             // Let user keep their text if they cancel instead of discarding
          }
          closePayment();
        }}
      />
    </KeyboardAvoidingView>
  );
}
