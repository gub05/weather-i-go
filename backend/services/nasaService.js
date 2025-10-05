import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv to look for .env in the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

import fetch from "node-fetch"; // <--- ensures fetch works in Node

// NASA POWER API endpoint and constants
const BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";


// Parameter keys
const TEMP_PARAM = "T2M";     // Daily Mean 2 Meter Air Temperature
const RAIN_PARAM = "PRECTOT"; // Daily Total Precipitation
const WIND_PARAM = "WS2M";    // Daily Mean 2 Meter Wind Speed


const cleanValue = (val) => val !== null && val !== undefined && val !== -999
? parseFloat(val).toFixed(2)
: null;


/**
 * Geocoding function for NASA service
 */
async function geologicalLocation(locationName) {
  console.log(`Geocoding location for NASA: ${locationName}`);
  
  // Check for obviously invalid locations (single characters, very short strings, etc.)
  if (!locationName || locationName.trim().length < 2 || /^[a-zA-Z]$/.test(locationName.trim())) {
    throw new Error(`Location "${locationName}" is not a valid place name. Please enter a real city, country, or location.`);
  }
  
  try {
    const encodedLocation = encodeURIComponent(locationName);
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1`;
    
    const response = await fetch(geocodingUrl, {
      headers: {
        'User-Agent': 'WeatherApp/1.0'
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
      
      console.log(`Found coordinates for ${locationName}:`, coords);
      return coords;
    } else {
      throw new Error(`Sorry, I couldn't find "${locationName}". Please check the spelling and try a different location.`);
    }
    
  } catch (error) {
    console.error(`Geocoding error for ${locationName}:`, error.message);
    throw error;
  }
}

/**
 * Fetch data from NASA POWER API for a given date and parameters
 */
async function fetchNasaData(lat, lon, date, parameters) {
  const nasaDate = date.replace(/-/g, "");

  const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&startDate=${nasaDate}&endDate=${nasaDate}&parameters=${parameters}&community=AG&format=JSON`;
  

  console.log(`Fetching NASA URL: ${url}`);  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NASA API error: Status ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`NASA data received:`, JSON.stringify(data).slice(0, 200));
  
  return data.properties || data;
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
  const avgTemperature = cleanValue(dailyData?.[dateKey]);

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
  const totalRainfall = cleanValue(dailyData?.[dateKey]);

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
  const avgWindSpeed = cleanValue(dailyData?.[dateKey]);

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
