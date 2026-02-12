# Demo Video Script (3–4 minutes)

**Base URL for APIs:** `http://localhost:8000`  
**Frontend:** `http://localhost:3000`

---

## Timing

| Section        | Duration | Cumulative |
|----------------|----------|------------|
| Intro          | 0:20     | 0:20       |
| Frontend       | 1:10     | 1:30       |
| Postman / APIs | 0:50     | 2:20       |
| Load test      | 0:35     | 2:55       |
| New Relic      | 0:40     | 3:35       |
| Wrap-up        | 0:25     | 4:00       |

---

## Script

### [0:00–0:20] Intro
*[Screen: README or project folder]*

> "This is the Gaming Leaderboard project. It lets you submit scores, view the top 10 players, and check any player’s rank. The stack is Express and Next.js, with PostgreSQL, Redis for caching, and New Relic for monitoring. I’ll show the UI, the APIs in Postman, the load test, and the New Relic dashboard."

---

### [0:20–1:30] Frontend
*[Screen: http://localhost:3000]*

> "The app runs at localhost 3000. Here’s the live leaderboard — top 10 by total score, with rank, user ID, and score. It refreshes every 5 seconds."

*[Scroll to “Check Player Rank”]*

> "I’ll check rank for a user — enter an ID, click Check Rank — and we see their rank and total score."

*[Scroll to “Submit Score”]*

> "To submit a score: user ID and score, then Submit. We get a success message and the leaderboard updates on the next refresh or when that user enters the top 10."

---

### [1:30–2:20] Postman / APIs
*[Screen: Postman]*

> "In Postman the base URL is localhost 8000. First, GET **api/leaderboard/top** — no body — we get the top 10 as JSON."

*[Send request, show response]*

> "For a single player’s rank: GET **api/leaderboard/rank** slash the user ID — again JSON with rank and total score."

*[Send request]*

> "To submit: POST **api/leaderboard/submit**, body JSON: **user_id** and **score** as numbers. Success returns 200 and the leaderboard updates on the next top or in the UI."

*[Send one submit request]*

---

### [2:20–2:55] Load test
*[Screen: Terminal]*

> "The load test script simulates real usage. From the project root we run **python load_test.py**. It picks random users, submits scores, fetches top 10 and rank, then sleeps. Use **MAX_USER_ID** 10000 for the small seed or 1000000 for the full dataset. I’ll let it run briefly to generate load for New Relic."

*[Run for 10–15 seconds, then stop or leave running in background]*

---

### [2:55–3:35] New Relic
*[Screen: New Relic APM dashboard]*

> "In New Relic we see the Leaderboard Backend app. Under load we get throughput, response times for the leaderboard endpoints, and database time. The top 10 is cached in Redis with a 10-second TTL and invalidated on submit, so we keep consistency and good latency. Any slow queries or bottlenecks show up here."

*[Point at key charts if you have them]*

---

### [3:35–4:00] Wrap-up
*[Screen: code or README]*

> "The repo includes the README for setup, database schema and seed scripts, indexes for performance, and Jest tests for the leaderboard APIs. Backend uses transactions for score submit and Redis cache invalidation so the leaderboard stays consistent under load. Thanks for watching."

---

## Before You Record

- [ ] Backend running: `cd backend && npm run dev` (port 8000)
- [ ] Frontend running: `cd client && npm run dev` (port 3000)
- [ ] PostgreSQL and Redis running, DB seeded (e.g. `seed-small.sql`)
- [ ] Postman collection ready (use `docs/POSTMAN_APIS.md`)
- [ ] New Relic dashboard open and recently loaded (run load test 30s before)
- [ ] Close extra tabs and mute notifications
