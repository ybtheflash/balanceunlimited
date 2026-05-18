import React, { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  tier: string;
  isGuest: boolean;
  isDevAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isLoggedIn: boolean;
  sendMagicCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string, username: string) => Promise<void>;
  logout: () => void;
  continueAsGuest: () => void;
  devLogin: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // HARDCODED DEV ACCOUNT FOR DEVELOPMENT BYPASS
  const [user, setUser] = useState<User | null>({
    id: "admin-001",
    email: "admin@balanceunlimited.app",
    username: "Dev Admin",
    avatar: "👑",
    tier: "Whale",
    isGuest: false,
    isDevAdmin: true,
  });
  const [isGuest, setIsGuest] = useState(false);

  const sendMagicCode = async (email: string) => {
    console.log("Mock send magic code to", email);
  };

  const verifyCode = async (email: string, code: string, username: string) => {
    console.log("Mock verify code", code);
    setUser({
      id: "user-" + Date.now(),
      email,
      username: username || email.split("@")[0],
      avatar: "🧑‍💻",
      tier: "Ya Basic",
      isGuest: false,
    });
    setIsGuest(false);
  };

  const logout = () => {
    setUser(null);
    setIsGuest(false);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  const devLogin = () => {
    setUser({
      id: "admin-001",
      email: "admin@balanceunlimited.app",
      username: "Dev Admin",
      avatar: "👑",
      tier: "Whale",
      isGuest: false,
      isDevAdmin: true,
    });
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
        devLogin,
        isLoading: false,
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
