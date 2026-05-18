import React, { createContext, useContext, useState, ReactNode } from "react";
import { id } from '@instantdb/react-native';

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

// ─── Simple Local Wallet for Development ──────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(1000); // Start with 1000 KC
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const spend = (amount: number, description: string): boolean => {
    if (balance < amount) return false;
    setBalance(prev => prev - amount);
    setTotalSpent(prev => prev + amount);
    setTransactions(prev => [
      { id: Date.now().toString(), type: "spend", amount, description, timestamp: Date.now() },
      ...prev,
    ]);
    return true;
  };

  const topup = (amount: number) => {
    setBalance(prev => prev + amount);
    setTransactions(prev => [
      { id: Date.now().toString(), type: "topup", amount, description: "Wallet Top-up", timestamp: Date.now() },
      ...prev,
    ]);
  };

  const canAfford = (amount: number): boolean => balance >= amount;

  return (
    <WalletContext.Provider value={{ balance, totalSpent, transactions, spend, topup, canAfford }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
