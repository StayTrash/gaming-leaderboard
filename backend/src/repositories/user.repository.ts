import { pool } from "../config/db";

export async function createUser(username: string) {
  const query = `
    INSERT INTO users (username)
    VALUES ($1)
    RETURNING id, username, join_date
  `;

  const result = await pool.query(query, [username]);

  return result.rows[0];
}
