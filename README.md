# Weather-I-Go 
 
## Inspiration  
Most weather apps only give you numbers like **temperature**, **humidity**, or **wind speed**. While that’s useful, it doesn’t always help you know what the day will _feel_ like or whether it matches your idea of good weather. We wanted to create something that explains the weather in **plain language** and tells you if it lines up with what you consider the perfect day. That’s where **Weather-I-Go** came from.  

## What it does  
Weather-I-Go takes your **location**, **date**, and your **“perfect weather” preferences** (for example, sunny and \\(25^\\circ C\\)) and then:  

1. Pulls real data from **NASA’s POWER API** and **MateoMedics Weather API**, which even includes data stretching into the future up to the year **2100**.  
2. Uses **AI** to explain the numbers in simple, friendly text so they’re easy to understand.  
3. Compares the actual conditions to your “perfect weather,” letting you know right away whether the day matches what you’re hoping for.  

_It’s like having a personal weather guide that speaks your language._  

## How we built it  
- **Frontend:** React with Tailwind CSS for a clean and responsive design.  
- **Backend:** Node.js + Express to connect the frontend with NASA data and AI services.  
- **Data:** NASA POWER API for weather parameters and Google Earth Engine for geospatial context.  
- **AI:** Gemini to explain the weather in a way that feels clear and personal.  

