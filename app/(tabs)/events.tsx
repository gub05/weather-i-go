import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDb } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useTheme } from "@/context/theme-context";
import { Colors } from "@/constants/theme";


export default function EventsScreen() {
  const { theme } = useTheme();
  const colors =
      theme === "dark"
        ? Colors.dark
        : theme === "system"
        ? Colors.system
        : Colors.light;
  

  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("Date");
  const [ascending, setAscending] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // --- Load events from Firestore or AsyncStorage ---
  useEffect(() => {
    const loadEvents = async () => {
      let allEvents = [];

      try {
        const db = getDb();
        if (db) {
          const snapshot = await getDocs(collection(db, "events"));
          allEvents = snapshot.docs.map((doc) => doc.data());
        }
      } catch (err) {
        console.warn("Firestore unavailable, using AsyncStorage instead:", err);
      }

      if (allEvents.length === 0) {
        const stored = await AsyncStorage.getItem("events");
        if (stored) allEvents = JSON.parse(stored);
      }

      setEvents(allEvents);
    };

    loadEvents();
  }, []);

  // --- Badge color helper ---
  const getBadgeColor = (favorability) => {
    switch (favorability) {
      case "FAVORABLE":
        return "#90EE90";
      case "OKAY":
        return "#FFD700";
      case "UNFAVORABLE":
        return "#FF7F7F";
      default:
        return "#ccc";
    }
  };

  // --- Sorting (Name or Date only) ---
  const sortEvents = (data) => {
    return [...data].sort((a, b) => {
      switch (sortOption) {
        case "Name":
          return ascending
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case "Date":
        default:
          return ascending
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  };

  // --- Apply search + sort ---
  const filteredAndSorted = sortEvents(
    events.filter((event) =>
      event.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // --- Theme-based colors ---
  const backgroundColor = colors.background;
  const textColor = colors.text;
  const tintColor = colors.tint;
  const borderColor =
    theme === "dark" ? "#333" : theme === "system" ? "#a8dadc" : "#ddd";
  const cardBackground =
    theme === "dark" ? "#1e1e1e" : theme === "system" ? "#ffffff" : "#ffffff";
  const searchBg =
    theme === "dark" ? "#222" : theme === "system" ? "#f1f5f4" : "#fff";
  const placeholderColor = theme === "dark" ? "#aaa" : "#777";

  // --- Render one event card ---
  const renderEvent = ({ item }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBackground,
          borderColor,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.eventName, { color: textColor }]}>
            {item.name}
          </Text>
          <Text style={[styles.eventDate, { color: placeholderColor }]}>
            {item.date}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: getBadgeColor(item.favorability) },
          ]}
        >
          <Text style={styles.badgeText}>{item.favorability}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View
        style={[
          styles.innerCard,
          {
            backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
            borderColor,
          },
        ]}
      >
        <Text style={[styles.title, { color: textColor }]}>My Events</Text>

        {/* Search Input */}
        <TextInput
          placeholder="Search by event name..."
          placeholderTextColor={placeholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[
            styles.searchBar,
            {
              backgroundColor: searchBg,
              color: textColor,
              borderColor,
            },
          ]}
        />

        {/* Sort Dropdown */}
        <View
          style={{
            alignItems: "flex-end",
            marginBottom: 10,
            position: "relative",
            zIndex: 1,
          }}
        >
          <TouchableOpacity
            onPress={() => setDropdownVisible(!dropdownVisible)}
            style={[
              styles.sortButton,
              { backgroundColor: searchBg, borderColor },
            ]}
          >
            <Text style={[styles.sortText, { color: textColor }]}>
              Sort by: {sortOption} {ascending ? "↑" : "↓"}
            </Text>
          </TouchableOpacity>

          {dropdownVisible && (
            <View style={styles.dropdownWrapper} pointerEvents="box-none">
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: searchBg,
                    borderColor,
                  },
                ]}
              >
                {["Name", "Date"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      if (sortOption === option) setAscending(!ascending);
                      else {
                        setSortOption(option);
                        setAscending(true);
                      }
                      setDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOption,
                        {
                          color: textColor,
                          fontWeight: sortOption === option ? "700" : "400",
                        },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Events List */}
        <FlatList
          data={filteredAndSorted}
          renderItem={renderEvent}
          keyExtractor={(item, idx) => idx.toString()}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: placeholderColor }]}>
              No events saved yet.
            </Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: "center" },
  innerCard: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  searchBar: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  sortButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 5,
  },
  sortText: { fontWeight: "600" },
  dropdownWrapper: {
    position: "absolute",
    top: 42,
    right: 0,
    zIndex: 9999,
    elevation: 10,
  },
  dropdown: {
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dropdownOption: { paddingVertical: 8, fontSize: 16 },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  eventName: { fontSize: 18, fontWeight: "600" },
  eventDate: { marginTop: 2, fontSize: 14 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "center",
  },
  badgeText: { fontWeight: "700", color: "#000", fontSize: 12 },
  emptyText: { textAlign: "center", marginTop: 40 },
});
