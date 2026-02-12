# Assignment Compliance Report

This document checks the Gaming Leaderboard project against the take-home assignment requirements.

---

## ✅ 0. Basic APIs Setup

| Requirement | Status | Notes |
|-------------|--------|--------|
| **POST /api/leaderboard/submit** (user_id, score) | ✅ | Implemented. Accepts `user_id` and `score`, validates types. |
| **Update game_sessions** on submit | ✅ | `leaderboard.repository.ts`: INSERT into `game_sessions` (user_id, score, game_mode). |
| **GET /api/leaderboard/top** (top 10 by total_score) | ✅ | Implemented. Returns top 10 ordered by `total_score DESC`. |
| **GET /api/leaderboard/rank/{user_id}** | ✅ | Implemented. Returns rank (computed) and total_score. |
| **Database structure** (users, game_sessions, leaderboard) | ⚠️ | Code assumes: (1) `leaderboard` has **UNIQUE(user_id)** for `ON CONFLICT`; (2) assignment schema has `rank INT`—code does not write `rank` (computes on read). Ensure DB has UNIQUE(user_id); `rank` can be NULL or omitted in INSERT. |

**Verdict:** APIs match the assignment. DB schema must include `UNIQUE(user_id)` on `leaderboard` for the current upsert to work.

---

## ⚠️ 1. Setup Database with Large Dataset

| Requirement | Status | Notes |
|-------------|--------|--------|
| SQL scripts to populate 1M users, 5M game_sessions, leaderboard | ❌ | **No SQL migration/seed files in repo.** Assignment asks to "execute the following SQL queries"—you must run them manually or add a `scripts/` or `migrations/` folder with the provided SQL. |
| Reduce table size if needed | — | N/A until scripts exist. |

**Action:** Add a seed script (e.g. `scripts/seed.sql` or `scripts/seed-large.sql`) containing the assignment’s INSERT statements (or reduced versions) and document how to run it.

---

## ❌ 2. Simulate Real User Usage (Python Script)

| Requirement | Status | Notes |
|-------------|--------|--------|
| Loop: random user_id → submit_score → get_top_players → get_user_rank → sleep 0.5–2s | ⚠️ | **Script logic differs from assignment.** |
| **Assignment:** `user_id = random.randint(1, 1000000)` | ❌ | **Current:** `user_id = random.choice(valid_users)` where `valid_users` = only users from **current top 10**. So only 10 users ever get submissions—does not simulate "millions of game records" or real spread. |

**Action:** Change `load_test.py` to use `random.randint(1, 1000000)` (and remove `get_valid_users()` / `valid_users`) so it matches the assignment and stresses the system correctly.

---

## ✅ 3. New Relic for Monitoring

| Requirement | Status | Notes |
|-------------|--------|--------|
| Integrate New Relic | ✅ | `newrelic` in package.json; `import "newrelic"` in `server.ts` (first line); `newrelic.js` config present. |
| Track API latencies under load | ✅ | Default Node agent instruments HTTP. |
| Identify bottlenecks / slow DB queries | ✅ | New Relic APM provides this. |
| Set up alerts for slow response times | ⚠️ | Done in New Relic UI, not in code—document in report. |

**Note:** Remove or redact real license key in `newrelic.js` before sharing (use env var e.g. `process.env.NEW_RELIC_LICENSE_KEY`).

---

## ⚠️ 4. Optimize API Latency

| Requirement | Status | Notes |
|-------------|--------|--------|
| **Database indexing** | ❌ | **No migration or SQL in repo.** For `/top`: index on `leaderboard(total_score DESC)`. For `/rank/:userId`: index on `leaderboard(user_id)`. For submit: `game_sessions(user_id)` if needed. Add indexes and document. |
| **Caching** | ✅ | Redis cache for GET /top (key `leaderboard:top10`, TTL 10s); invalidated on submit. |
| **Optimizing queries** | ✅ | Top 10: single query with LIMIT 10. Rank: single query with subquery. No N+1. |
| **Handling concurrency** | ✅ | Connection pooling (pg Pool); transaction for submit. |
| **Data consistency** | ✅ | See Section 5. |

**Action:** Add SQL (e.g. in a migration or `scripts/indexes.sql`) to create the recommended indexes and document the optimization.

---

## ✅ 5. Atomicity and Consistency

| Requirement | Status | Notes |
|-------------|--------|--------|
| **Transactions for concurrent writes** | ✅ | `submitScoreTransaction`: BEGIN → INSERT game_sessions → UPSERT leaderboard → COMMIT; ROLLBACK on error. |
| **Cache invalidation** | ✅ | On submit: `redis.del("leaderboard:top10")`. |
| **Leaderboard consistent under high traffic** | ✅ | Single transaction per submit; cache invalidated so next /top read is fresh. |

---

## ✅ 6. Frontend UI with Live Updates

| Requirement | Status | Notes |
|-------------|--------|--------|
| **Top 10 leaderboard** | ✅ | Table with Rank, User ID, Score. |
| **Live-updating** | ✅ | Polling every 3s via `setInterval(fetchLeaderboard, 3000)`. |
| **User rank lookup** | ✅ | Input user ID, button "Check Rank", displays rank and total score. |

---

## Evaluation Criteria (from assignment)

| Criterion | Status | Notes |
|-----------|--------|--------|
| Bug-free working | ⚠️ | **Bug:** `server.ts` line 23 has stray backticks `` ` `` instead of `}` — can cause syntax/run issue. |
| Code quality & efficiency | ✅ | Layered (routes → controllers → services → repositories), clear separation. |
| PRs and change management | — | Repo is git-based; PR workflow is up to you. |
| **Unit tests** | ❌ | No test files (e.g. Jest/Vitest) for API or services. |
| Performance optimization | ⚠️ | Caching + transactions done; **indexing missing**. |
| Data consistency | ✅ | Transactions + cache invalidation. |
| Monitoring & analysis | ✅ | New Relic integrated. |
| **Basic API security** | ⚠️ | CORS enabled; rate limiting **commented out** in `app.ts`. |
| Problem-solving & ownership | — | Subjective. |
| **Documentation (HLD/LLD)** | ❌ | No HLD/LLD or main README for the assignment. Only client’s default Next.js README. |
| Demo | — | To be done by you. |

---

## Deliverables

| Deliverable | Status |
|-------------|--------|
| Backend code | ✅ Present. |
| Frontend code | ✅ Present. |
| Performance report with New Relic (dashboard/screenshots) | ⚠️ To be produced after running load test and indexing. |
| Documentation | ❌ No assignment-specific README, HLD, or LLD. |

---

## Summary: What’s Aligned vs What’s Missing

**Aligned with assignment:**

- All three APIs (submit, top, rank) implemented and behave as specified.
- game_sessions and leaderboard updated on submit; transactions and cache invalidation in place.
- New Relic integrated; frontend has top 10 and rank lookup with live polling.
- Code structure is clean and modular.

**Gaps to address:**

1. **Load script:** Use `random.randint(1, 1000000)` in `load_test.py`; do not limit to top-10 users.
2. **Database:** Add seed SQL (and optionally indexes) to the repo; ensure `leaderboard` has `UNIQUE(user_id)`.
3. **Indexes:** Add and document indexes for `leaderboard(total_score DESC)` and `leaderboard(user_id)` (and optionally `game_sessions`).
4. **Bug:** Fix `server.ts` (replace stray backticks with `}`).
5. **Security:** Enable rate limiting (uncomment and tune in `app.ts`) and use env var for New Relic license key.
6. **Tests:** Add unit tests for at least the three leaderboard APIs or core services.
7. **Docs:** Add README (setup, run, seed, load test), and optionally HLD/LLD as required by the assignment.

---

*Generated for assignment compliance review.*
