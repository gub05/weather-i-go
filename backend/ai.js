// ai.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); 
import { GoogleGenerativeAI } from "@google/generative-ai";

// Create Gemini client with your API key
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function askGemini(prompt) {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const response = await model.generateContent(prompt);

    return response.response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    throw err;
  }
}

//function to explain weather data using Gemini
export async function explainWeather(weatherData) {
  const prompt = `Explain the following weather data in simple terms for a user: ${JSON.stringify(weatherData)}`;
  return askGemini(prompt);
}

//function to compare two weather forecasts using Gemini
export async function compareForecasts(forecast1, forecast2) {
  const prompt = `Forecast 1 is the user's desired weather conditions and forecast 2 is the actual weather conditions.
  Compare the two forecasts and explain the differences in simple terms for a user and explain whether it's compatible or not. It should
  be readable and user friendly and not too technical and not too long, short and simple but friendly.
  Forecast 1: ${JSON.stringify(forecast1)}
  Forecast 2: ${JSON.stringify(forecast2)}`;
  return askGemini(prompt);
}

// // Test the function (this is OUTSIDE askGemini)
explainWeather({  temperature: 100, condition: "sunny", humidity: 80}).then((explanation) => {
  console.log("Weather explanation:", explanation);
});
compareForecasts(
  { temperature: 100, condition: "sunny", humidity: 80 },
  { temperature: 85, condition: "sunny", humidity: 70 }
).then((comparison) => {
  console.log("Forecast comparison:", comparison);
});
