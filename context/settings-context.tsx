import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type UnitType = "C" | "F" | "K";

type SettingsContextType = {
  unit: UnitType;
  setUnit: (u: UnitType) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  unit: "C",
  setUnit: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [unit, setUnitState] = useState<UnitType>("C");

  // Load saved preference
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("temperature_unit");
      if (saved === "C" || saved === "F" || saved === "K") {
        setUnitState(saved);
      }
    })();
  }, []);

  const setUnit = async (u: UnitType) => {
    setUnitState(u);
    await AsyncStorage.setItem("temperature_unit", u);
  };

  return (
    <SettingsContext.Provider value={{ unit, setUnit }}>
      {children}
    </SettingsContext.Provider>
  );
};
