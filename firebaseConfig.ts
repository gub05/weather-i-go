// firebaseConfig.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

let db: Firestore | null = null;

/**
 * Returns Firestore instance safely.
 * Will not throw "window not defined" during SSR or build.
 */
export const getDb = (): Firestore | null => {
  // ✅ Guard to prevent "window not defined" in SSR
  if (typeof window === "undefined") {
    console.log("Firebase init skipped (SSR mode)");
    return null;
  }

const firebaseConfig = {
  apiKey: "AIzaSyCDnPEyW7Twsv4N5i2CuKjmxejYJJqGOWY",
  authDomain: "weather-i-go-2199d.firebaseapp.com",
  projectId: "weather-i-go-2199d",
  storageBucket: "weather-i-go-2199d.firebasestorage.app",
  messagingSenderId: "974168243631",
  appId: "1:974168243631:web:a19bc2e826abfd5c79835a",
  measurementId: "G-F82VNJGJG3"
};

  // ✅ Initialize safely
  const app: FirebaseApp =
    getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  if (!db) db = getFirestore(app);
  return db;
};