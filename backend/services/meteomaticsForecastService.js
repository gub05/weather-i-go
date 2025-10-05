import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv to look for .env in the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });
import fetch from "node-fetch";

const METEOMATICS_USERNAME = process.env.METEOMATICS_USERNAME;
const METEOMATICS_PASSWORD = process.env.METEOMATICS_PASSWORD;
const BASE_URL_METEOMATICS = "https://api.meteomatics.com";

/**
 * Geocoding function for Meteomatics (same as NASA service)
 */
async function geologicalLocation(locationName) {
  console.log(`Geocoding location for Meteomatics: ${locationName}`);
  
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
    throw error; // Re-throw the error instead of using fallback
  }
}

const TEMP_PARAM = "t_2m:C";     // 2 Meter Air Temperature in Celsius
const RAIN_PARAM = "precip"; // Precipitation
const WIND_PARAM = "wind_speed_10m";    // 10 Meter Wind Speed

const CLIMATE_SCENARIO = "mri-esm2-ssp585"; 

function getAuthorization(){
    if (!METEOMATICS_USERNAME || !METEOMATICS_PASSWORD) {
        throw new Error("Meteomatics credentials not working or not configured in .env"); 
    }
    const credentials = `${METEOMATICS_USERNAME}:${METEOMATICS_PASSWORD}`;
    const credentialInFormat = Buffer.from(credentials).toString('base64');
    return {
        'Authorization': `Basic ${credentialInFormat}`, 'Accept': 'application/json'
    }

}

const cleanValue = (val) => val !== null && val !== undefined
? parseFloat(val).toFixed(2)
: null;

async function fetchMeteomaticsData(dataQuery, lat, lon, parameters, modelSource = "mix") {
    const location = `${lat},${lon}`;
    // Try the correct Meteomatics API format without model parameter
    const url = `${BASE_URL_METEOMATICS}/${dataQuery}/${parameters}/${location}/json`;

    console.log(`Fetching Meteomatics URL: ${url}`);
    
    const response = await fetch(url, {headers: getAuthorization()});
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Meteomatics API error: Status ${response.status} - ${error}`);
    }
    return await response.json();
}

//Handling short-term to long-term forecasts
export async function getMeteomaticsForecast(locationName, date, model = 'standard') {
    const coords = await geologicalLocation(locationName);
    const parameters = [TEMP_PARAM].join(",");
    const source = (model == 'seasonal') ? "ecmwf_ensemble" : "ecmwf";
    const isoDate = `${date}T12:00:00Z`;

    const rawData = await fetchMeteomaticsData(isoDate, coords.lat, coords.lon, parameters, source);

    //Extraction logic for Meteomatics 
    const tempValue = rawData?.data?.find(d => d.parameter === TEMP_PARAM)?.coordinates[0]?.dates?.[0]?.value;
    const rainValue = rawData?.data?.find(d => d.parameter === RAIN_PARAM)?.coordinates[0]?.dates?.[0]?.value;
    const windValue = rawData?.data?.find(d => d.parameter === WIND_PARAM)?.coordinates[0]?.dates?.[0]?.value;

    // Temperature is already in Celsius from t_2m:C parameter
    const tempCelsius = tempValue ? parseFloat(tempValue).toFixed(2) : null;
    
    return {
        query: {location: locationName, date: date, latitude: coords.lat, longitude: coords.lon, modelUsed: source }, 
        weatherConditions: {
            temperature: { value: tempCelsius, unit: "C", label: "Forecasted Temperature" },
            precipitation: { value: cleanValue(rainValue), unit: "mm/h", label: "Forecasted Precipitation" },
            windSpeed: { value: cleanValue(windValue), unit: "m/s", label: "Forecasted Wind Speed" }
        }, 
        forecastSource: `Meteomatics (${model} Forecast)`,
        status: "Success - Forecast Data"
    };
}

//fetches long term climate projection 

export async function getMeteoClimateProjection(locationName, date) {
    const coords = await geologicalLocation(locationName);
    const parameters = [TEMP_PARAM, RAIN_PARAM, WIND_PARAM].join(",");
    const isoDate = `${date}T12:00:00Z`;

    const rawData = await fetchMeteomaticsData(isoDate, coords.lat, coords.lon, parameters, CLIMATE_SCENARIO);

    const tempValue = rawData?.data?.find(d => d.parameter === TEMP_PARAM)?.coordinates[0]?.dates?.[0]?.value;
    const rainValue = rawData?.data?.find(d => d.parameter === RAIN_PARAM)?.coordinates[0]?.dates?.[0]?.value;
    const windValue = rawData?.data?.find(d => d.parameter === WIND_PARAM)?.coordinates[0]?.dates?.[0]?.value;

    return {
        query: { location: locationName, date: date, scenario: CLIMATE_SCENARIO },
        weatherConditions: {
            temperature: { value: cleanValue(tempValue), unit: "C", label: "Projected Temperature" },
        
        },
        forecastSource: `Meteomatics Climate Projection (Model: SSP585)`,
        predictionConfidence: "LOW (Model Simulation)",
        status: "Success - Climate Projection Data"
    };
}

/**
 * Main function that automatically chooses between NASA (past) and Meteomatics (future)
 * based on the date
 */
export async function getWeatherSummary(locationName, date) {
    try {
        const today = new Date();
        const targetDate = new Date(date);
        
        // If date is in the future, use Meteomatics
        if (targetDate > today) {
            console.log(`🔮 Future date detected, using Meteomatics forecast for ${date}`);
            return await getMeteomaticsForecast(locationName, date);
        } else {
            console.log(`Past date detected, using NASA historical data for ${date}`);
            // Import NASA service dynamically to avoid circular imports
            const { getSummary } = await import('../nasaService.js');
            return await getSummary(locationName, date);
        }
    } catch (error) {
        // Return error status for unrecognizable locations
        return {
            status: "Error",
            message: error.message,
            location: locationName,
            date: date
        };
    }
}