// backend/nasaService.js
import fetch from "node-fetch";  // <--- ensures fetch works in Node

// NASA POWER API endpoint and constants
const BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";
const COMMUNITY = "AG";
const FORMAT = "JSON";

// Parameter keys
const TEMP_PARAM = "T2M";     // Daily Mean 2 Meter Air Temperature
const RAIN_PARAM = "PRECTOT"; // Daily Total Precipitation
const WIND_PARAM = "WS2M";    // Daily Mean 2 Meter Wind Speed

/**
 * Real Geocoding using OpenStreetMap Nominatim API (free, no API key required)
 */
async function geologicalLocation(locationName) {
  console.log(`🌍 Geocoding location: ${locationName}`);
  
  try {
    // Use OpenStreetMap Nominatim API for geocoding
    const encodedLocation = encodeURIComponent(locationName);
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1`;
    
    console.log(`🔍 Fetching coordinates from: ${geocodingUrl}`);
    
    const response = await fetch(geocodingUrl, {
      headers: {
        'User-Agent': 'WeatherApp/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const coords = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      };
      
      console.log(`✅ Found coordinates for ${locationName}:`, coords);
      return coords;
    } else {
      console.warn(`⚠️ No coordinates found for: ${locationName}, using fallback`);
      return { lat: 40.7128, lon: -74.006 }; // fallback (NYC)
    }
    
  } catch (error) {
    console.error(`❌ Geocoding error for ${locationName}:`, error.message);
    console.warn(`⚠️ Using fallback coordinates for: ${locationName}`);
    return { lat: 40.7128, lon: -74.006 }; // fallback (NYC)
  }
}

/**
 * Clean invalid NASA values (-999)
 */
function sanitize(val) {
  return val === undefined || val === null || val === -999 || val === "-999"
    ? null
    : parseFloat(val).toFixed(2);
}

/**
 * Fetch data from NASA POWER API for a given date and parameters
 */
async function fetchNasaData(lat, lon, date, parameters) {
  const nasaDate = date.replace(/-/g, "");

  const url = new URL(BASE_URL);
  url.searchParams.append("latitude", lat);
  url.searchParams.append("longitude", lon);
  url.searchParams.append("start", nasaDate);
  url.searchParams.append("end", nasaDate);
  url.searchParams.append("parameters", parameters);
  url.searchParams.append("community", COMMUNITY);
  url.searchParams.append("format", FORMAT);

  console.log("🌍 Fetching NASA URL:", url.toString());   // 👈 log the full URL

  try {
    const response = await fetch(url.toString());
    console.log("📡 NASA response status:", response.status);  // 👈 log status

    if (!response.ok) {
      throw new Error(`NASA API error: Status ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ NASA data received:", JSON.stringify(data).slice(0, 200)); // 👈 preview data
    return data.properties || data;
  } catch (error) {
    console.error("❌ NASA fetch error:", error);
    throw new Error("Could not retrieve data from NASA service.");
  }
}

/**
 * Get average daily temperature
 */
export async function getTemperature(locationName, date) {
  const coords = await geologicalLocation(locationName);
  const rawData = await fetchNasaData(coords.lat, coords.lon, date, TEMP_PARAM);

  const dailyData = rawData?.parameter?.[TEMP_PARAM];
  const dateKey = date.replace(/-/g, "");
  const avgTemperature = sanitize(dailyData?.[dateKey]);

  return {
    temperatureC: avgTemperature,
    unit: "C",
    label: "Average Daily Temperature",
  };
}

/**
 * Get daily rainfall
 */
export async function getRainfall(locationName, date) {
  const coords = await geologicalLocation(locationName);
  const rawData = await fetchNasaData(coords.lat, coords.lon, date, RAIN_PARAM);

  const dailyData = rawData?.parameter?.[RAIN_PARAM];
  const dateKey = date.replace(/-/g, "");
  const totalRainfall = sanitize(dailyData?.[dateKey]);

  return {
    rainfall: totalRainfall,
    unit: "mm",
    label: "Total Daily Rainfall",
  };
}

/**
 * Get average daily wind speed
 */
export async function getWindSpeed(locationName, date) {
  const coords = await geologicalLocation(locationName);
  const rawData = await fetchNasaData(coords.lat, coords.lon, date, WIND_PARAM);

  const dailyData = rawData?.parameter?.[WIND_PARAM];
  const dateKey = date.replace(/-/g, "");
  const avgWindSpeed = sanitize(dailyData?.[dateKey]);

  return {
    windspeed: avgWindSpeed,
    unit: "m/s",
    label: "Average Daily Wind Speed",
  };
}

/**
 * Build a summary JSON of all weather data
 */
export async function getSummary(locationName, date) {
  try {
    const [tempData, rainData, windData, coords] = await Promise.all([
      getTemperature(locationName, date),
      getRainfall(locationName, date),
      getWindSpeed(locationName, date),
      geologicalLocation(locationName),
    ]);

    return {
      query: {
        location: locationName,
        date: date,
        latitude: coords.lat,
        longitude: coords.lon,
      },
      weatherConditions: {
        temperature: tempData,
        rainfall: rainData,
        windSpeed: windData,
      },
      forecastSource: "NASA POWER Project (LARC)",
      status: "Success",
    };
  } catch (error) {
    return {
      query: { location: locationName, date: date },
      status: "Error",
      message: `Failed to retrieve weather data. ${error.message}`,
    };
  }
}
