import { Request, Response } from "express";
import { submitScoreService } from "../services/leaderboard.service";

export async function submitScore(req: Request, res: Response) {
  try {
    const { user_id, score } = req.body;

    const result = await submitScoreService(user_id, score);

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
