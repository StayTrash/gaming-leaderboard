import { getPlayerRank } from "../repositories/leaderboard.repository";
import { createUser } from "../repositories/user.repository";

export async function createUserService(username: string) {
  if (!username || username.trim() === "") {
    throw new Error("Username is required");
  }

  return await createUser(username);
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