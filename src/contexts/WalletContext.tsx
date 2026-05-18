import React, { createContext, useContext, ReactNode } from "react";
import { id } from "@instantdb/react-native";
import { db } from "../db/instant";
import { useAuth } from "./AuthContext";
import { getTierFromSpent } from "../utils/tier";

export interface Transaction {
  id: string;
  type: "topup" | "spend";
  amount: number; // KC
  description: string;
  timestamp: number;
}

interface WalletContextType {
  balance: number;
  totalSpent: number;
  transactions: Transaction[];
  spend: (amount: number, description: string) => boolean;
  topup: (amountPaid: number, kcReceived: number) => void;
  canAfford: (amount: number) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const { data: profileData } = db.useQuery(
    user ? { profiles: { $: { where: { id: user.id } } } } : null
  );
  
  const { data: txData } = db.useQuery(
    user ? { transactions: { $: { where: { userId: user.id } } } } : null
  );

  const profile = profileData?.profiles?.[0];
  const balance = Math.floor(profile?.balance || 0);
  const totalSpent = Math.floor(profile?.totalSpent || 0);
  const transactions = ((txData?.transactions || []) as Transaction[]).sort((a, b) => b.timestamp - a.timestamp);

  const spend = (amount: number, description: string): boolean => {
    const roundedAmount = Math.floor(amount);
    if (!user || balance < roundedAmount) return false;
    
    const newTotalSpent = totalSpent + roundedAmount;
    const newTier = getTierFromSpent(newTotalSpent);
    const newTxId = id();

    db.transact([
      db.tx.profiles[user.id].update({
        balance: balance - roundedAmount,
        totalSpent: newTotalSpent,
        tier: newTier
      }),
      db.tx.transactions[newTxId].update({
        id: newTxId,
        userId: user.id,
        type: "spend",
        amount: roundedAmount,
        description,
        timestamp: Date.now()
      })
    ]);
    return true;
  };

  const topup = (amountPaid: number, kcReceived: number) => {
    if (!user) return;

    const roundedKc = Math.floor(kcReceived);
    const newTxId = id();

    db.transact([
      db.tx.profiles[user.id].update({
        balance: balance + roundedKc
      }),
      db.tx.transactions[newTxId].update({
        id: newTxId,
        userId: user.id,
        type: "topup",
        amount: roundedKc,
        description: `Wallet Top-up: Paid ₹${amountPaid} for ${roundedKc} KC`,
        timestamp: Date.now()
      })
    ]);
  };

  const canAfford = (amount: number): boolean => balance >= Math.floor(amount);

  return (
    <WalletContext.Provider
      value={{ balance, totalSpent, transactions, spend, topup, canAfford }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
