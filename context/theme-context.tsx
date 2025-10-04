// context/ThemeContext.tsx
import React, { createContext, useContext } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";

const ThemeContext = createContext(null);

export function ThemeProviderWrapper({ children }) {
  const { theme, preference, setThemePreference } = useColorScheme();

  return (
    <ThemeContext.Provider value={{ theme, preference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProviderWrapper");
  }
  return context;
}
