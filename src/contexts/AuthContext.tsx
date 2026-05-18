import React, { createContext, useContext, useState, ReactNode } from "react";
import { db } from "../db/instant";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  tier: string;
  adsRemoved: boolean;
  isGuest: boolean;
}

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isLoggedIn: boolean;
  sendMagicCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string, username: string) => Promise<void>;
  logout: () => void;
  continueAsGuest: () => void;
  promptLogin: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoading: authLoading, user: authUser } = db.useAuth();
  const [isGuest, setIsGuest] = useState(false);
  
  // Fetch user profile from DB if logged in
  const { isLoading: profileLoading, data } = db.useQuery(
    authUser ? { profiles: { $: { where: { id: authUser.id } } } } : null
  );

  const profile = data?.profiles?.[0];

  const user: User | null = authUser
    ? {
        id: authUser.id,
        email: authUser.email || "",
        username: profile?.username || (authUser.email ? authUser.email.split("@")[0] : "user"),
        displayName: profile?.displayName || profile?.username || "Newbee",
        avatar: profile?.avatar || "🧑‍💻",
        tier: profile?.tier || "YaBasic",
        adsRemoved: profile?.adsRemoved || false,
        isGuest: false,
      }
    : null;

  const sendMagicCode = async (email: string) => {
    await db.auth.sendMagicCode({ email });
  };

  const verifyCode = async (email: string, code: string, username: string) => {
    const res = await db.auth.signInWithMagicCode({ email, code });
    if (res.user) {
      // Check if profile exists, if not create one
      const existingProfile = await db.queryOnce({ profiles: { $: { where: { id: res.user.id } } } });
      if (existingProfile.data.profiles.length === 0) {
        const finalUsername = username || email.split("@")[0];
        const halfName = finalUsername.slice(0, Math.max(1, Math.floor(finalUsername.length / 2)));
        
        db.transact(
          db.tx.profiles[res.user.id].update({
            id: res.user.id,
            username: finalUsername,
            displayName: "Newbee" + halfName,
            avatar: "🧑‍💻",
            tier: "YaBasic",
            balance: 0,
            totalSpent: 0,
            adsRemoved: false,
            joinedDate: Date.now(),
          })
        );
      }
      setIsGuest(false);
    }
  };

  const logout = () => {
    db.auth.signOut();
    setIsGuest(false);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  const promptLogin = () => {
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isLoggedIn: !!user && !user.isGuest,
        sendMagicCode,
        verifyCode,
        logout,
        continueAsGuest,
        promptLogin,
        isLoading: authLoading || profileLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
