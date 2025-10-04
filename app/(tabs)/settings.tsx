import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

const ToggleSwitch = ({ label, options, selected, onSelect, textColor, tintColor }) => (
  <View className="flex-row items-center justify-between py-4">
    <Text style={{ color: textColor }} className="text-base">
      {label}
    </Text>
    <View className="flex-row rounded-full p-1" style={{ backgroundColor: tintColor + "33" }}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => onSelect(option)}
          style={{
            backgroundColor: selected === option ? tintColor : "transparent",
            borderRadius: 9999,
            paddingVertical: 6,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              color: selected === option ? Colors.light.background : textColor,
            }}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default function SettingsScreen() {
  const { theme, preference, setThemePreference } = useColorScheme();
  const colors = theme === "dark" ? Colors.dark : Colors.light;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 20, marginBottom: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text }}>
          Settings
        </Text>
      </View>

      <ScrollView style={{ paddingHorizontal: 16 }}>
        <View
          style={{
            backgroundColor: theme === "dark" ? "#1e1f20" : "#fff",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <ToggleSwitch
            label="Display"
            options={["Light", "Dark", "System"]}
            selected={
              preference === "light"
                ? "Light"
                : preference === "dark"
                ? "Dark"
                : "System"
            }
            onSelect={(val) => {
              const selected =
                val === "Light" ? "light" : val === "Dark" ? "dark" : "system";
              setThemePreference(selected);
            }}
            textColor={colors.text}
            tintColor={colors.tint}
          />
        </View>

        <View
          style={{
            backgroundColor: theme === "dark" ? "#1e1f20" : "#fff",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <TouchableOpacity className="py-3 items-center">
            <Text style={{ color: "#e63946", fontWeight: "bold", fontSize: 16 }}>
              Log Out
            </Text>
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
