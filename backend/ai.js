// ai.js
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv to look for .env in the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

import { GoogleGenerativeAI } from "@google/generative-ai";

// Create Gemini client with your API key
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function askGemini(prompt) {
  try {
    // Try the stable model instead of experimental one
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(prompt);

    return response.response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    throw err;
  }
}

//function to explain weather data using Gemini
export async function explainWeather(weatherData) {
  const prompt = `Hey! I'm looking at the weather forecast and wanted to give you a friendly heads up about what to expect. Here's what I found: ${JSON.stringify(weatherData)}

Please explain this weather data in a warm, friendly tone like you're talking to a friend. Be conversational and encouraging. Don't use bullet points or formal language - just chat about the weather like you would with someone you care about. Mention the temperature, conditions, and what this means for their plans.`;
  return askGemini(prompt);
}

//function to compare two weather forecasts using Gemini
export async function compareForecasts(forecast1, forecast2) {
  const prompt = `Hey there! I wanted to chat with you about your weather expectations versus what's actually happening. 

You were hoping for: ${JSON.stringify(forecast1)}
But the forecast shows: ${JSON.stringify(forecast2)}

Please compare these in a friendly, conversational way like you're talking to a friend. Use phrases like "You were expecting this, but actually..." or "Good news!" or "Unfortunately..." or "The good thing is..." Be encouraging and helpful. Explain if their plans will work out or if they might want to adjust. Keep it warm and personal, like you're genuinely concerned about their day.`;
  return askGemini(prompt);
}


