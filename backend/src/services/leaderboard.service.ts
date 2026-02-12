import { submitScoreTransaction } from "../repositories/leaderboard.repository";

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
