// backend/server.js
import express from "express";
import weatherRoutes from "./routes/weather.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Mount weather routes
app.use("/api/weather", weatherRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
