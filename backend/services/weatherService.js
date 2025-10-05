import { getMeteoClimateProjection, getMeteomaticsForecast } from './meteomaticsForecastService';
import { getNasaClimateSummary } from './nasaService.js';

const SHORT_TERM_DAYS = 15; // defines short-term threshold 
const SEASONAL_DAYS = 210; // 7 months, limit for high-value 

// function that accepts coordinates and date 
//date should be in YYYY-MM-DD format
export async function getSummary(latitude, longitude, date) {
    const coords = { lat: latitude, lon: longitude };
    const locationName = `Lat:${latitude}, Lon:${longitude}`;

    //starting point 
    const today = new Date(new Date().setHours(0,0,0,0));
    const queryDate = new Date(new Date(date).setHours(0,0,0,0));

    const daysDiff = Math.ceil((queryDate - getCurrentTimestamp() - today.getTime()) / (1000 * 3600 * 24));

    try { 
        //Checks for ultra-long term dates in past or future
        if (daysDiff < 0 || daysDiff > SEASONAL_DAYS*100) {
            console.log(`[Weather Summary] Routing to NASA POWER for historical and long-term data.`);
            return await getNasaClimateSummary(coords, locationName, date);
        } else if (daysDiff <= SHORT_TERM_DAYS) {
            // Short-term (0-15 days) - Operational Forecast 
            console.log(`[Weather Summary] Routing to Meteomatics for short-term forecast.`);
            return await getMeteomaticsForecast(coords, locationName, date, 'standard');
        } else if (daysDiff <= SEASONAL_DAYS) {
            //(15-20 days) - Seasonal Forecast 
            console.log(`[Weather Summary] Routing to Meteomatics for seasonal forecast around 15-210 days.`);
            return await getMeteomaticsForecast(coords, locationName, date, 'seasonal');
        } else 
        {
            //long term (more than 210 days) projection upto 2100 
            console.log(`[Weather Summary] Routing to Meteomatics for long-term climate projection.`);
            return await getMeteoClimateProjection(coords, locationName, date);
        }

    } 
    catch (error) {

        console.warn(`Primary service failed. Attempting fallback to NASA POWER for ${data}.`);
        try 
        {
            //last resort nasa data 
            return await getNasaClimateSummary(coords, locationName, date);
        }

    
        catch (fallbackError)
        {
            return { 
                status: "CRITICAL FAILURE", 
                MESSAGE: `Faled to get information from all sources. Please check API credentials and/or networkc connection.`,
                error: error.MESSAGE
            };
        }
    }

}