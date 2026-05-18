import { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Alert, KeyboardAvoidingView, Platform, Keyboard, useWindowDimensions
} from "react-native";
import { ArrowLeft, Save, Trash2, Lock, FileText, Unlock, Shield, PenLine, Coins, Clock, ChevronRight } from "lucide-react-native";
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
  const { totalSpent, spend, balance } = useWallet();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  
  const { isLoading, error, data } = (db as any).useQuery({ 
    notes: { 
      $: { 
        where: { creatorId: user?.id || "unknown" } 
      }
    } 
  });
  
  // Sort notes by createdAt descending and decrypt contents
  const notes = (data?.notes as Note[] | undefined) 
    ? [...(data?.notes as Note[])].sort((a, b) => b.createdAt - a.createdAt).map(note => ({
        ...note,
        content: decryptNote(note.content, user?.id || "unknown")
      })) 
    : [];

  const [currentText, setCurrentText] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  // Modals state
  const [paymentConfig, setPaymentConfig] = useState<{
    visible: boolean;
    title: string;
    amount: number;
    amountString: string;
    actionType: "save" | "unlock" | "delete" | null;
    targetNoteId: string | null;
    cancelText?: string;
  }>({
    visible: false,
    title: "",
    amount: 0,
    amountString: "",
    actionType: null,
    targetNoteId: null,
  });

  const closePayment = () => setPaymentConfig(prev => ({ ...prev, visible: false }));

  const handleSavePress = () => {
    if (!currentText.trim()) return;
    Keyboard.dismiss();
    setPaymentConfig({
      visible: true,
      title: `Save Note? That will be 99 KC.`,
      amount: 99,
      amountString: `💰 99 KC`,
      actionType: "save",
      targetNoteId: null,
      cancelText: "Discard (Free)"
    });
  };

  const handleUnlockPress = (note: Note) => {
    if (note.isUnlocked) {
      setCurrentText(note.content);
      setSelectedNoteId(note.id);
      return;
    }
    setPaymentConfig({
      visible: true,
      title: `Unlock Memory? 50 KC admission fee.`,
      amount: 50,
      amountString: `💰 50 KC`,
      actionType: "unlock",
      targetNoteId: note.id,
      cancelText: "Keep Locked"
    });
  };

  const handleDeletePress = (noteId: string) => {
    setPaymentConfig({
      visible: true,
      title: `Erase History? 200 KC Disposal Fee.`,
      amount: 200,
      amountString: `💰 200 KC`,
      actionType: "delete",
      targetNoteId: noteId,
      cancelText: "Keep Note"
    });
  };

  const executePaymentAction = () => {
    const { amount, actionType, targetNoteId } = paymentConfig;
    
    // Try to spend — but don't block note saves on it
    const success = spend(amount, `Notepad: ${actionType}`);

    // Process action
    if (actionType === "save") {
      const newNoteId = id();
      const userId = user?.id || "unknown";
      const encryptedContent = encryptNote(currentText, userId);
      
      const newNote = {
        title: currentText.split("\n")[0].substring(0, 30) || "Untitled",
        content: encryptedContent,
        isUnlocked: true,
        creatorId: userId,
        createdAt: Date.now(),
      };
      
      db.transact(
        db.tx.notes[newNoteId].update(newNote)
      ).then(() => {
        console.log("[Notepad] ✅ Note saved successfully!");
      }).catch((err: any) => {
        console.error("[Notepad] ❌ Failed to save note:", err);
        Alert.alert("Save Failed", "Could not save the note: " + String(err));
      });
      setCurrentText("");
      setSelectedNoteId(null);
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
        setSelectedNoteId(targetNoteId);
      }
    } 
    else if (actionType === "delete" && targetNoteId) {
      db.transact(
        db.tx.notes[targetNoteId].delete()
      );
      if (selectedNoteId === targetNoteId) {
        setCurrentText("");
        setSelectedNoteId(null);
      }
    }
    
    closePayment();
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-zinc-950" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      
      {/* Header */}
      <View className="px-5 pt-14 pb-4 border-b border-zinc-800/60 bg-zinc-950">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onBack}
            className="flex-row items-center gap-2 bg-zinc-900/80 px-4 py-2.5 rounded-full border border-zinc-800/50"
            activeOpacity={0.7}
          >
            <ArrowLeft color="#a1a1aa" size={16} />
            <Text className="text-zinc-300 font-semibold text-sm">Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-3">
            {/* Note count badge */}
            <View className="flex-row items-center bg-zinc-900/80 px-3 py-2 rounded-full border border-zinc-800/50">
              <FileText color="#3b82f6" size={14} />
              <Text className="text-zinc-400 font-bold text-xs ml-1.5">{notes.length}</Text>
            </View>
            <FlexScoreWidget score={totalSpent} />
          </View>
        </View>

        {/* Title bar */}
        <View className="flex-row items-center gap-3 mt-4">
          <View className="w-10 h-10 bg-emerald-500/15 rounded-xl items-center justify-center border border-emerald-500/20">
            <PenLine color="#10b981" size={20} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold tracking-tight">Smart Notepad</Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Shield color="#f59e0b" size={10} />
              <Text className="text-amber-500/70 text-[10px] font-bold uppercase tracking-widest">AES Encrypted</Text>
            </View>
          </View>
          {/* Wallet mini */}
          <View className="flex-row items-center bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800/50">
            <Coins color="#10b981" size={14} />
            <Text className="text-emerald-400 font-bold text-sm ml-1.5">{formatCurrency(balance)}</Text>
          </View>
        </View>
      </View>

      <View className={`flex-1 ${isDesktop ? 'flex-row' : 'flex-col'}`}>
        
        {/* ═══════════════════ EDITOR PANEL ═══════════════════ */}
        <View className={`${isDesktop ? 'flex-1' : 'flex-1'} bg-zinc-950`}>
          {/* Editor area */}
          <View className="flex-1 px-5 pt-5">
            <TextInput
              className="flex-1 text-zinc-100 text-base text-left"
              placeholder="Start typing your premium thoughts..."
              placeholderTextColor="#3f3f46"
              multiline
              textAlignVertical="top"
              value={currentText}
              onChangeText={setCurrentText}
              style={[
                { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 24 },
                Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {},
              ]}
            />
          </View>
          
          {/* Editor footer */}
          <View className="px-5 pb-4 pt-3 border-t border-zinc-800/40">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1.5">
                  <Lock color="#52525b" size={11} />
                  <Text className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                    {currentText.length} chars
                  </Text>
                </View>
                <View className="w-px h-3 bg-zinc-800" />
                <View className="flex-row items-center gap-1.5">
                  <Shield color="#52525b" size={11} />
                  <Text className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                    Encrypted
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={handleSavePress}
                className={`flex-row items-center gap-2 px-5 py-2.5 rounded-full ${
                  currentText.trim() 
                    ? "bg-amber-500" 
                    : "bg-zinc-800/50"
                }`}
                disabled={!currentText.trim()}
                activeOpacity={0.8}
              >
                <Save color={currentText.trim() ? "#000" : "#52525b"} size={16} />
                <Text className={`font-bold text-sm ${currentText.trim() ? "text-black" : "text-zinc-600"}`}>
                  Save
                </Text>
                {currentText.trim() && (
                  <View className="flex-row items-center bg-amber-600/40 px-2 py-0.5 rounded-full ml-1">
                    <Coins color="#000" size={10} />
                    <Text className="text-black text-[10px] font-black ml-0.5">99</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ═══════════════════ VAULT PANEL ═══════════════════ */}
        <View className={`${isDesktop ? 'w-80 border-l' : 'border-t'} border-zinc-800/60 bg-zinc-900/30`}
          style={!isDesktop ? { maxHeight: 280 } : {}}
        >
          {/* Vault header */}
          <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Lock color="#f59e0b" size={13} />
              <Text className="text-zinc-400 font-bold text-xs uppercase tracking-widest">
                Vault
              </Text>
            </View>
            <View className="bg-zinc-800/80 px-2.5 py-1 rounded-full">
              <Text className="text-zinc-500 text-[10px] font-bold">{notes.length} notes</Text>
            </View>
          </View>

          {notes.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6 pb-8">
              <View className="w-14 h-14 bg-zinc-800/50 rounded-2xl items-center justify-center border border-zinc-700/30 mb-3">
                <FileText color="#52525b" size={24} />
              </View>
              <Text className="text-zinc-500 text-sm font-semibold text-center">No notes yet</Text>
              <Text className="text-zinc-600 text-xs text-center mt-1">
                Your encrypted notes will appear here
              </Text>
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
            >
              {notes.map(note => {
                const isSelected = selectedNoteId === note.id;
                return (
                  <View 
                    key={note.id} 
                    className={`rounded-2xl mb-2.5 overflow-hidden border ${
                      isSelected 
                        ? "bg-blue-500/5 border-blue-500/20" 
                        : "bg-zinc-900/80 border-zinc-800/40"
                    }`}
                  >
                    <TouchableOpacity
                      onPress={() => handleUnlockPress(note)}
                      className="p-3.5"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-2.5">
                        {/* Icon */}
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                          note.isUnlocked ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                        }`}>
                          {note.isUnlocked ? (
                            <Unlock color="#10b981" size={14} />
                          ) : (
                            <Lock color="#f59e0b" size={14} />
                          )}
                        </View>
                        
                        {/* Title + meta */}
                        <View className="flex-1">
                          <Text className="text-zinc-200 font-bold text-sm" numberOfLines={1}>
                            {note.title}
                          </Text>
                          <View className="flex-row items-center gap-2 mt-0.5">
                            <View className="flex-row items-center gap-1">
                              <Clock color="#52525b" size={9} />
                              <Text className="text-zinc-600 text-[10px]">
                                {formatTimeAgo(note.createdAt)}
                              </Text>
                            </View>
                            {!note.isUnlocked && (
                              <View className="flex-row items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                <Coins color="#f59e0b" size={8} />
                                <Text className="text-amber-500 text-[9px] font-bold">50 to unlock</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Arrow / action */}
                        <ChevronRight color="#3f3f46" size={16} />
                      </View>
                      
                      {/* Content preview */}
                      {note.isUnlocked && (
                        <Text 
                          className="text-zinc-500 text-xs mt-2 ml-10"
                          numberOfLines={2}
                          style={{ lineHeight: 18 }}
                        >
                          {note.content}
                        </Text>
                      )}
                      
                      {!note.isUnlocked && (
                        <View className="mt-2 ml-10 bg-zinc-800/50 rounded-lg py-2 px-3 items-center">
                          <Text className="text-amber-500/60 text-[10px] font-bold uppercase tracking-wider">
                            🔐 Encrypted • Tap to Unlock
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    
                    {/* Delete row */}
                    <View className="border-t border-zinc-800/30 flex-row justify-between items-center px-3.5 py-1.5">
                      <Text className="text-zinc-700 text-[10px]">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => handleDeletePress(note.id)}
                        className="flex-row items-center gap-1 px-2 py-1 rounded-full"
                        activeOpacity={0.6}
                      >
                        <Trash2 color="#71717a" size={11} />
                        <Text className="text-zinc-500 text-[10px] font-semibold">
                          {formatCurrency(200)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      <PaymentModal
        visible={paymentConfig.visible}
        title={paymentConfig.title}
        amount={paymentConfig.amount}
        amountString={paymentConfig.amountString}
        cancelText={paymentConfig.cancelText}
        onPay={executePaymentAction}
        onCancel={() => {
          closePayment();
        }}
      />
    </KeyboardAvoidingView>
  );
}
