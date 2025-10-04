import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function EventsScreen() {
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
    <View className="flex-1 bg-gray-900 p-4">
      <Text className="text-white text-2xl font-bold mb-4">My Events</Text>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="bg-gray-800 p-3 rounded-xl mb-3">
            <Text className="text-white font-semibold">
              {item.weather} - {item.date}
            </Text>
            <Text className="text-gray-400">{item.location}</Text>
            <TouchableOpacity
              className="bg-red-500 p-2 rounded-xl mt-2"
              onPress={() => handleDelete(item.id)}
            >
              <Text className="text-white text-center">Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Text className="text-white text-xl mt-6 mb-2">Recently Deleted</Text>
      <FlatList
        data={recentlyDeleted}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="bg-gray-700 p-3 rounded-xl mb-3">
            <Text className="text-gray-300 font-semibold">
              {item.weather} - {item.date}
            </Text>
            <TouchableOpacity
              className="bg-blue-500 p-2 rounded-xl mt-2"
              onPress={() => handleRestore(item.id)}
            >
              <Text className="text-white text-center">Restore</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
