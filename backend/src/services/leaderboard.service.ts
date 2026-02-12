import { submitScoreTransaction } from "../repositories/leaderboard.repository";
import { getTopPlayers, getPlayerRank } from "../repositories/leaderboard.repository";

export async function submitScoreService(
  userId: number,
  score: number
) {
  if (!userId || score === undefined) {
    throw new Error("User ID and score are required");
  }

  if (score < 0) {
    throw new Error("Score cannot be negative");
  }

  await submitScoreTransaction(userId, score);

  return { message: "Score submitted successfully" };
}

export async function getTopPlayersService() {
    return await getTopPlayers();
  }

  export async function getPlayerRankService(userId: number) {
    if (!userId) {
      throw new Error("User ID is required");
    }
  
    const result = await getPlayerRank(userId);
  
    if (!result) {
      throw new Error("User not found in leaderboard");
    }
  
    return result;
  }
