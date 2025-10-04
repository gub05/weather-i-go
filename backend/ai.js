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

// Test the function (this is OUTSIDE askGemini)
askGemini("Tell me a joke about programmers").then((result) => {
  console.log("Gemini says:", result);
});
