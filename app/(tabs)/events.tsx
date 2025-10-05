import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/theme-context";
import { Colors } from "@/constants/theme";

export default function EventsScreen() {
  const { theme } = useTheme();
  const colors = theme === "dark" ? Colors.dark : Colors.light;

  const [events, setEvents] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      const saved = await AsyncStorage.getItem("events");
      if (saved) setEvents(JSON.parse(saved));
    };
    loadEvents();
  }, []);

  const handleDelete = async (id) => {
    const eventToDelete = events.find((e) => e.id === id);
    const updatedEvents = events.filter((e) => e.id !== id);
    setEvents(updatedEvents);
    setRecentlyDeleted([...recentlyDeleted, eventToDelete]);
    await AsyncStorage.setItem("events", JSON.stringify(updatedEvents));
  };

  const handleRestore = async (id) => {
    const eventToRestore = recentlyDeleted.find((e) => e.id === id);
    const updatedDeleted = recentlyDeleted.filter((e) => e.id !== id);
    const updatedEvents = [...events, eventToRestore];
    setRecentlyDeleted(updatedDeleted);
    setEvents(updatedEvents);
    await AsyncStorage.setItem("events", JSON.stringify(updatedEvents));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
        My Events
      </Text>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: theme === "dark" ? "#1f1f1f" : "#f5f5f5",
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {item.weather} - {item.date}
            </Text>
            <Text style={{ color: theme === "dark" ? "#aaa" : "#555" }}>
              {item.location}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#e63946",
                paddingVertical: 8,
                borderRadius: 12,
                marginTop: 8,
              }}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Text style={{ color: colors.text, fontSize: 20, marginTop: 24, marginBottom: 8 }}>
        Recently Deleted
      </Text>

      <FlatList
        data={recentlyDeleted}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: theme === "dark" ? "#2b2b2b" : "#eaeaea",
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {item.weather} - {item.date}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.tint,
                paddingVertical: 8,
                borderRadius: 12,
                marginTop: 8,
              }}
              onPress={() => handleRestore(item.id)}
            >
              <Text style={{ color: colors.background, textAlign: "center" }}>
                Restore
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
