import express from "express";
import userRoutes from "./routes/user.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import { errorHandler } from "./middleware/error.middleware";
import rateLimit from "express-rate-limit";


const app = express();
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // max 100 requests per minute per IP
  });
  
  app.use(limiter);
  
app.use(express.json());
app.use(errorHandler);

app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

export default app;
