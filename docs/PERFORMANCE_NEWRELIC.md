# Performance & New Relic Dashboard

This document captures the **performance report** for the Gaming Leaderboard backend under load, using **New Relic APM** for monitoring. Screenshots are stored in the [`newrelic/`](../newrelic/) folder.

---

## Screenshots

The following screenshots were taken while running the backend under load (e.g. via `python load_test.py`). They show throughput, response times, and database/transaction breakdown.

### 1. Overview / Summary

![New Relic – Overview](../newrelic/image1.png)

*Dashboard overview: request throughput, response time, and overall health of the Leaderboard Backend app.*

---

### 2. Transaction / API latency

![New Relic – Transactions / Latency](../newrelic/image2.png)

*Transaction breakdown: latency and throughput per endpoint (e.g. GET /api/leaderboard/top, POST /api/leaderboard/submit, GET /api/leaderboard/rank/:userId).*

---

### 3. Database & bottlenecks

![New Relic – Database / Bottlenecks](../newrelic/image3.png)

*Database and external services: time spent in PostgreSQL and Redis; helps identify slow queries and bottlenecks.*

---

## Takeaways

- **Caching:** GET `/api/leaderboard/top` is cached in Redis (10s TTL), reducing DB load and improving latency.
- **Consistency:** Score submit runs in a single DB transaction and invalidates the top-10 cache so the next read is fresh.
- **Indexes:** Indexes on `leaderboard(total_score DESC)` and `game_sessions(user_id)` keep top-10 and rank queries fast.
- **Monitoring:** New Relic APM is used to track API latencies, spot slow queries, and set alerts for response time thresholds.

For setup details (license key, app name), see the main [README](../README.md#environment) and ensure `NEW_RELIC_LICENSE_KEY` and `NEW_RELIC_APP_NAME` are set in `backend/.env`.
