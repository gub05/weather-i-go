import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";


const firebaseConfig = {
  apiKey: "AIzaSyCDnPEyW7Twsv4N5i2CuKjmxejYJJqGOWY",
  authDomain: "weather-i-go-2199d.firebaseapp.com",
  projectId: "weather-i-go-2199d",
  storageBucket: "weather-i-go-2199d.firebasestorage.app",
  messagingSenderId: "974168243631",
  appId: "1:974168243631:web:a19bc2e826abfd5c79835a",
  measurementId: "G-F82VNJGJG3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);