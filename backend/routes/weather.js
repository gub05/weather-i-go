// backend/routes/weather.js
import express from "express";
import { getSummary } from "../nasaService.js";
import { explainWeather, compareForecasts } from "../ai.js";

const router = express.Router();

router.get("/explain", async (req, res) => {
  const { location, date, desiredTemp, desiredCondition, desiredHumidity } = req.query;

  if (!location || !date) {
    return res.status(400).json({ error: "Missing location or date" });
  }

  try {
    // 1. NASA JSON
    const weatherData = await getSummary(location, date);

    if (weatherData.status === "Error") {
      return res.status(500).json(weatherData);
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

    // 3. Ask Gemini
    const explanation = await explainWeather(weatherData);
    let comparison = null;
    if (desiredForecast) {
      comparison = await compareForecasts(desiredForecast, weatherData);
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
