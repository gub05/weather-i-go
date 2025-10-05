// backend/routes/weather.js
import express from "express";
import { getWeatherSummary } from "../services/meteomaticsForecastService.js";
import { explainWeather, compareForecasts } from "../ai.js";

const router = express.Router();

router.get("/explain", async (req, res) => {
  const { location, date, desiredTemp, desiredCondition, desiredHumidity } = req.query;

  if (!location || !date) {
    return res.status(400).json({ error: "Missing location or date" });
  }

  try {
    // 1. Smart weather data (NASA for past, Meteomatics for future)
    const weatherData = await getWeatherSummary(location, date);

    if (weatherData.status === "Error") {
      return res.json({
        aiExplanation: `❌ ${weatherData.message}`,
        aiComparison: null
      });
    }

    // 2. Build user preferences JSON
    const desiredForecast =
      desiredTemp && desiredCondition && desiredHumidity
        ? {
            temperature: Number(desiredTemp),
            condition: desiredCondition,
            humidity: Number(desiredHumidity),
          }
        : null;

    // 3. Ask Gemini (with fallback if AI is not available)
    let explanation = null;
    let comparison = null;
    
    try {
      explanation = await explainWeather(weatherData);
    } catch (aiError) {
      console.warn("AI explanation failed, using fallback:", aiError.message);
      explanation = `Hey there! I checked the weather for ${location} on ${date} and it's looking pretty good! The temperature should be around ${weatherData.weatherConditions.temperature.value}°C, which is perfect for your plans. You're going to have a great day! 🌤️`;
    }
    
    try {
      if (desiredForecast) {
        comparison = await compareForecasts(desiredForecast, weatherData);
      }
    } catch (aiError) {
      console.warn("AI comparison failed, using fallback:", aiError.message);
      if (desiredForecast) {
        const actualTemp = weatherData.weatherConditions.temperature.value;
        const desiredTemp = desiredForecast.temperature;
        const tempDiff = Math.abs(actualTemp - desiredTemp);
        
        if (tempDiff <= 2) {
          comparison = `Great news! You were hoping for around ${desiredTemp}°C, and you're getting ${actualTemp}°C - that's pretty much exactly what you wanted! The weather is going to be perfect for your plans! 😊`;
        } else if (actualTemp > desiredTemp) {
          comparison = `Hey! You were expecting around ${desiredTemp}°C, but it's actually going to be ${actualTemp}°C - so it's even warmer than you hoped! Perfect weather for your outdoor activities! 🌞`;
        } else {
          comparison = `You were hoping for around ${desiredTemp}°C, but it's going to be ${actualTemp}°C - a bit cooler than expected. You might want to bring an extra layer, but it should still be a nice day! 🌤️`;
        }
      }
    }

    // 4. Return JSON back to frontend
    res.json({
      aiExplanation: explanation,
      aiComparison: comparison,
    });
  } catch (err) {
    console.error("Weather route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
