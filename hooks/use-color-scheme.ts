import { useColorScheme as _useSystemColorScheme } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system"

export function useColorScheme() {
    const systemScheme = _useSystemColorScheme();
    const [theme, setTheme] = useState<"light" | "dark">(systemScheme ?? "light");
    const [preference, setPreference] = useState<ThemePreference>("system");

    useEffect(() => {
        (async () => {
            const saved = await AsyncStorage.getItem("themePreference");
            if (saved === "light" || saved === "dark" || saved == "system") {
                setPreference(saved);
            }
        })();
    }, []);

     useEffect (() => {
        if (preference === "system") {
            setTheme(systemScheme ?? "light");
        } else {
            setTheme(preference);
        }
    }, [systemScheme, preference]);

    const setThemePreference = async (pref: ThemePreference) => {
        setPreference(pref);
        await AsyncStorage.setItem("themePreference", pref);
    };

    return { theme, preference, setThemePreference }

}


