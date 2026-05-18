import "./global.css";
import React, { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, Platform } from "react-native";
import { Home, Trophy, Wallet, User } from "lucide-react-native";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { WalletProvider } from "./src/contexts/WalletContext";

import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CalculatorScreen from "./src/screens/CalculatorScreen";
import NotepadScreen from "./src/screens/NotepadScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import WalletScreen from "./src/screens/WalletScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab Navigator ─────────────────────────────────────────────────────────────
function TabNavigator() {
  const { isLoggedIn } = useAuth();
  const [activeScreen, setActiveScreen] = useState<string | null>(null);

  // Stack-like navigation within tabs
  const handleNavigate = useCallback((screen: string) => {
    setActiveScreen(screen);
  }, []);

  const handleBack = useCallback(() => {
    setActiveScreen(null);
  }, []);

  // If a utility screen is active, render it full-screen instead of tabs
  if (activeScreen === "Calculator") {
    return <CalculatorScreen onBack={handleBack} onOpenWallet={() => setActiveScreen("Wallet")} />;
  }
  if (activeScreen === "Notepad") {
    return <NotepadScreen onBack={handleBack} />;
  }
  if (activeScreen === "Wallet") {
    return <WalletScreen onBack={handleBack} />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#27272a",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 65,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#52525b",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} />,
        }}
      >
        {() => (
          <HomeScreen
            onNavigate={handleNavigate}
            onOpenWallet={() => setActiveScreen("Wallet")}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: "Leaderboard",
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size - 2} />,
        }}
      />

      <Tab.Screen
        name="WalletTab"
        options={{
          tabBarLabel: "Wallet",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size - 2} />,
          tabBarButton: isLoggedIn ? undefined : () => null,
        }}
      >
        {() => <WalletScreen onBack={() => { }} />}
      </Tab.Screen>

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root App ───────────────────────────────────────────────────────────────────
function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { isLoggedIn, isGuest } = useAuth();

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Not logged in and not guest → show login
  if (!isLoggedIn && !isGuest) {
    return <LoginScreen onGuestContinue={() => { }} />;
  }

  return <TabNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppContent />
        </NavigationContainer>
      </WalletProvider>
    </AuthProvider>
  );
}
