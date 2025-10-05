import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeType = "light" | "dark" | "system";

export interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: {
    background: string;
    text: string;
    tint: string;
  };
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  colors: {
    background: "#fff",
    text: "#000",
    tint: "#007AFF",
  },
});

export const Colors = {
  light: {
    background: "#FFFFFF",
    text: "#000000",
    tint: "#007AFF",
  },
  dark: {
    background: "#121212",
    text: "#FFFFFF",
    tint: "#0A84FF",
  },
  system: {
    background: "#b8f2e6", // your requested color
    text: "#faf3dd",       // your requested color
    tint: "#007AFF",
  },
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeType>("light");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("theme");
        if (saved) setTheme(saved as ThemeType);
      } catch (err) {
        console.error("Error loading theme:", err);
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("theme", theme);
  }, [theme]);

  const colors =
    theme === "dark"
      ? Colors.dark
      : theme === "system"
      ? Colors.system
      : Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
