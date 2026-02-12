import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());

/*
  🔹 1️⃣ Middleware: Parse JSON
  This allows us to read req.body in POST requests.
*/
app.use(express.json());

// /*
//   🔹 2️⃣ Rate Limiting Middleware
//   Prevents abuse & protects server from too many requests.
// */
// const limiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute window
//   max: 100,            // max 100 requests per IP per minute
// });

// app.use(limiter);

/*
  🔹 3️⃣ Routes
  These define our API endpoints.
*/
app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

/*
  🔹 4️⃣ Global Error Handler
  Must be AFTER routes.
  Catches all thrown errors.
*/
app.use(errorHandler);

export default app;
