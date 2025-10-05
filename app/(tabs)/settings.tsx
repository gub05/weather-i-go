import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/theme-context";
import { Colors } from "@/constants/theme";

export default function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const colors =
    theme === "dark"
      ? Colors.dark
      : theme === "system"
      ? Colors.system
      : Colors.light;

  const [unit, setUnit] = useState("C");

  useEffect(() => {
    (async () => {
      try {
        const savedSettings = await AsyncStorage.getItem("settings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.unit) setUnit(parsed.unit);
          if (parsed.theme) setTheme(parsed.theme);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    })();
  }, []);

  const saveSettings = async (newTheme: string, newUnit: string) => {
    try {
      const settings = { theme: newTheme, unit: newUnit };
      await AsyncStorage.setItem("settings", JSON.stringify(settings));
      Alert.alert("✅ Settings saved!");
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

const handleThemeChange = (selectedTheme: "light" | "dark" | "system") => {
    setTheme(selectedTheme);
    saveSettings(selectedTheme, unit);
  };

  const toggleUnit = () => {
    const newUnit = unit === "C" ? "F" : unit === "F" ? "K" : "C";
    setUnit(newUnit);
    saveSettings(theme, newUnit);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24 }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          color: colors.text,
          marginBottom: 24,
        }}
      >
        ⚙️ Settings
      </Text>

      {/* THEME SELECTION */}
      <View
        style={{
          backgroundColor: theme === "dark" ? "#1e1f20" : "#fff",
          padding: 16,
          borderRadius: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: theme === "dark" ? "#444" : "#ddd",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Theme
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {(["light", "dark", "system"] as const).map((mode) => (

            <TouchableOpacity
              key={mode}
              onPress={() => handleThemeChange(mode)}
              style={{
                backgroundColor:
                  theme === mode ? colors.tint : theme === "dark" ? "#333" : "#f2f2f2",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: theme === mode ? colors.background : colors.text,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* TEMPERATURE UNIT */}
      <View
        style={{
          backgroundColor: theme === "dark" ? "#1e1f20" : "#fff",
          padding: 16,
          borderRadius: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: theme === "dark" ? "#444" : "#ddd",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Temperature Unit
        </Text>

        <TouchableOpacity
          onPress={toggleUnit}
          style={{
            backgroundColor: colors.tint,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: colors.background,
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            Current: °{unit} — Tap to Change
          </Text>
        </TouchableOpacity>
      </View>

      {/* RESET SETTINGS */}
      <View
        style={{
          backgroundColor: theme === "dark" ? "#1e1f20" : "#fff",
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme === "dark" ? "#444" : "#ddd",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Reset Settings
        </Text>

        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.removeItem("settings");
            setTheme("light");
            setUnit("C");
            Alert.alert("🔄 Settings reset to default!");
          }}
          style={{
            backgroundColor: "#ef4444",
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: "#fff",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            Reset All
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
