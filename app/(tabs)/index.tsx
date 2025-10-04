import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

// Reusable component for the weather condition buttons
const WeatherIconButton = ({ icon, label, selected, onPress }) => (
  <TouchableOpacity onPress={onPress} className={`flex-1 items-center p-2 rounded-lg mx-1 ${selected ? 'bg-blue-200' : 'bg-gray-100'}`}>
    {icon}
    <Text className="text-xs mt-1 text-gray-700">{label}</Text>
  </TouchableOpacity>
);

export default function ExploreScreen() {
  const [condition, setCondition] = useState('Sunny');

  return (
    <View className="flex-1">
      {/* Background Map Placeholder */}
      <View className="absolute inset-0 bg-blue-300 items-center justify-center">
        <FontAwesome5 name="globe-americas" size={150} color="rgba(255, 255, 255, 0.3)" />
        <Text className="text-white/50 text-2xl font-bold mt-4">Map Interface</Text>
      </View>

      {/* UI Overlay */}
      <ScrollView contentContainerStyle={{ paddingTop: 60, paddingBottom: 20 }} className="p-4">
        <View className="bg-white/95 rounded-2xl shadow-lg p-4 backdrop-blur-sm">
          {/* Header */}
          <Text className="text-center text-3xl font-bold text-gray-800 mb-2">
            Weather I Go
          </Text>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-full p-3 mb-4 border border-gray-200">
            <FontAwesome name="search" size={16} color="gray" />
            <TextInput
              placeholder="Search location..."
              className="flex-1 ml-3 text-base"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Desired Condition */}
          <View className="mb-4">
            <Text className="font-bold text-lg text-gray-700 mb-2">Desired Condition</Text>
            <View className="flex-row justify-around">
              <WeatherIconButton
                icon={<FontAwesome5 name="sun" size={24} color="#F59E0B" />}
                label="Sunny" selected={condition === 'Sunny'} onPress={() => setCondition('Sunny')}
              />
              <WeatherIconButton
                icon={<FontAwesome5 name="cloud" size={24} color="#6B7280" />}
                label="Cloudy" selected={condition === 'Cloudy'} onPress={() => setCondition('Cloudy')}
              />
              <WeatherIconButton
                icon={<FontAwesome5 name="cloud-showers-heavy" size={24} color="#3B82F6" />}
                label="Rainy" selected={condition === 'Rainy'} onPress={() => setCondition('Rainy')}
              />
              <WeatherIconButton
                icon={<MaterialCommunityIcons name="weather-night" size={24} color="#4B5563" />}
                label="Night" selected={condition === 'Night'} onPress={() => setCondition('Night')}
              />
            </View>
          </View>

          {/* Temperature Slider */}
          <View>
            <Text className="font-bold text-lg text-gray-700 mb-2">Desired Temperature (°C)</Text>
            <View className="h-12 bg-gray-100 border border-gray-200 rounded-lg items-center justify-center">
              <Text className="text-gray-500">[Temperature Slider: 15°C - 25°C]</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}