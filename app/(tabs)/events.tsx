import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Mock data for events, now with a unique `id` for each item
const events = [
  {
    id: "1",
    name: "Calles Bday",
    date: "Jan 27",
    condition: "GOOD",
    color: "bg-green-100",
    textColor: "text-green-700",
  },
  {
    id: "2",
    name: "Hiking Trip",
    date: "Jan 1",
    condition: "UNFAVORABLE",
    color: "bg-red-100",
    textColor: "text-red-700",
  },
  {
    id: "3",
    name: "Pool Party",
    date: "Jan 30",
    condition: "UNFAVORABLE",
    color: "bg-red-100",
    textColor: "text-red-700",
  },
  {
    id: "4",
    name: "Beach Day",
    date: "Feb 12",
    condition: "GOOD",
    color: "bg-green-100",
    textColor: "text-green-700",
  },
];

export default function MyEventsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-5">
        <Text className="text-3xl font-bold text-gray-800">My Events</Text>
        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-full p-3 my-4 border border-gray-200 shadow-sm">
          <FontAwesome name="search" size={16} color="gray" />
          <TextInput
            placeholder="Search event..."
            className="flex-1 ml-3 text-base"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Sort Button */}
        <View className="flex-row justify-end mb-4">
          <TouchableOpacity className="bg-white border border-gray-200 rounded-full px-4 py-2 flex-row items-center">
            <Text className="text-gray-700">Sort By: Recents</Text>
            <FontAwesome
              name="chevron-down"
              size={12}
              color="gray"
              className="ml-2"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="px-4">
        {events.map((event) => (
          <View
            key={event.id} // Corrected: Using the unique event ID as the key
            className="bg-white rounded-xl shadow-sm p-4 mb-3 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-lg font-bold text-gray-800">
                {event.name}
              </Text>
              <Text className="text-sm text-gray-500">{event.date}</Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${event.color}`}>
              <Text className={`font-bold text-xs ${event.textColor}`}>
                {event.condition}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
