import React, { createContext, useContext, useState, ReactNode } from "react";
import { db } from "../db/instant";
import { generateAppUniqueId } from "../utils/ids";

export interface User {
  id: string;
  appUniqueId: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string; // Key from asset avatars (e.g. "one", "default")
  tier: string;
  realMoneySpent: number;
  kcPurchased: number;
  utilitiesUsed: number;
  adsRemoved: boolean;
  totpEnabled: boolean;
  totpSecret: string;
  activeTheme: "dark" | "light" | "liquidGlass";
  liquidGlassUnlocked: boolean;
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
  // 2FA flow
  pending2FA: { email: string; username: string } | null;
  set2FAPending: (pending: { email: string; username: string } | null) => void;
  complete2FALogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoading: authLoading, user: authUser } = db.useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [pending2FA, setPending2FA] = useState<{ email: string; username: string } | null>(null);
  const [block2FA, setBlock2FA] = useState(false);
  
  const { isLoading: profileLoading, data } = db.useQuery(
    authUser ? { profiles: { $: { where: { id: authUser.id } } } } : null
  );

  const profile = data?.profiles?.[0];

  // Auto-backfill appUniqueId and missing tracking fields for existing users
  React.useEffect(() => {
    if (!profile) return;
    
    let updates: any = {};
    let needsUpdate = false;

    if (!profile.appUniqueId) {
      updates.appUniqueId = generateAppUniqueId();
      needsUpdate = true;
    }
    
    if (profile.realMoneySpent === undefined) { updates.realMoneySpent = 0; needsUpdate = true; }
    if (profile.kcPurchased === undefined) { updates.kcPurchased = 0; needsUpdate = true; }
    if (profile.utilitiesUsed === undefined) { updates.utilitiesUsed = 0; needsUpdate = true; }

    if (needsUpdate) {
      db.transact(db.tx.profiles[profile.id].update(updates));
    }
  }, [profile]);

  // If user has TOTP enabled and hasn't passed 2FA check, block login
  const needs2FA = !!authUser && !!profile?.totpEnabled && block2FA;

  const user: User | null = (authUser && !needs2FA)
    ? {
        id: authUser.id,
        appUniqueId: profile?.appUniqueId || "----------",
        email: authUser.email || "",
        username: profile?.username || (authUser.email ? authUser.email.split("@")[0] : "user"),
        displayName: profile?.displayName || profile?.username || "Newbee",
        avatar: profile?.avatar || "default",
        tier: profile?.tier || "YaBasic",
        realMoneySpent: profile?.realMoneySpent || 0,
        kcPurchased: profile?.kcPurchased || 0,
        utilitiesUsed: profile?.utilitiesUsed || 0,
        adsRemoved: profile?.adsRemoved || false,
        totpEnabled: profile?.totpEnabled || false,
        totpSecret: profile?.totpSecret || "",
        activeTheme: (profile?.activeTheme || "dark") as "dark" | "light" | "liquidGlass",
        liquidGlassUnlocked: profile?.liquidGlassUnlocked || false,
        isGuest: false,
      }
    : null;

  const sendMagicCode = async (email: string) => {
    await db.auth.sendMagicCode({ email });
  };

  const verifyCode = async (email: string, code: string, username: string) => {
    const res = await db.auth.signInWithMagicCode({ email, code });
    if (res.user) {
      const existingProfile = await db.queryOnce({ profiles: { $: { where: { id: res.user.id } } } });
      if (existingProfile.data.profiles.length === 0) {
        // New user — create profile
        const finalUsername = username || email.split("@")[0];
        const halfName = finalUsername.slice(0, Math.max(1, Math.floor(finalUsername.length / 2)));
        
        db.transact(
          db.tx.profiles[res.user.id].update({
            id: res.user.id,
            appUniqueId: generateAppUniqueId(),
            username: finalUsername,
            displayName: "Newbee" + halfName,
            avatar: "default",
            tier: "YaBasic",
            balance: 0,
            totalSpent: 0,
            realMoneySpent: 0,
            kcPurchased: 0,
            utilitiesUsed: 0,
            adsRemoved: false,
            totpEnabled: false,
            totpSecret: "",
            activeTheme: "dark",
            liquidGlassUnlocked: false,
            joinedDate: Date.now(),
          })
        );
        setBlock2FA(false);
      } else {
        // Existing user — check if 2FA is enabled
        const existingUser = existingProfile.data.profiles[0] as any;
        if (existingUser.totpEnabled) {
          setBlock2FA(true);
          setPending2FA({ email, username });
          return; // Don't complete login yet
        }
        setBlock2FA(false);
      }
      setIsGuest(false);
    }
  };

  const complete2FALogin = () => {
    setBlock2FA(false);
    setPending2FA(null);
    setIsGuest(false);
  };

  const logout = () => {
    db.auth.signOut();
    setIsGuest(false);
    setBlock2FA(false);
    setPending2FA(null);
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
        pending2FA,
        set2FAPending: setPending2FA,
        complete2FALogin,
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
