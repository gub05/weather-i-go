import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// A reusable component for the toggle switches
const ToggleSwitch = ({ label, options, selected, onSelect }) => (
  <View className="flex-row items-center justify-between py-4">
    <Text className="text-base text-gray-700">{label}</Text>
    <View className="flex-row bg-gray-200 rounded-full p-1">
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => onSelect(option)}
          className={`px-4 py-1 rounded-full ${
            selected === option ? "bg-white shadow" : ""
          }`}
        >
          <Text
            className={`font-bold ${
              selected === option ? "text-blue-600" : "text-gray-500"
            }`}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default function SettingsScreen() {
  const [theme, setTheme] = useState("Light");
  const [mapView, setMapView] = useState("3D");
  const [tempUnit, setTempUnit] = useState("C");
  const [recommendations, setRecommendations] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-5 mb-6">
        <Text className="text-3xl font-bold text-gray-800">Settings</Text>
      </View>
      <ScrollView className="px-4">
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <ToggleSwitch
            label="Display"
            options={["Light", "Dark"]}
            selected={theme}
            onSelect={setTheme}
          />
          <View className="border-b border-gray-200" />
          <ToggleSwitch
            label="Map View"
            options={["3D", "2D"]}
            selected={mapView}
            onSelect={setMapView}
          />
          <View className="border-b border-gray-200" />
          <ToggleSwitch
            label="Temperature Units"
            options={["C", "F", "K"]}
            selected={tempUnit}
            onSelect={setTempUnit}
          />
        </View>

        <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <ToggleSwitch
            label="Buy Recommendations"
            options={["ON", "OFF"]}
            selected={recommendations ? "ON" : "OFF"}
            onSelect={(val) => setRecommendations(val === "ON")}
          />
        </View>

        <View className="bg-white rounded-xl shadow-sm p-4">
          <View className="py-3">
            <Text className="text-base text-gray-700">Account</Text>
            <Text className="text-sm text-gray-500">beth@gmail.com</Text>
          </View>
          <View className="border-b border-gray-200" />
          <TouchableOpacity className="py-3 items-center">
            <Text className="text-base text-red-500 font-bold">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
