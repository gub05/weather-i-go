import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MultiSlider from '@ptomasroos/react-native-multi-slider';




// Reusable component for the weather condition buttons
const WeatherIconButton = ({ icon, label, selected, onPress }) => (
  <TouchableOpacity onPress={onPress} className={`flex-1 items-center p-2 rounded-lg mx-1 ${selected ? 'bg-blue-200' : 'bg-gray-100'}`}>
    {icon}
    <Text className="text-xs mt-1 text-gray-700">{label}</Text>
  </TouchableOpacity>
);

export default function ExploreScreen() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWeather, setSelectedWeather] = useState("");
  const [temperatureRange, setTemperatureRange] = useState([20, 30]);
  const [location, setLocation] = useState("");

  const userPreferences = {
    id: Date.now(),
    date: selectedDate,
    weather: selectedWeather,
    temperatureRange: temperatureRange,
    location: location,
  };

  const exampleForecast = {
    date: "2025-10-07",
    weather: "Sunny",
    temperature: 28,
    location: "Los Angeles",
  };

  const comparePreferences = (prefs, forecast) => {
    if (!prefs.date || !prefs.weather || !forecast) return null;

    const match =
      prefs.date === forecast.date &&
      prefs.weather === forecast.weather &&
      forecast.temperature >= prefs.temperatureRange[0] &&
      forecast.temperature <= prefs.temperatureRange[1];

    return match
      ? "Weather matches your desired conditions!"
      : "Weather does not match your chosen preferences.";
  };

 const saveEvent = async () => {
  try {
    // 1. Save locally like before
    const existing = await AsyncStorage.getItem("events");
    const events = existing ? JSON.parse(existing) : [];
    await AsyncStorage.setItem(
      "events",
      JSON.stringify([...events, userPreferences])
    );

    // 2. Call backend API with user preferences
    const response = await fetch(
      `http://localhost:5000/api/weather/explain?location=${location}&date=${selectedDate}&desiredTemp=${temperatureRange[1]}&desiredCondition=${selectedWeather}&desiredHumidity=70`
    );

    const data = await response.json();
    console.log("Backend AI Response:", data);

    alert("Event saved successfully with AI check!");
  } catch (error) {
    console.error("Error saving event:", error);
  }
};


  const weatherOptions = [
    "Sunny",
    "Partly Cloudy",
    "Cloudy",
    "Rainy",
    "Thunderstorm",
    "Night",
  ];

  return (
    <ScrollView className="flex-1 bg-gray-900 p-4">
      <Text className="text-white text-2xl font-bold mb-4">Explore</Text>

      {/* Date Picker */}
      <Text className="text-white mb-2">Select Date:</Text>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          [selectedDate]: {
            selected: true,
            marked: true,
            selectedColor: "#3b82f6",
          },
        }}
      />

      {/* Weather Condition Buttons */}
      <Text className="text-white mt-4 mb-2">Desired Weather:</Text>
      <View className="flex-row flex-wrap gap-2">
        {weatherOptions.map((option) => (
          <TouchableOpacity
            key={option}
            className={`px-4 py-2 rounded-xl ${
              selectedWeather === option ? "bg-blue-500" : "bg-gray-700"
            }`}
            onPress={() => setSelectedWeather(option)}
          >
            <Text className="text-white">{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Temperature Range Slider */}
      <Text className="text-white mt-4 mb-2">
        Select Temperature Range (°C):
      </Text>
      <View className="items-center">
        <Text className="text-white mb-2">
          {temperatureRange[0]}°C - {temperatureRange[1]}°C
        </Text>
        <MultiSlider
          values={temperatureRange}
          min={-20}
          max={50}
          step={1}
          sliderLength={300}
          onValuesChange={(values) => setTemperatureRange(values)}
          selectedStyle={{ backgroundColor: "#3b82f6" }}
          unselectedStyle={{ backgroundColor: "#374151" }}
          markerStyle={{ backgroundColor: "#3b82f6" }}
        />
      </View>

      {/* Location Input */}
      <Text className="text-white mt-4 mb-2">Search Location:</Text>
      <TextInput
        className="bg-gray-800 text-white p-3 rounded-xl"
        placeholder="Enter location"
        placeholderTextColor="#aaa"
        value={location}
        onChangeText={setLocation}
      />

      {/* Placeholder for Map Integration */}
      <View className="my-6 h-80 bg-gray-700 rounded-xl items-center justify-center">
        <Text className="text-white text-center px-4">
          Interactive Google Earth Map Integration Space Reserved
        </Text>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        className="bg-green-500 rounded-xl p-3 mb-10"
        onPress={saveEvent}
      >
        <Text className="text-center text-white font-semibold">Save Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
