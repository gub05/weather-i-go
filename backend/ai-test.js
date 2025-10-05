import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Create Gemini client with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function askGemini(prompt) {
  try {
    // Pick a model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content
    const result = await model.generateContent(prompt);

    return result.response.text(); // Gemini’s reply
  } catch (err) {
    console.error("Gemini error:", err);
    throw err;
  }
}

// Test the function
askGemini("Tell me a joke about programmers").then((result) => {
  console.log("Gemini says:", result);
});
