import { pool } from "../config/db";

export async function submitScoreTransaction(userId: number, score: number) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Insert game session
    await client.query(
      `INSERT INTO game_sessions (user_id, score, game_mode)
       VALUES ($1, $2, 'solo')`,
      [userId, score],
    );

    // 2️⃣ Update leaderboard using UPSERT
    await client.query(
      `INSERT INTO leaderboard (user_id, total_score)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE
       SET total_score = leaderboard.total_score + EXCLUDED.total_score`,
      [userId, score],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getTopPlayers() {
  const query = `
      SELECT user_id, total_score
      FROM leaderboard
      ORDER BY total_score DESC
      LIMIT 10
    `;

  const result = await pool.query(query);

  return result.rows;
}

export async function getPlayerRank(userId: number) {
  const query = `
      SELECT 
        (SELECT COUNT(*) + 1 
         FROM leaderboard 
         WHERE total_score > l.total_score) AS rank,
        l.total_score
      FROM leaderboard l
      WHERE l.user_id = $1
    `;

  const result = await pool.query(query, [userId]);

  return result.rows[0];
}
