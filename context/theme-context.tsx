import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useSystemColorScheme } from "react-native";

type ThemePreference = "light" | "dark" | "system";
type ThemeContextType = {
  theme: "light" | "dark";
  preference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useSystemColorScheme();
  const [theme, setTheme] = useState<"light" | "dark">(systemScheme ?? "light");
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [loaded, setLoaded] = useState(false);

  // Load saved preference
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("themePreference");
      if (saved === "light" || saved === "dark" || saved === "system") {
        setPreference(saved);
      }
      setLoaded(true);
    })();
  }, []);

  // Update theme whenever system or preference changes
  useEffect(() => {
    if (!loaded) return;
    if (preference === "system") {
      setTheme(systemScheme ?? "light");
    } else {
      setTheme(preference);
    }
  }, [systemScheme, preference, loaded]);

  const setThemePreference = async (pref: ThemePreference) => {
    setPreference(pref);
    await AsyncStorage.setItem("themePreference", pref);
  };

  const contextValue = useMemo(() => ({ theme, preference, setThemePreference }), [theme, preference]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {loaded && children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProviderWrapper");
  return context;
};
