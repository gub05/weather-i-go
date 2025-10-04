// app/hooks/use-color-scheme.ts
import { useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "light" | "dark" | "system";

export function useColorScheme() {
  const systemScheme = useSystemColorScheme();
  const [theme, setTheme] = useState<"light" | "dark">(systemScheme ?? "light");
  const [preference, setPreference] = useState<ThemePreference>("system");

  // Load saved preference
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("themePreference");
      if (saved === "light" || saved === "dark" || saved === "system") {
        setPreference(saved);
      }
    })();
  }, []);

  // Update theme when system or preference changes
  useEffect(() => {
    if (preference === "system") {
      setTheme(systemScheme ?? "light");
    } else {
      setTheme(preference);
    }
  }, [systemScheme, preference]);

  // Save preference
  const setThemePreference = async (pref: ThemePreference) => {
    setPreference(pref);
    await AsyncStorage.setItem("themePreference", pref);
  };

  return { theme, preference, setThemePreference };
}
