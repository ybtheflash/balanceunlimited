import "./global.css";
import { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme, useIsFocused } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform, BackHandler, View, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
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
import ZestyAuthScreen from "./src/screens/ZestyAuthScreen";

const Tab = createBottomTabNavigator();

// ─── Tab Navigator ─────────────────────────────────────────────────────────────
function TabNavigator() {
  const { isLoggedIn, user } = useAuth();
  const [activeScreen, setActiveScreen] = useState<string | null>(null);

  const navigation = useNavigation<any>();

  const handleNavigate = useCallback((screen: string) => {
    setActiveScreen(screen);
  }, []);

  const handleBack = useCallback(() => {
    setActiveScreen(null);
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (activeScreen) {
        setActiveScreen(null);
        return true;
      }

      const state = navigation.getState();
      const currentRoute = state?.routes[state.index]?.name;
      if (currentRoute && currentRoute !== "HomeTab") {
        navigation.navigate("HomeTab");
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [activeScreen, navigation]);

  const theme = user?.activeTheme || "dark";

  // Stack-like sub-screens
  if (activeScreen === "Calculator") {
    return <CalculatorScreen onBack={handleBack} onOpenWallet={() => setActiveScreen("Wallet")} />;
  }
  if (activeScreen === "Notepad") {
    return <NotepadScreen onBack={handleBack} />;
  }
  if (activeScreen === "Wallet") {
    return <WalletScreen onBack={handleBack} />;
  }
  if (activeScreen === "ZestyAuth") {
    return <ZestyAuthScreen onBack={handleBack} />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme === "liquidGlass" ? "rgba(15,23,42,0.6)" : (theme === "light" ? "#f8fafc" : "#0a0a0a"),
          borderTopColor: theme === "liquidGlass" ? "rgba(255,255,255,0.08)" : (theme === "light" ? "#e2e8f0" : "#27272a"),
          borderTopWidth: 1,
          elevation: 0,
          height: Platform.OS === "ios" ? 88 : 65,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme === "liquidGlass" ? "#a78bfa" : "#3b82f6",
        tabBarInactiveTintColor: theme === "light" ? "#64748b" : "#52525b",
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
        {() => <TabWrapper>
          <HomeScreen
            onNavigate={handleNavigate}
            onOpenWallet={() => setActiveScreen("Wallet")}
          />
        </TabWrapper>}
      </Tab.Screen>

      <Tab.Screen
        name="LeaderboardTab"
        children={() => <TabWrapper><LeaderboardScreen /></TabWrapper>}
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
        {() => <TabWrapper><WalletScreen onBack={() => navigation.navigate("HomeTab")} /></TabWrapper>}
      </Tab.Screen>

      <Tab.Screen
        name="ProfileTab"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
        }}
      >
        {() => <TabWrapper>
          <ProfileScreen
            onNavigateToStore={() => setActiveScreen("Wallet")}
            onNavigateToZestyAuth={() => setActiveScreen("ZestyAuth")}
          />
        </TabWrapper>}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ─── Root App ───────────────────────────────────────────────────────────────────
function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { isLoggedIn, isGuest, user } = useAuth();

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Not logged in and not guest → show login (handles 2FA flow internally)
  if (!isLoggedIn && !isGuest) {
    return <LoginScreen onGuestContinue={() => { }} />;
  }

  const theme = user?.activeTheme || "dark";

  return (
    <View style={{ flex: 1 }}>
      {/* Theme Background — rendered behind everything */}
      {theme === "liquidGlass" && (
        <LinearGradient
          colors={["#0f172a", "#1e1b4b", "#4c1d95", "#0f172a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {theme === "light" && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#f8fafc" }]} />
      )}
      {theme === "dark" && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#09090b" }]} />
      )}

      <StatusBar style={theme === "light" ? "dark" : "light"} />
      <TabNavigator />
    </View>
  );
}

const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
  },
};

function TabWrapper({ children }: { children: React.ReactNode }) {
  const isFocused = useIsFocused();
  return isFocused ? <>{children}</> : null;
}

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <NavigationContainer theme={TransparentTheme}>
          <AppContent />
        </NavigationContainer>
      </WalletProvider>
    </AuthProvider>
  );
}
