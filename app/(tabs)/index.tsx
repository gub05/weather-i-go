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
  Dimensions,
  Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useTheme } from "@/context/theme-context";
import { Colors } from "@/constants/theme";
import SatelliteMap from "@/components/satellite-map";

export default function ExploreScreen() {
  const { theme } = useTheme();
const colors =
    theme === "dark"
      ? Colors.dark
      : theme === "system"
      ? Colors.system
      : Colors.light;

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWeather, setSelectedWeather] = useState("");
  const [temperatureRange, setTemperatureRange] = useState([20, 30]);
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("C");
  const [modalVisible, setModalVisible] = useState(false);
  const [favorModal, setFavorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [favorabilityResult, setFavorabilityResult] = useState(null);

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

  const checkFavorability = async () => {
    setLoading(true);
    try {
      // Check if location is provided
      if (!location || location.trim() === "") {
        setFavorabilityResult({ 
          aiExplanation: "Please enter a location to get weather analysis! 🌍",
          aiComparison: null 
        });
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        location: location,
        date: selectedDate || new Date().toISOString().split('T')[0],
        desiredTemp: temperatureRange[0].toString(),
        desiredCondition: selectedWeather || "sunny",
        desiredHumidity: "50"
      });
      
      const response = await fetch(`http://127.0.0.1:3001/api/weather/explain?${params}`);
      const result = await response.json();
      setFavorabilityResult(result);
    } catch (error) {
      console.error('Error checking favorability:', error);
      setFavorabilityResult({ 
        aiExplanation: "Oops! Something went wrong. Please check your connection and try again. 🔄",
        aiComparison: null 
      });
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async () => {
    try {
      const existing = await AsyncStorage.getItem("events");
      const events = existing ? JSON.parse(existing) : [];
      const newEvent = {
        id: Date.now().toString(),
        name: name,
        date: selectedDate,
        weather: selectedWeather,
        temperatureRange: temperatureRange.map((v) =>
          convertCelsius(v, unit).toFixed(1)
        ),
        unit,
        location,
        favorability: null, //update this later

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
    checkFavorability();
  };

  // Reverse geocoding function to convert coordinates to city name
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WeatherApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        // Try to get the most specific location name available
        const city = data.address.city ||
                    data.address.town ||
                    data.address.village ||
                    data.address.county ||
                    data.address.state ||
                    data.address.country ||
                    'Unknown Location';
        
        const country = data.address.country;
        return country && city !== country ? `${city}, ${country}` : city;
      }
      
      return 'Unknown Location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }
  };

  const handleLocationSelect = async (latitude, longitude) => {
    setSelectedLocation({ latitude, longitude });
    
    // Perform reverse geocoding to get city name
    try {
      const cityName = await reverseGeocode(latitude, longitude);
      setLocation(cityName);
    } catch (error) {
      console.error('Error getting location name:', error);
      // Fallback to coordinates if reverse geocoding fails
      setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  const getSelectedDateObject = () => {
    if (!selectedDate) return new Date();
    return new Date(selectedDate);
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Toggle Button */}
      <View style={{
        flexDirection: "row",
        backgroundColor: theme === "dark" ? "#1e1f20" : "#fff",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: theme === "dark" ? "#555" : "#e0e0e0",
      }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 20,
            marginHorizontal: 5,
            backgroundColor: !showMap ? colors.tint : (theme === "dark" ? "#2b2b2b" : "#f5f5f5"),
            borderRadius: 8,
            alignItems: "center",
          }}
          onPress={() => setShowMap(false)}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: "600",
            color: !showMap ? colors.text : (theme === "dark" ? "#aaa" : "#666"),
          }}>
            🎛️ Controls
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 20,
            marginHorizontal: 5,
            backgroundColor: showMap ? colors.tint : (theme === "dark" ? "#2b2b2b" : "#f5f5f5"),
            borderRadius: 8,
            alignItems: "center",
          }}
          onPress={() => setShowMap(true)}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: "600",
            color: showMap ? colors.text : (theme === "dark" ? "#aaa" : "#666"),
          }}>
            🛰️ Satellite Map
          </Text>
        </TouchableOpacity>
      </View>

      {showMap ? (
        // Satellite Map View
        <SatelliteMap
          onLocationSelect={handleLocationSelect}
          selectedDate={getSelectedDateObject()}
          weatherCondition={selectedWeather}
          tempRange={{ min: temperatureRange[0], max: temperatureRange[1] }}
        />
      ) : (
        // Main Controls View
        <ScrollView
          style={{ flex: 1 }}
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
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 6,
            },
            android: {
              elevation: 6,
            },
            web: {
              boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.1)",
            },
          }),
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 45,
            fontWeight: "bold",
            marginBottom: 16,
            color: colors.text,
          }}
        >
          Weather I Go
        </Text>

        {/* Event Name Input */}
        <TextInput
          style={{
            backgroundColor: theme === "dark" ? "#2b2b2b" : "#f0f0f0",
            color: colors.text,
            padding: 12,
            borderRadius: 12,
            width: "85%",
            marginBottom: 16,
          }}
          placeholder="Name of Event..."
          placeholderTextColor={theme === "dark" ? "#888" : "#999"}
          value={name}
          onChangeText={setName}
        />

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
          placeholder="Enter location (e.g., Paris, New York)..."
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
            textAlign: "center",
            //alignSelf: "flex-start",
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
            textAlign: "center",
            //alignSelf: "flex-start",
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
              color: "#333",
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

      {/* Location Display */}
      {(location || selectedLocation) && (
        <View
          style={{
            width: "90%",
            marginTop: 16,
            padding: 16,
            borderRadius: 16,
            backgroundColor: theme === "dark" ? "#1e1f20" : "#fff",
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 6,
              },
              android: {
                elevation: 6,
              },
              web: {
                boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.1)",
              },
            }),
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
            📍 Selected Location
          </Text>
          {location && (
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
              {location}
            </Text>
          )}
          {selectedLocation && (
            <>
              <Text style={{ color: theme === "dark" ? "#aaa" : "#666" }}>
                Latitude: {selectedLocation.latitude.toFixed(4)}
              </Text>
              <Text style={{ color: theme === "dark" ? "#aaa" : "#666" }}>
                Longitude: {selectedLocation.longitude.toFixed(4)}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Date Picker Modal (unchanged) */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: theme === 'dark' ? '#1e1f20' : 'white',
            borderRadius: 24,
            padding: 20,
            width: 320,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              },
              android: {
                elevation: 8,
              },
              web: {
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
              },
            }),
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 12,
              color: colors.text
            }}>
              Select a Date
            </Text>
            <Calendar
              style={{
                borderRadius: 15,
                overflow: "hidden",
                width: 300,
              }}
              theme={{
                backgroundColor: theme === 'dark' ? '#1e1f20' : '#fff',
                calendarBackground: theme === 'dark' ? '#1e1f20' : '#fff',
                textSectionTitleColor: colors.text,
                selectedDayBackgroundColor: colors.tint,
                selectedDayTextColor: colors.background,
                todayTextColor: colors.tint,
                dayTextColor: colors.text,
                textDisabledColor: theme === 'dark' ? '#555' : '#ccc',
                arrowColor: colors.tint,
                monthTextColor: colors.text,
                indicatorColor: colors.tint,
              }}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  marked: true,
                  selectedColor: colors.tint,
                },
              }}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                marginTop: 16,
                backgroundColor: colors.tint,
                borderRadius: 12,
                paddingHorizontal: 20,
                paddingVertical: 8
              }}
            >
              <Text style={{
                color: colors.background,
                fontWeight: '600'
              }}>Done</Text>
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
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: theme === "dark" ? "#1e1f20" : "#fff",
            borderRadius: 24,
            padding: 24,
            width: 320,
            alignItems: "center",
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              },
              android: {
                elevation: 8,
              },
              web: {
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
              },
            }),
          }}>
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
                  🌤️ Checking weather favorability...
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
                    paddingHorizontal: 16,
                  }}
                >
                  {favorabilityResult?.aiExplanation || "🌤️ Analyzing weather conditions for you..."}
                </Text>
                {favorabilityResult?.aiComparison && (
                  <Text
                    style={{
                      color: theme === "dark" ? "#aaa" : "#555",
                      textAlign: "center",
                      marginBottom: 16,
                      paddingHorizontal: 16,
                      fontStyle: "italic",
                    }}
                  >
                    Comparison: {favorabilityResult.aiComparison}
                  </Text>
                )}
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
      )}
    </View>
  );
}
