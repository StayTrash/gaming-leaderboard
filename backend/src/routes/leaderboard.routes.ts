import { Router } from "express";
import { getTopPlayers, submitScore, getPlayerRank } from "../controllers/leaderboard.controller";

const router = Router();

router.post("/submit", submitScore);
router.get("/top", getTopPlayers);
router.get("/rank/:userId", getPlayerRank);




export default router;
