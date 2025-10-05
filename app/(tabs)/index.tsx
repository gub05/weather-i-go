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
import { useTheme } from "@/context/theme-context";
import { Colors } from "@/constants/theme";

export default function ExploreScreen() {
  const { theme } = useTheme();
  const colors = theme === "dark" ? Colors.dark : Colors.light;

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

  const convertCelsius = (v, toUnit) =>
    toUnit === "F" ? (v * 9) / 5 + 32 : toUnit === "K" ? v + 273.15 : v;
  const displayValue = (v) => `${convertCelsius(v, unit).toFixed(1)}°${unit}`;

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
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
    >
      {/* Main card */}
      <View
        style={{
          width: "90%",
          marginTop: 24,
          padding: 16,
          borderRadius: 24,
          backgroundColor: theme === "dark" ? "#1e1f20" : "#fff",
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 16,
            color: colors.text,
          }}
        >
          Weather I Go
        </Text>

        {/* Location Input */}
        <TextInput
          style={{
            backgroundColor: theme === "dark" ? "#2b2b2b" : "#f0f0f0",
            color: colors.text,
            padding: 12,
            borderRadius: 12,
            width: "85%",
            marginBottom: 16,
          }}
          placeholder="Search location..."
          placeholderTextColor={theme === "dark" ? "#888" : "#999"}
          value={location}
          onChangeText={setLocation}
        />

        {/* Select Date Button */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: selectedDate ? colors.tint : "#ccc",
            borderRadius: 16,
            padding: 12,
            width: "75%",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontWeight: "600",
              color: selectedDate ? colors.background : "#333",
            }}
          >
            📅 Select Date
          </Text>
        </TouchableOpacity>

        {selectedDate && (
          <Text style={{ color: colors.text, marginBottom: 12 }}>
            Selected Date:{" "}
            <Text style={{ fontWeight: "600" }}>{selectedDate}</Text>
          </Text>
        )}

        {/* Weather Buttons */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
            alignSelf: "flex-start",
            marginBottom: 8,
          }}
        >
          Desired Condition
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {weatherOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              onPress={() => setSelectedWeather(option.label)}
              style={{
                width: "30%",
                margin: 6,
                padding: 10,
                borderRadius: 16,
                alignItems: "center",
                backgroundColor:
                  selectedWeather === option.label
                    ? colors.tint + "22"
                    : theme === "dark"
                    ? "#2a2a2a"
                    : "#f0f0f0",
                borderWidth: selectedWeather === option.label ? 2 : 0,
                borderColor: selectedWeather === option.label ? colors.tint : "transparent",
              }}
            >
              <Text style={{ fontSize: 22 }}>{option.icon}</Text>
              <Text
                style={{
                  marginTop: 4,
                  fontWeight: "600",
                  color:
                    selectedWeather === option.label
                      ? colors.tint
                      : colors.text,
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Temperature Slider */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
            alignSelf: "flex-start",
            marginBottom: 8,
          }}
        >
          Desired Temperature ({unit})
        </Text>

        <View style={{ alignItems: "center", width: "100%", marginBottom: 24 }}>
          <Text style={{ color: colors.text, marginBottom: 8 }}>
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
            selectedStyle={{ backgroundColor: colors.tint }}
            unselectedStyle={{
              backgroundColor: theme === "dark" ? "#555" : "#ccc",
            }}
            markerStyle={{
              backgroundColor: colors.tint,
              height: 20,
              width: 20,
            }}
          />
        </View>

        {/* Buttons */}
        <TouchableOpacity
          onPress={saveEvent}
          style={{
            backgroundColor: colors.tint,
            borderRadius: 16,
            padding: 12,
            width: "75%",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: colors.background,
              fontWeight: "600",
            }}
          >
            Save Event
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCalculate}
          style={{
            backgroundColor: theme === "dark" ? "#444" : "#ddd",
            borderRadius: 16,
            padding: 12,
            width: "75%",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: colors.text,
              fontWeight: "600",
            }}
          >
            Calculate Favorability
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map placeholder */}
      <View
        style={{
          height: 300,
          width: "90%",
          marginTop: 24,
          borderRadius: 24,
          backgroundColor: theme === "dark" ? "#2b2b2b" : "#e0f2fe",
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: theme === "dark" ? "#555" : "#60a5fa",
          borderStyle: "dashed",
        }}
      >
        <Text style={{ color: colors.text, textAlign: "center" }}>
          [Map Interface Placeholder]
        </Text>
      </View>

      {/* Date Picker Modal (unchanged) */}
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
          <View
            style={{
              backgroundColor: theme === "dark" ? "#1e1f20" : "#fff",
              borderRadius: 24,
              padding: 24,
              width: 320,
              alignItems: "center",
            }}
          >
            {loading ? (
              <>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text
                  style={{
                    color: colors.text,
                    marginTop: 12,
                    fontSize: 16,
                  }}
                >
                  Checking favorability...
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Favorability Result
                </Text>
                <Text
                  style={{
                    color: theme === "dark" ? "#aaa" : "#555",
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  Your friend’s backend will send the calculated result here.
                </Text>
                <TouchableOpacity
                  onPress={() => setFavorModal(false)}
                  style={{
                    backgroundColor: colors.tint,
                    borderRadius: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  <Text
                    style={{
                      color: colors.background,
                      fontWeight: "600",
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
