import Slider from "@react-native-community/slider";
import { useState, useEffect } from "react";
import { Text, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
    unit: "C" | "F" | "K";
    onRangeChange?: (range: {min: number; max: number }) => void;
};

export default function TemperatureSlider({ unit, onRangeChange }: Props) {
  const [minTemp, setMinTemp] = useState(10);
  const [maxTemp, setMaxTemp] = useState(25);

  const toUnit = (c: number) => {
    if (unit === "F") return c * 1.8 + 32;
    if (unit === "K") return c + 273.15;
    return c;
  };

  const fromUnit = (v: number) => {
    if (unit === "F") return (v - 32) / 1.8;
    if (unit === "K") return - 273.15;
    return v;
  };

  useEffect(() => {
    AsyncStorage.setItem("minTemp", minTemp.toString());
    AsyncStorage.setItem("maxTemp", maxTemp.toString());
  }, [minTemp, maxTemp]);

  useEffect(() => {
    if(onRangeChange) onRangeChange({ min: minTemp, max: maxTemp });
  } [minTemp, maxTemp]);
  
  return (
    <View className="p-4 bg gray-200">
      <Text className="text-center font-bold mb-2">
        Desired Temperature Range
      </Text>

      {/* Min slider */}
      <View className="mb-4">
        <Text className="mb-1">Min: {minTemp}°C</Text>
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={-10}
          maximumValue={maxTemp} //prevent min from exceeding max
          step={1}
          value={minTemp}
          onValueChange={setMinTemp}
          minimumTrackTintColor="#2563eb"
          maximumTrackTintColor="#9e0b0bff"
        />
      </View>

      {/* Max slider */}
      <View>
        <Text className="mb-1">Max: {maxTemp}°C</Text>
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={minTemp} // prevent max from being lower than min
          maximumValue={50}
          step={1}
          value={maxTemp}
          onValueChange={setMaxTemp}
          minimumTrackTintColor="#2563eb"
          maximumTrackTintColor="#9e0b0bff"
        />
      </View>
    </View>
  );
}
