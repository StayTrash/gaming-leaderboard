-- Gaming Leaderboard - Database Schema
-- Run this first to create tables. Requires database "leaderboard" to exist.
-- Example: psql -U postgres -d leaderboard -f scripts/schema.sql

-- Drop if re-running (optional; comment out in production)
-- DROP TABLE IF EXISTS leaderboard;
-- DROP TABLE IF EXISTS game_sessions;
-- DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  game_mode VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  total_score INT NOT NULL,
  rank INT,
  UNIQUE(user_id)
);
