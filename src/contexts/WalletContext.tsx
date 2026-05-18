import React, { createContext, useContext, ReactNode } from "react";
import { db } from "../db/instant";
import { useAuth } from "./AuthContext";

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
  topup: (amount: number) => void;
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
  const balance = profile?.balance || 0;
  const totalSpent = profile?.totalSpent || 0;
  const transactions = (txData?.transactions || []).sort((a, b) => b.timestamp - a.timestamp);

  const spend = (amount: number, description: string): boolean => {
    if (!user || balance < amount) return false;
    
    const newTxId = db.id();
    db.transact([
      db.tx.profiles[user.id].update({
        balance: balance - amount,
        totalSpent: totalSpent + amount
      }),
      db.tx.transactions[newTxId].update({
        id: newTxId,
        userId: user.id,
        type: "spend",
        amount,
        description,
        timestamp: Date.now()
      })
    ]);
    return true;
  };

  const topup = (amount: number) => {
    if (!user) return;

    const newTxId = db.id();
    db.transact([
      db.tx.profiles[user.id].update({
        balance: balance + amount
      }),
      db.tx.transactions[newTxId].update({
        id: newTxId,
        userId: user.id,
        type: "topup",
        amount,
        description: "Wallet Top-up via Razorpay",
        timestamp: Date.now()
      })
    ]);
  };

  const canAfford = (amount: number): boolean => balance >= amount;

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
