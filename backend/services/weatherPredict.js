// backend/services/weatherPredictor.js
import fetch from "node-fetch";
import { getSummary } from "./nasaService.js"; // your existing POWER data fetcher

// 1. Helper: determine how far away the date is
function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

// 2. Fetch from NASA GEOS / CPTEC forecast (short-term)
async function fetchForecast(lat, lon, startDate, endDate) {
  // Example: GEOS-5 FP forecast (Earthdata)
  // In practice, you'd need to register for Earthdata API.
  const url = `https://<geos-forecast-endpoint>?lat=${lat}&lon=${lon}&start=${startDate}&end=${endDate}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Forecast fetch failed");
  return res.json();
}

// 3. Predict for long-term using climatology (POWER API)
async function fetchClimatology(location, date) {
  return await getSummary(location, date); // your nasaService.js function
}

// 4. Main function
export async function predictWeather(location, date) {
  const today = new Date();
  const targetDate = new Date(date);
  const diff = daysBetween(today, targetDate);

  if (diff <= 7) {
    // short term forecast
    const coords = { lat: 37.7749, lon: -122.4194 }; // TODO: use geocoding
    const forecast = await fetchForecast(coords.lat, coords.lon, date, date);
    return {
      mode: "forecast",
      status: "Success",
      message: `Forecast from NASA model (short-term)`,
      data: forecast,
    };
  } else {
    // long term climatology
    const climatology = await fetchClimatology(location, date);
    return {
      mode: "climatology",
      status: "Success",
      message: `Climatological averages from NASA POWER (long-term)`,
      data: climatology,
    };
  }
}
