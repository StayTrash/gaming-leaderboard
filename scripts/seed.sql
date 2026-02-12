-- Gaming Leaderboard - Seed Data (Large Dataset)
-- Run after schema.sql. Ensure DB has schema and database "leaderboard" exists.
-- Example: psql -U postgres -d leaderboard -f scripts/seed.sql
--
-- To reduce run time, change the generate_series bounds below:
--   e.g. 1000000 -> 10000 for users, 5000000 -> 50000 for game_sessions

-- 1. Populate Users (1 million records)
INSERT INTO users (username)
SELECT 'user_' || generate_series(1, 1000000)
ON CONFLICT (username) DO NOTHING;

-- 2. Populate Game Sessions (5 million records with random scores)
INSERT INTO game_sessions (user_id, score, game_mode, timestamp)
SELECT
  floor(random() * 1000000 + 1)::int,
  floor(random() * 10000 + 1)::int,
  CASE WHEN random() > 0.5 THEN 'solo' ELSE 'team' END,
  NOW() - INTERVAL '1 day' * floor(random() * 365)
FROM generate_series(1, 5000000);

-- 3. Populate Leaderboard by aggregating scores (SUM per user, then rank)
INSERT INTO leaderboard (user_id, total_score, rank)
SELECT user_id, SUM(score)::int AS total_score, RANK() OVER (ORDER BY SUM(score) DESC)::int AS rank
FROM game_sessions
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_score = EXCLUDED.total_score,
  rank = EXCLUDED.rank;
