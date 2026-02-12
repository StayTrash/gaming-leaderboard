import { Pool } from "pg";

export const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "your_password",
  database: "leaderboard",
  port: 5432,
});
