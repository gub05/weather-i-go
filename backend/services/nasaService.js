require('dotenv').config();

// backend/nasaService.js
import fetch from "node-fetch"; // <--- ensures fetch works in Node


//Metematics credentials from .env

// NASA POWER API endpoint and constants
const BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";
// const COMMUNITY = "AG";
// const FORMAT = "JSON";

// Parameter keys
const TEMP_PARAM = "T2M";     // Daily Mean 2 Meter Air Temperature
const RAIN_PARAM = "PRECTOT"; // Daily Total Precipitation
const WIND_PARAM = "WS2M";    // Daily Mean 2 Meter Wind Speed

/**
 * Mock Geocoding (replace with a real API later)
 */
// async function geologicalLocation(locationName) {
//   console.warn(`[Geocoding] Using mock coordinates for: ${locationName}`);

//   if (locationName.toLowerCase().includes("san francisco")) {
//     return { lat: 37.7749, lon: -122.4194 };
//   }

//   return { lat: 40.7128, lon: -74.006 }; // fallback (NYC)
// }

/**
 * Clean invalid NASA values (-999)
 */

const cleanValue = (val)  => value !== null && value !== underfined
? parseFloat(value).toFixed(2)
: null;
// function sanitize(val) {
//   return val === undefined || val === null || val === -999 || val === "-999"
//     ? null
//     : parseFloat(val).toFixed(2);
// }

/**
 * Fetch data from NASA POWER API for a given date and parameters
 */
async function fetchNasaData(lat, lon, date, parameters) {
  const nasaDate = date.replace(/-/g, "");

  const url = `${BASE_URL}latitude=${lat}&Longitude=${long}&startDate=${nasaDate}&sendData=${nasaDate}&parameter=${parameters}&communit=AG&format=JSON`;
  //const url = `${NASA_POWER_BASE_URL}latitude=${lat}&longitude=${lon}&start_date=${nasaDate}&end_date=${nasaDate}&parameters=${parameters}&community=AG&format=JSON`;
  // url.searchParams.append("latitude", lat);
  // url.searchParams.append("longitude", lon);
  // url.searchParams.append("start", nasaDate);
  // url.searchParams.append("end", nasaDate);
  // url.searchParams.append("parameters", parameters);
  // url.searchParams.append("community", COMMUNITY);
  // url.searchParams.append("format", FORMAT);

  // console.log("Fetching NASA URL:", url.toString());   // 👈 log the full URL

  // try {
  //   const response = await fetch(url.toString());
  //   console.log("NASA response status:", response.status);  // 👈 log status

  //   if (!response.ok) {
  //     throw new Error(`NASA API error: Status ${response.status}`);
  //   }

  //   const data = await response.json();
  //   console.log("NASA data received:", JSON.stringify(data).slice(0, 200)); // 👈 preview data
  //   return data.properties || data;
  // } catch (error) {
  //   console.error(" NASA fetch error:", error);
  //   throw new Error("Could not retrieve data from NASA service.");
  // }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Meteomatics API error: Status ${response.status}`);
  }
  return (await response.json()).properties;
}


//This function gets the historical data for long-term projection baseline. 

export async function getNasaClimateSummary(coords, locationName, date) {
  try{
    const parameters = [TEMP_PARAM, RAIN_PARAM, WIND_PARAM].join(",");
    const rawData = await fetchNasaData(coords.lat, coords.lon, date, parameters);
    const dateKey = date.replace(/-/g, "");

    const tempValue = rawData?.parameter?.[TEMP_PARAM]?.[dateKey];
    const rainValue = rawData?.parameter?.[RAIN_PARAM]?.[dateKey];

    return { 
      query: { location: locationName, date: date, source: "NASA POWER" }, 
      weatherConditions: {
        temperature: { value: cleanValue(tempValue), unit: "C", label: "Average Historical Temperature" },
        rainfall: { value: cleanValue(rainValue), unit: "mm", label: "Total Historical Rainfall" },
      }, 
      quickEvaluation: {
        isHot: parseFloat(cleanValue(tempValue)) > 30,
        isRainy: parseFloat(cleanValue(rainValue)) > 5,

      }, 
      forecastSource: "NASA POWER Project (Historical Climate Baseline)",
      status: "Sucess - Climate Context"
    };
  } catch (error) {
    throw new Error("Could not retrieve climate summary from NASA service.");
  }
}

//MIGHT HAVE TO COMMENT THIS OUT
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
