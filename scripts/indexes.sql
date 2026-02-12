-- Indexes for API latency optimization
-- Run after schema and seed. Safe to run multiple times (IF NOT EXISTS where supported).
-- Example: psql -U postgres -d leaderboard -f scripts/indexes.sql

-- Top 10 leaderboard: order by total_score DESC LIMIT 10
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score_desc
  ON leaderboard (total_score DESC);

-- leaderboard(user_id) already has a unique index from UNIQUE(user_id) in schema

-- Game sessions by user (for queries per user)
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id
  ON game_sessions (user_id);
