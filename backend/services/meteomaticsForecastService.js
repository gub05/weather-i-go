import 'dotenv/config';

const METEOMATICS_USERNAME = process.env.METEOMATICS_USERNAME;
const METEOMATICS_PASSWORD = process.env.METEOMATICS_PASSWORD;
const BASE_URL_METEOMATICS = "https://api.meteomatics.com";

const TEMP_PARAM = "t2m";     // 2 Meter Air Temperature
const RAIN_PARAM = "precip_24h"; // 24 Hour Precipitation
const WIND_PARAM = "wind_10m:ms";    // 10 Meter Wind Speed

const CLIMATE_SCENARIO = "mri-esm2-ssp585"; 

function getAuthorization(){
    if (!USERNAME || !PASSWORD) {
        throw new Error("Meteomatics credentials not working or not configured in .env"); 
    }
    const credentials = `${METEOMATICS_USERNAME}:${METEOMATICS_PASSWORD}`;
    const credentialInFormat = Buffer.from(credentials).toString('base64');
    return {
        'Authorization': `Basic ${credentialInFormat}`, 'Accept': 'application/json'
    }

}

const cleanValue = (val)  => value !== null && value !== underfined
? parseFloat(value).toFixed(2)
: null;

async function fetchMeteomaticsData(dataQuery, lat, lon, parameters, modelSource = "mix") {
    const location = `${lat},${lon}`;
    const url = `${BASE_URL_METEOMATICS}/${dataQuery}/${location}/json?model=${modelSource}`;

    const response = await fetch(url, {headers: getAuthorization()});
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Meteomatics API error: Status ${response.status} - ${error}`);
    }
    return await response.json();
}

//Handling short-term to 
export async function getMeteomaticsForecast(coords, locationName, date, model = 'standard') {
    const parameters = [TEMP_PARAM, RAIN_PARAM, WIND_PARAM].join(",");
    const source = (model == 'seasonal') ? "ecmwf_ensemble" : "mix";
    const isoDate = `${date}T12:00:00Z`;

    const rawData = await fetchMeteomaticsData(isoDate, coords.lat, coords.lon, parameters, modelSource);

    //Extraction logic for Meteomatics 
    const tempValue = rawData?.data?.find(d => d.parameter === TEMP_PARAM)?.coordinates[0]?.dates?.[0]?.value;
    const rainValue = rawData?.data?.find(d => d.parameter === RAIN_PARAM)?.coordinates[0]?.dates?.[0]?.value;
    const windValue = rawData?.data?.find(d => d.parameter === WIND_PARAM)?.coordinates[0]?.dates?.[0]?.value;

    return {
        query: {location: locationName, date: date, modelUsed: modelSource }, 
        weatherConditions: {
            temperature: { value: cleanValue(tempValue), unit: "C", label: "Forecasted Temperature" },
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