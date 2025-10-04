import MultiSlider from "@ptomasroos/react-native-multi-slider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

export default function ExploreScreen() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWeather, setSelectedWeather] = useState("");
  const [temperatureRange, setTemperatureRange] = useState([20, 30]);
  const [location, setLocation] = useState("");
  const [unit, setUnit] = useState("C");
  const [modalVisible, setModalVisible] = useState(false);
  const [favorModal, setFavorModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await AsyncStorage.getItem("settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUnit(parsed.unit || "C");
      }
    };
    loadSettings();
  }, []);

  // Conversion helpers
  const convertCelsius = (v, toUnit) =>
    toUnit === "F" ? (v * 9) / 5 + 32 : toUnit === "K" ? v + 273.15 : v;
  const displayValue = (v) => `${convertCelsius(v, unit).toFixed(1)}°${unit}`;

  // Save Event
  const saveEvent = async () => {
    try {
      const existing = await AsyncStorage.getItem("events");
      const events = existing ? JSON.parse(existing) : [];
      const newEvent = {
        id: Date.now(),
        date: selectedDate,
        weather: selectedWeather,
        temperatureRange: temperatureRange.map((v) =>
          convertCelsius(v, unit).toFixed(1)
        ),
        unit,
        location,
      };
      await AsyncStorage.setItem(
        "events",
        JSON.stringify([...events, newEvent])
      );
      alert("Event saved!");
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  // Simulate favorability check (placeholder)
  const handleCalculate = () => {
    setFavorModal(true);
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  const weatherOptions = [
    { label: "Sunny", icon: "☀️" },
    { label: "Partly Cloudy", icon: "🌤️" },
    { label: "Cloudy", icon: "☁️" },
    { label: "Rainy", icon: "🌧️" },
    { label: "Stormy", icon: "⛈️" },
    { label: "Night", icon: "🌙" },
  ];

  return (
    <ScrollView
      className="flex-1 bg-blue-200"
      contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
    >
      {/* Main card */}
      <View className="w-11/12 mt-6 p-4 bg-white rounded-3xl shadow-lg items-center">
        <Text className="text-2xl font-bold mb-4 text-gray-900">
          Weather I Go
        </Text>

        {/* Location search */}
        <TextInput
          className="bg-gray-100 p-3 rounded-xl mb-4 w-10/12 text-gray-700"
          placeholder="Search location..."
          value={location}
          onChangeText={setLocation}
        />

        {/* Select Date button */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className={`rounded-2xl p-3 mb-2 w-3/4 ${
            selectedDate ? "bg-blue-500" : "bg-gray-200"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              selectedDate ? "text-white" : "text-gray-700"
            }`}
          >
            📅 Select Date
          </Text>
        </TouchableOpacity>
        {selectedDate && (
          <Text className="text-gray-700 mb-3">
            Selected Date: <Text className="font-semibold">{selectedDate}</Text>
          </Text>
        )}

        {/* Weather buttons */}
        <Text className="text-lg font-semibold text-gray-800 mb-2 self-start">
          Desired Condition
        </Text>
        <View className="flex-row flex-wrap justify-center mb-4">
          {weatherOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              onPress={() => setSelectedWeather(option.label)}
              className={`w-[30%] m-1 p-3 rounded-2xl items-center ${
                selectedWeather === option.label
                  ? "bg-blue-100 border border-blue-500"
                  : "bg-gray-100"
              }`}
            >
              <Text className="text-2xl">{option.icon}</Text>
              <Text
                className={`mt-1 font-semibold ${
                  selectedWeather === option.label
                    ? "text-blue-600"
                    : "text-gray-700"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Temperature slider */}
        <Text className="text-lg font-semibold text-gray-800 mb-2 self-start">
          Desired Temperature ({unit})
        </Text>
        <View className="items-center w-full mb-6">
          <Text className="text-gray-700 mb-2">
            {displayValue(temperatureRange[0])} -{" "}
            {displayValue(temperatureRange[1])}
          </Text>
          <MultiSlider
            values={temperatureRange}
            min={-20}
            max={50}
            step={1}
            sliderLength={280}
            onValuesChange={setTemperatureRange}
            selectedStyle={{ backgroundColor: "#2563eb" }}
            unselectedStyle={{ backgroundColor: "#cbd5e1" }}
            markerStyle={{
              backgroundColor: "#2563eb",
              height: 20,
              width: 20,
            }}
          />
        </View>

        {/* Buttons */}
        <View className="flex items-center w-full mt-2">
          <TouchableOpacity
            onPress={saveEvent}
            className="bg-blue-500 rounded-2xl p-3 w-3/4 mb-3"
          >
            <Text className="text-center text-white font-semibold">
              Save Event
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCalculate}
            className="bg-gray-200 rounded-2xl p-3 w-3/4"
          >
            <Text className="text-center text-gray-700 font-semibold">
              Calculate Favorability
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map placeholder */}
      <View className="h-80 bg-blue-100 w-11/12 mt-6 rounded-3xl items-center justify-center border border-dashed border-blue-400">
        <Text className="text-gray-700 text-center">
          [Map Interface Placeholder]
        </Text>
      </View>

      {/* Date Picker Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-3xl p-5 w-80 shadow-lg items-center">
            <Text className="text-lg font-semibold mb-3 text-gray-900">
              Select a Date
            </Text>
            <Calendar
              style={{
                borderRadius: 15,
                overflow: "hidden",
                width: 300,
              }}
              theme={{
                backgroundColor: "#fff",
                calendarBackground: "#fff",
                todayTextColor: "#2563eb",
                arrowColor: "#2563eb",
              }}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  marked: true,
                  selectedColor: "#2563eb",
                },
              }}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="mt-4 bg-blue-500 rounded-xl px-5 py-2"
            >
              <Text className="text-white font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Favorability Modal */}
      <Modal
        transparent
        visible={favorModal}
        animationType="fade"
        onRequestClose={() => setFavorModal(false)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center">
          <View className="bg-white rounded-3xl p-6 w-80 shadow-lg items-center">
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="text-gray-700 mt-3">
                  Checking favorability...
                </Text>
              </>
            ) : (
              <>
                <Text className="text-xl font-bold text-gray-800 mb-2">
                  Favorability Result
                </Text>
                <Text className="text-gray-600 mb-4 text-center">
                  Your friend’s backend will send the calculated result here.
                </Text>
                <TouchableOpacity
                  onPress={() => setFavorModal(false)}
                  className="bg-blue-500 rounded-xl px-4 py-2"
                >
                  <Text className="text-white font-semibold">Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
