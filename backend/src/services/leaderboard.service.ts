import { submitScoreTransaction } from "../repositories/leaderboard.repository";
import { getTopPlayers, getPlayerRank } from "../repositories/leaderboard.repository";
import { redis } from "../config/redis";

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
  
    // Invalidate cache
    await redis.del("leaderboard:top10");
  
    return { message: "Score submitted successfully" };
  }

  export async function getTopPlayersService() {
    const cacheKey = "leaderboard:top10";
  
    // 1️⃣ Check cache
    const cachedData = await redis.get(cacheKey);
  
    if (cachedData) {
      console.log("⚡ Returning leaderboard from Redis cache");
      return JSON.parse(cachedData);
    }
  
    console.log("📦 Fetching leaderboard from database");
  
    // 2️⃣ Fetch from DB
    const players = await getTopPlayers();
  
    // 3️⃣ Store in cache for 10 seconds
    await redis.set(cacheKey, JSON.stringify(players), "EX", 10);
  
    return players;
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