import express from "express";
import { getSummary } from "../nasaService.js";
import { explainWeather, compareForecasts } from "../ai.js"; // make sure compareForecasts is imported

const router = express.Router();

router.get("/explain", async (req, res) => {
const { location, date, desiredTemp, desiredCondition, desiredHumidity } = req.query;

  // check required params
  if (!location || !date) {
    return res.status(400).json({ error: "Missing location or date" });
  }

  try {
    // Get actual forecast from NASA
    const weatherData = await getSummary(location, date);

    if (weatherData.status === "Error") {
      return res.status(500).json(weatherData);
    }

    // Build user's desired forecast (if provided, otherwise null)
    const desiredForecast = desiredTemp && desiredCondition && desiredHumidity ? {
      temperature: Number(desiredTemp),
      condition: desiredCondition,
      humidity: Number(desiredHumidity),
    } : null;

    //Ask Gemini to explain the NASA weather data and compare 
    const explanation = await explainWeather(weatherData);
    let comparison = null;
    if (desiredForecast) {
      comparison = await compareForecasts(desiredForecast, weatherData);
    }

    //Return AI responses
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