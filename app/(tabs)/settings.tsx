import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const [theme, setTheme] = useState("dark");
  const [unit, setUnit] = useState("Celsius");

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await AsyncStorage.getItem("settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setTheme(parsed.theme);
        setUnit(parsed.unit);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (newTheme, newUnit) => {
    const newSettings = { theme: newTheme, unit: newUnit };
    await AsyncStorage.setItem("settings", JSON.stringify(newSettings));
  };

  return (
    <View className="flex-1 bg-gray-900 p-4">
      <Text className="text-white text-2xl font-bold mb-4">Settings</Text>

      <Text className="text-white mb-2">Theme Mode:</Text>
      <View className="flex-row mb-4">
        {["dark", "light"].map((mode) => (
          <TouchableOpacity
            key={mode}
            className={`flex-1 p-3 rounded-xl ${
              theme === mode ? "bg-blue-500" : "bg-gray-700"
            } mr-2`}
            onPress={() => {
              setTheme(mode);
              saveSettings(mode, unit);
            }}
          >
            <Text className="text-center text-white capitalize">{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-white mb-2">Temperature Unit:</Text>
      <View className="flex-row mb-4">
        {["Celsius", "Fahrenheit", "Kelvin"].map((u) => (
          <TouchableOpacity
            key={u}
            className={`flex-1 p-3 rounded-xl ${
              unit === u ? "bg-blue-500" : "bg-gray-700"
            } mr-2`}
            onPress={() => {
              setUnit(u);
              saveSettings(theme, u);
            }}
          >
            <Text className="text-center text-white">{u}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="bg-gray-800 p-3 rounded-xl">
        <Text className="text-white text-sm">Settings (JSON):</Text>
        <Text className="text-green-400 text-xs mt-2">
          {JSON.stringify({ theme, unit }, null, 2)}
        </Text>
      </View>
    </View>
  );
}
