# Gaming Leaderboard – Assignment Status

**What’s done vs what to do next**, aligned with the take-home assignment.

---

## ✅ Done

### 0. Basic APIs
- **POST /api/leaderboard/submit** – Accepts `user_id` and `score`, validates types (400 if not numbers). Inserts into `game_sessions` and upserts `leaderboard.total_score`.
- **GET /api/leaderboard/top** – Returns top 10 players by `total_score` DESC.
- **GET /api/leaderboard/rank/:userId** – Returns rank (computed) and `total_score` for a user; 400 if not on leaderboard.
- **Database** – Schema matches assignment: `users`, `game_sessions`, `leaderboard` with `UNIQUE(user_id)` on leaderboard for upsert.

### 1. Database with large dataset
- **scripts/schema.sql** – Creates tables.
- **scripts/seed.sql** – 1M users, 5M game_sessions, leaderboard from `SUM(score)` per user (assignment uses same idea; they wrote AVG in one place but rank by SUM).
- **scripts/seed-small.sql** – 10k users, 50k sessions for fast local/testing use.
- **scripts/indexes.sql** – Indexes for `leaderboard(total_score DESC)` and `game_sessions(user_id)`.

### 2. Simulate real user usage
- **load_test.py** – Loop: random `user_id` (1 to `MAX_USER_ID`), submit score → get top players → get user rank → sleep 0.5–2s. Set `MAX_USER_ID = 10000` for small seed, `1000000` for full seed.

### 3. New Relic
- **Integration** – `newrelic` in backend, `import "newrelic"` first in `server.ts`, `newrelic.js` config.
- **Monitoring** – APM tracks API latencies and DB; bottlenecks and slow queries visible in dashboard. Alerts are configured in the New Relic UI (not in repo).

### 4. API latency
- **Indexing** – `indexes.sql` applied after seed.
- **Caching** – Redis cache for GET `/top` (key `leaderboard:top10`, TTL 10s); invalidated on submit.
- **Queries** – Single queries for top 10 and rank; no N+1.
- **Concurrency** – pg Pool; submit runs in a transaction.

### 5. Atomicity and consistency
- **Transactions** – Submit: BEGIN → INSERT `game_sessions` → UPSERT `leaderboard` → COMMIT; ROLLBACK on error.
- **Cache invalidation** – `redis.del("leaderboard:top10")` on submit.
- **Consistency** – One transaction per submit; next `/top` read is fresh after invalidation.

### 6. Frontend with live updates
- **Top 10** – Table (Rank, User ID, Score), polling every 3s.
- **User rank lookup** – Input user ID, “Check Rank”, shows rank and total score.

### Other criteria
- **Unit tests** – `backend/src/__tests__/leaderboard.api.test.ts`: 6 tests for the three leaderboard APIs (status, shape, validation, rank types).
- **Rate limiting** – `express-rate-limit` (200/min per IP), disabled in test.
- **README** – Setup, env, DB, seed, indexes, run backend/frontend, load test, tests, API list, structure, performance notes.

---

## 🔲 To do next

| # | Item | Priority | Notes |
|---|------|----------|--------|
| 1 | **New Relic license key** | High (security) | Use `process.env.NEW_RELIC_LICENSE_KEY` in `newrelic.js`; do not commit real key. README already mentions optional env. |
| 2 | **Performance report** | Required deliverable | Run backend under load (`load_test.py`), capture New Relic dashboard/screenshots (latency, throughput, slow queries). Add a short **Performance report** section to README or a `PERFORMANCE.md` with screenshots and 2–3 bullet takeaways. |
| 3 | **Documentation (HLD/LLD)** | If required | Assignment asks for “Documentation (HLD/LLD)”. Either add a **High-Level Design** (components, data flow, cache, DB) and **Low-Level Design** (API contracts, key modules) in README or in separate `docs/HLD.md` and `docs/LLD.md`. |
| 4 | **Jest exit** | Low | Tests pass but Jest warns about open handles (pool/Redis). Optional: in test file `afterAll`, call `pool.end()` and `redis.quit()` so Jest exits cleanly (or use `--forceExit` in CI). |
| 5 | **Demo** | Per assignment | Record a short demo (APIs + frontend + load test + New Relic) if submission expects it. |

---

## Summary

- **Implemented:** All three APIs, DB schema, large/small seeds, indexes, load script, New Relic, Redis cache, transactions, cache invalidation, frontend with live top 10 and rank lookup, unit tests, rate limiting, README.
- **Next focus:** (1) Move New Relic license key to env. (2) Produce performance report with New Relic. (3) Add HLD/LLD if required. (4) Optional: fix Jest exit and prepare demo.
