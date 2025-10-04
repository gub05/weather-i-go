// Note: NASA POWER API endpoint and parameter constants
const BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const COMMUNITY = 'AG';
const FORMAT = 'JSON';

// Parameter keys used by the NASA POWER API
const TEMP_PARAM = 'T2M'; // Daily Mean 2 Meter Air Temperature
const RAIN_PARAM = 'PRECTOT'; // Daily Total Precipitation
const WIND_PARAM = 'WS2M'; // Daily Mean 2 Meter Wind Speed


/**
 *  Placeholder for Geocoding. You MUST implement this
 * using a service (e.g., Google Maps API) in a real application.
 * @param {string} locationName - The location name (e.g., "Tokyo, Japan").
 * @returns {Promise<{lat: number, lon: number}>} - The coordinates.
 */

async function geologicalLocation(locationName) {
    // Replace this with a real Geocoding API call
    console.warn(`[Geocoding] Using mock coordinates for: ${locationName}`);
    
    // Example Mock Coordinates (e.g., San Francisco)
    if (locationName.toLowerCase().includes('san francisco')) {
        return { lat: 37.7749, lon: -122.4194 };
    }
    // Fallback coordinates (e.g., New York City)
    return { lat: 40.7128, lon: -74.0060 }; 
}

// Fetches data from NASA POWER API for a specific date and parameter set
async function fetchNasaData(lat, lon, date, parameters) {
    // Convert 'YYYY-MM-DD' to 'YYYYMMDD' for the API
    const nasaDate = date.replace(/-/g, '');

    // Construct the query URL
    const url = new URL(BASE_URL);
    url.searchParams.append('latitude', lat);
    url.searchParams.append('longitude', lon);
    url.searchParams.append('start_date', nasaDate);
    url.searchParams.append('end_date', nasaDate);
    url.searchParams.append('parameters', parameters);
    url.searchParams.append('community', COMMUNITY);
    url.searchParams.append('format', FORMAT);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`NASA API error: Status ${response.status}`);
        }
        const data = await response.json();

        // NASA returns data under 'properties' or root depending on params; return the object we expect
        return data.properties || data;
    } catch (error) {
        console.error('Error fetching data from NASA POWER:', error);
        throw new Error('Could not retrieve data from NASA service.');
    }

}

export async function getTemperature(locationName, date) {
    const coords = await geologicalLocation(locationName);
    const rawData = await fetchNasaData(coords.lat, coords.lon, date, TEMP_PARAM);

    const dailyData = rawData?.parameter?.[TEMP_PARAM];
    const dateKey = date.replace(/-/g, '');
    const avgTemperature =
        dailyData && dailyData[dateKey] !== undefined
            ? parseFloat(dailyData[dateKey]).toFixed(2)
            : null;

    return {
        temperatureC: avgTemperature,
        unit: 'C',
        label: 'Average Daily Temperature',
    };
}

export async function getRainfall(locationName, date) {
    const coords = await geologicalLocation(locationName);
    const rawData = await fetchNasaData(coords.lat, coords.lon, date, RAIN_PARAM);

    const dailyData = rawData?.parameter?.[RAIN_PARAM];
    const dateKey = date.replace(/-/g, '');
    const totalRainfall =
        dailyData && dailyData[dateKey] !== undefined
            ? parseFloat(dailyData[dateKey]).toFixed(2)
            : null;

    return {
        rainfall: totalRainfall,
        unit: 'mm',
        label: 'Total Daily Rainfall',
    };
}

export async function getWindSpeed(locationName, date) {
    const coords = await geologicalLocation(locationName);
    const rawData = await fetchNasaData(coords.lat, coords.lon, date, WIND_PARAM);

    const dailyData = rawData?.parameter?.[WIND_PARAM];
    const dateKey = date.replace(/-/g, '');
    const avgWindSpeed =
        dailyData && dailyData[dateKey] !== undefined
            ? parseFloat(dailyData[dateKey]).toFixed(2)
            : null;

    return {
        windspeed: avgWindSpeed,
        unit: 'm/s',
        label: 'Average Daily Wind Speed',
    };
}

/**
 * Combines all weather variables into a single, comprehensive summary JSON object.
 * This is the function the chatbot should call.
 * @param {string} locationName - The location name.
 * @param {string} date - The date in 'YYYY-MM-DD' format.
 * @returns {Promise<object>} A comprehensive summary of weather conditions.
 */
export async function getSummary(locationName, date) {
    try {
        // Fetch the data
        const [tempData, rainData, windData, coords] = await Promise.all([
            getTemperature(locationName, date),
            getRainfall(locationName, date),
            getWindSpeed(locationName, date),
            geologicalLocation(locationName),
        ]);

        // Construct the final, clean JSON object
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

            forecastSource: 'NASA POWER Project (LARC)',
            status: 'Success',
        };
    } catch (error) {
        // Handles errors like bad geocoding or api unreachable
        return {
            query: { location: locationName, date: date },
            status: 'Error',
            message: `Failed to retrieve weather data. ${error.message}`,
        };
    }
}
// End of module