import React, { createContext, useContext, useMemo } from "react";
import { ColorSchemeName } from "react-native";

type Theme = {
  scheme: ColorSchemeName;
  colors: {
    bg: string;
    panel: string;
    text: string;
    subtext: string;
    border: string;
    accent: string;
    danger: string;
    success: string;
  };
};

const DarkTheme: Theme = {
  scheme: "dark",
  colors: {
    bg: "#0B0F14",
    panel: "#101722",
    text: "#E6EDF6",
    subtext: "#9FB0C4",
    border: "#1C2736",
    accent: "#4DA3FF",
    danger: "#FF5A6A",
    success: "#2FD187"
  }
};

const ThemeContext = createContext<Theme>(DarkTheme);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => DarkTheme, []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

