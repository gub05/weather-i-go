import { ScrollView, Text, TouchableOpacity } from "react-native";

type Props = {
  selected: string | null;
  setSelected: (val: string) => void;
};

export default function WeatherButtons({ selected, setSelected }: Props) {
  const conditions = [
    { label: "Sunny", key: "sunny" },
    { label: "Partly Cloudy", key: "partly" },
    { label: "Cloudy", key: "cloudy" },
    { label: "Rainy", key: "rainy" },
    { label: "Storm", key: "storm" },
    { label: "Night", key: "night" },
  ];

  return (
    <ScrollView horizontal className="p-2 bg-gray-100">
      {conditions.map((c) => {
        <TouchableOpacity
          key={c.key}
          className={`px-4 py-2 rounded=2x1 m-1 ${
            selected === c.key ? "bg-blue-600" : "bg-blue-400"
          }`}
          onPress={() => setSelected(c.key)}
        >
          <Text className="text-white">{c.label} </Text>
        </TouchableOpacity>;
      })}
    </ScrollView>
  );
}
