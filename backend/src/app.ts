import express from "express";
import userRoutes from "./routes/user.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";

const app = express();

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

export default app;
