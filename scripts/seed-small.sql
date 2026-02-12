-- Quick seed for local testing (small dataset)
-- Run after schema.sql. Much faster than full seed.sql.
-- Example: psql -U postgres -d leaderboard -f scripts/seed-small.sql

-- Users: 10k
INSERT INTO users (username)
SELECT 'user_' || generate_series(1, 10000)
ON CONFLICT (username) DO NOTHING;

-- Game sessions: 50k
INSERT INTO game_sessions (user_id, score, game_mode, timestamp)
SELECT
  floor(random() * 10000 + 1)::int,
  floor(random() * 10000 + 1)::int,
  CASE WHEN random() > 0.5 THEN 'solo' ELSE 'team' END,
  NOW() - INTERVAL '1 day' * floor(random() * 365)
FROM generate_series(1, 50000);

-- Leaderboard from aggregation
INSERT INTO leaderboard (user_id, total_score, rank)
SELECT user_id, SUM(score)::int AS total_score, RANK() OVER (ORDER BY SUM(score) DESC)::int AS rank
FROM game_sessions
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_score = EXCLUDED.total_score,
  rank = EXCLUDED.rank;
