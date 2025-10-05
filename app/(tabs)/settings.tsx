import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "@/context/theme-context";
import { Colors } from "@/constants/theme";

const ToggleSwitch = ({ label, options, selected, onSelect, textColor, tintColor }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
    <Text style={{ color: textColor, fontSize: 16 }}>{label}</Text>
    <View style={{ flexDirection: "row", backgroundColor: tintColor + "33", borderRadius: 9999, padding: 4 }}>
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
  const { theme, preference, setThemePreference } = useTheme();
  const colors = theme === "dark" ? Colors.dark : Colors.light;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 40 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 20 }}>
        Settings
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
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
          <TouchableOpacity style={{ alignItems: "center", paddingVertical: 12 }}>
            <Text style={{ color: "#e63946", fontWeight: "bold", fontSize: 16 }}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
