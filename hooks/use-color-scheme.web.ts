// hooks/use-color-scheme.web.ts
import { useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "light" | "dark" | "system";

export function useColorScheme() {
  const systemScheme = useSystemColorScheme();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(systemScheme ?? "light");
  const [preference, setPreference] = useState<ThemePreference>("system");

  // Mark as hydrated once mounted (avoid SSR mismatch)
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Load saved preference from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("themePreference");
        if (saved === "light" || saved === "dark" || saved === "system") {
          setPreference(saved);
        }
      } catch (e) {
        console.warn("Failed to load themePreference (web):", e);
      }
    })();
  }, []);

  // Update theme based on preference or system mode
  useEffect(() => {
    if (preference === "system") {
      setTheme(systemScheme ?? "light");
    } else {
      setTheme(preference);
    }
  }, [systemScheme, preference]);

  // Save user preference
  const setThemePreference = async (pref: ThemePreference) => {
    try {
      setPreference(pref);
      await AsyncStorage.setItem("themePreference", pref);
    } catch (e) {
      console.warn("Failed to save themePreference (web):", e);
    }
  };

  // If not hydrated yet, fall back to light mode to prevent flicker
  if (!hasHydrated) {
    return { theme: "light", preference: "system", setThemePreference };
  }

  return { theme, preference, setThemePreference };
}

