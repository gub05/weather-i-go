import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function SettingsScreen() {
  const { theme, preference, setThemePreference } = useColorScheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === "dark" ? "#000" : "#fff" },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme === "dark" ? "#fff" : "#000" },
        ]}
      >
        Settings
      </Text>

      <Text
        style={[
          styles.subtitle,
          { color: theme === "dark" ? "#ccc" : "#333" },
        ]}
      >
        Current theme: {preference.toUpperCase()}
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Light Mode" onPress={() => setThemePreference("light")} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Dark Mode" onPress={() => setThemePreference("dark")} />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Use System Default"
          onPress={() => setThemePreference("system")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },
  buttonContainer: {
    width: "80%",
    marginVertical: 8,
  },
});
