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
  const prompt = `Explain the following weather data in simple, clean text without markdown formatting, bullet points, or special characters. Just use plain text with periods and commas: ${JSON.stringify(weatherData)}`;
  return askGemini(prompt);
}

//function to compare two weather forecasts using Gemini
export async function compareForecasts(forecast1, forecast2) {
  const prompt = `Compare the user's desired weather with the actual weather. Write in simple, clean text without markdown formatting, bullet points, asterisks, or special characters.
Forecast 1 is the user's desired weather conditions and forecast 2 is the actual weather conditions.
Compare the two forecasts and explain the differences in simple terms for a user and explain whether it's compatible or not. It should
be readable and user friendly and not too technical and not too long, short and simple but friendly.

User's desired weather: ${JSON.stringify(forecast1)}
Actual weather: ${JSON.stringify(forecast2)}`;
  return askGemini(prompt);
}


