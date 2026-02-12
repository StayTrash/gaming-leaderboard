import { Request, Response } from "express";
import { submitScoreService } from "../services/leaderboard.service";
import { getTopPlayersService, getPlayerRankService } from "../services/leaderboard.service";


export async function submitScore(req: Request, res: Response, next: any) {
    try {
      const { user_id, score } = req.body;
  
      if (typeof user_id !== "number" || typeof score !== "number") {
        const error = new Error("user_id and score must be numbers");
        (error as any).status = 400;
        throw error;
      }
  
      const result = await submitScoreService(user_id, score);
  
      res.status(200).json({
        success: true,
        data: result,
      });
  
    } catch (error) {
      next(error);
    }
  }

export async function getTopPlayers(req: Request, res: Response) {
    try {
      const players = await getTopPlayersService();
  
      res.status(200).json({
        success: true,
        data: players,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch leaderboard",
      });
    }
  }

  export async function getPlayerRank(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
  
      const result = await getPlayerRankService(userId);
  
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }