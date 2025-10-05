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

export default function EventsScreen() {
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

  // --- Color badge helper ---
  const getBadgeColor = (favorability) => {
    switch (favorability) {
      case "FAVORABLE":
        return "#90EE90"; // green
      case "OKAY":
        return "#FFD700"; // yellow
      case "UNFAVORABLE":
        return "#FF7F7F"; // red
      default:
        return "#ccc";
    }
  };

  // --- Sorting ---
  const sortEvents = (data) => {
    return [...data].sort((a, b) => {
      switch (sortOption) {
        case "Name":
          return ascending
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case "Date":
          return ascending
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        case "Favorability":
          return ascending
            ? a.favorability.localeCompare(b.favorability)
            : b.favorability.localeCompare(a.favorability);
        default:
          return 0;
      }
    });
  };

  // --- Apply search + sort ---
  const filteredAndSorted = sortEvents(
    events.filter((event) =>
      event.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // --- Render one event card ---
  const renderEvent = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.eventName}>{item.name}</Text>
          <Text style={styles.eventDate}>{item.date}</Text>
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

  // --- UI ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Events</Text>

      {/* Search Input */}
      <TextInput
        placeholder="Search by name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
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
          style={styles.sortButton}
        >
          <Text style={styles.sortText}>
            Sort by: {sortOption} {ascending ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>

        {dropdownVisible && (
          <View style={styles.dropdownWrapper} pointerEvents="box-none">
            <View style={styles.dropdown}>
              {["Name", "Date", "Favorability"].map((option) => (
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
                      sortOption === option && { fontWeight: "700" },
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
          <Text style={styles.emptyText}>No events saved yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8", padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  searchBar: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  sortButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
    zIndex: 5,
  },
  sortText: { fontWeight: "600" },
  dropdownWrapper: {
    position: "absolute",
    top: 40,
    right: 0,
    zIndex: 9999,
    elevation: 10,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownOption: { paddingVertical: 6, fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eventName: { fontSize: 18, fontWeight: "600", color: "#333" },
  eventDate: { color: "#666", marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "center",
  },
  badgeText: { fontWeight: "700", color: "#000", fontSize: 12 },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 40,
  },
});
