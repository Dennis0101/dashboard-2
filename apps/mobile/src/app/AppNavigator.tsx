import React, { useEffect, useState } from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getSessionToken } from "../state/session";
import { LoginScreen } from "../screens/LoginScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ChartScreen } from "../screens/ChartScreen";
import { TradesScreen } from "../screens/TradesScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useTheme } from "./theme";

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Root = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

export function AppNavigator() {
  const { colors } = useTheme();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const t = await getSessionToken();
      setIsAuthed(Boolean(t));
    })();
  }, []);

  if (isAuthed === null) return null;

  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.bg,
          card: colors.panel,
          text: colors.text,
          border: colors.border,
          primary: colors.accent
        }
      }}
    >
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {isAuthed ? (
          <Root.Screen name="Main">
            {() => <MainTabs onLogout={() => setIsAuthed(false)} />}
          </Root.Screen>
        ) : (
          <Root.Screen name="Auth">
            {() => <LoginScreen onLoggedIn={() => setIsAuthed(true)} />}
          </Root.Screen>
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

function MainTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="Dashboard"
        children={() => <DashboardScreen onLogout={onLogout} />}
      />
      <Tabs.Screen name="Chart" component={ChartScreen} />
      <Tabs.Screen name="Trades" component={TradesScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

