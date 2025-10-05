// backend/server.js
import express from "express";
import weatherRoutes from "./routes/weather.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Add CORS support for React Native web
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Add a simple test route
app.get("/", (req, res) => {
  res.json({ message: "Weather API Server is running!" });
});

// Mount weather routes
app.use("/api/weather", weatherRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Test endpoint: http://localhost:${PORT}/`);
  console.log(`✅ Weather endpoint: http://localhost:${PORT}/api/weather/explain`);
});
