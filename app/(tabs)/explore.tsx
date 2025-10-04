// app/(tabs)/explore.tsx

import { initializeGEE } from "@/api/googleEarthEngine";
import TemperatureSlider from "@/components/temperature-slider";
import WeatherButtons from "@/components/weather-buttons";
import ee from "@google/earthengine";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import MapView, { UrlTile } from "react-native-maps";

export default function ExploreScreen() {
  const [mapUrl, setMapUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State from your friend's code
  const [userCondition, setUserCondition] = useState<string | null>(null);
  const [userDate, setUserDate] = useState<{
    day: string;
    month: string;
    year: string;
  } | null>(null);
  const [tempRange, setTempRange] = useState<{ min: number; max: number }>({
    min: 10,
    max: 25,
  });

  // Your map-loading logic (this is correct)
  useEffect(() => {
    const getGEEMap = async () => {
      try {
        await initializeGEE();
        const image = ee.Image("LANDSAT/LC08/C01/T1_TOA/LC08_044034_20140318");
        const ndvi = image.normalizedDifference(["B5", "B4"]);
        const ndviParams = {
          min: -1,
          max: 1,
          palette: ["blue", "white", "green"],
        };
        ndvi.getMap(ndviParams, ({ mapid, urlFormat }) => {
          setMapUrl(urlFormat);
        });
      } catch (e) {
        setError("Failed to load map data.");
      }
    };
    getGEEMap();
  }, []);

  useEffect(() => {
    if (mapUrl || error) {
      setIsLoading(false);
    }
  }, [mapUrl, error]);

  // Loading and Error screens
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading Map...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  // --- Main Return Statement ---
  // Everything you want to see goes in here.
  return (
    <View style={styles.container}>
      {/* Map is in the background */}
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {mapUrl && <UrlTile urlTemplate={mapUrl} zIndex={-1} />}
      </MapView>

      {/* All the UI controls go in a ScrollView on top of the map */}
      <ScrollView contentContainerStyle={styles.uiContainer}>
        {/* Weather Buttons */}
        <View style={styles.uiCard}>
          <Text style={styles.uiTitle}>Select Condition</Text>
          <WeatherButtons selected={userCondition} setSelected={setUserCondition} />
        </View>

        {/* Temperature Slider */}
        <View style={styles.uiCard}>
          <Text style={styles.uiTitle}>Select Temperature Range (°C)</Text>
          <TemperatureSlider unit="C" onRangeChange={setTempRange} />
        </View>

        {/* Calendar */}
        <View style={styles.uiCard}>
          <Text style={styles.uiTitle}>Choose Event Date</Text>
          <Calendar
            onDayPress={(day) =>
              setUserDate({
                day: day.day.toString(),
                month: day.month.toString(),
                year: day.year.toString(),
              })
            }
            markedDates={
              userDate
                ? {
                    [`${userDate.year}-${userDate.month.padStart(
                      2,
                      "0"
                    )}-${userDate.day.padStart(2, "0")}`]: {
                      selected: true,
                      selectedColor: "#3498db",
                    },
                  }
                : {}
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uiContainer: {
    padding: 10,
    paddingTop: 50, // Add padding to avoid the status bar
  },
  uiCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  uiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
});