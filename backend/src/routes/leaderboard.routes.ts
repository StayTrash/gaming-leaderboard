import { Router } from "express";
import { getTopPlayers, submitScore } from "../controllers/leaderboard.controller";

const router = Router();

router.post("/submit", submitScore);
router.get("/top", getTopPlayers);

export default router;
