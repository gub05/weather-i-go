import React, { useState, useEffect } from "react";
import { View, Text, Switch, TextInput, Button, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);

    useEffect(() => {

        console.log("Settings screen loaded");
    }, []);

    return (
    <View style={{ flex: 1, padding: 20 }}>
        <Text>Dark Mode: {darkMode ? "On" : "Off"}</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} /> 
        <Text>Notifications: {notifications ? "On" : "Off"}</Text>
        <Switch value={notifications} onValueChange={setNotifications} />
    </View>
    );
    
}