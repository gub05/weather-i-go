import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";

// This component defines the layout for the tab navigator.
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = {
    light: {
      tabBarActiveTintColor: "#007AFF", // A nice blue for active tabs
      tabBarInactiveTintColor: "#8E8E93", // Standard iOS gray for inactive tabs
      tabBarBackground: "#FFFFFF",
    },
    dark: {
      tabBarActiveTintColor: "#0A84FF",
      tabBarInactiveTintColor: "#7C7C7E",
      tabBarBackground: "#1C1C1E",
    },
  };
  const currentColors = colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentColors.tabBarActiveTintColor,
        tabBarInactiveTintColor: currentColors.tabBarInactiveTintColor,
        tabBarStyle: {
          backgroundColor: currentColors.tabBarBackground,
        },
        headerShown: false, // Hides the default header for a cleaner look
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="map-marked-alt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        // index.tsx is the file for this route
        name="events"
        options={{
          title: "My Events",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="calendar-check" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
