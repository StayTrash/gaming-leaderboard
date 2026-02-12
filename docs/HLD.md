# High-Level Design (HLD) — Gaming Leaderboard

This document describes the system-level design: goals, architecture, components, data flow, and non-functional considerations. For implementation details see [LLD.md](LLD.md).

---

## 1. System Overview

### 1.1 Purpose

A **Gaming Leaderboard** system that allows:

- **Submit scores** — Record a player’s game score and update their total.
- **View top 10** — Get the top 10 players by total score (cached for performance).
- **Check rank** — Get a specific player’s rank and total score.

### 1.2 Scope

- **In scope:** Backend API (Express), frontend (Next.js), PostgreSQL persistence, Redis caching, monitoring (New Relic), load testing.
- **Out of scope:** Game logic, authentication/authorization, multi-tenant or multi-game support in this HLD.

### 1.3 Key Stakeholders / Users

- **Players / Clients:** Submit scores and view leaderboard/rank via API or web UI.
- **Operators:** Monitor health, latency, and load via New Relic.

---

## 2. Architecture

### 2.1 High-Level Diagram

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                      CLIENTS                             │
                    │  (Browser / Next.js UI, Load Test Script, API consumers) │
                    └───────────────────────────┬─────────────────────────────┘
                                                │ HTTP
                                                ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │              BACKEND (Express, port 8000)                │
                    │  • CORS, JSON, Rate Limit (200/min)                      │
                    │  • /api/leaderboard, /api/users, /health                  │
                    │  • New Relic APM                                          │
                    └───────────────┬─────────────────────┬────────────────────┘
                                    │                     │
                    ┌───────────────▼──────────┐  ┌───────▼────────┐
                    │   PostgreSQL (leaderboard)│  │  Redis (cache) │
                    │   • users, game_sessions  │  │  • top10, 10s  │
                    │   • leaderboard (totals) │  │  • invalidation │
                    └─────────────────────────┘  └─────────────────┘
```

### 2.2 Architectural Style

- **Layered / N-tier:** Presentation (routes/controllers) → Business (services) → Data (repositories, DB, cache).
- **Stateless API:** No server-side session; all state in DB and cache.

### 2.3 Technology Stack

| Layer        | Technology        | Role                          |
|-------------|-------------------|-------------------------------|
| Backend     | Node.js, Express  | REST API, middleware          |
| Frontend    | Next.js, React    | Live leaderboard UI           |
| Database    | PostgreSQL        | Persistent storage            |
| Cache       | Redis             | Top-10 cache, invalidation     |
| Monitoring  | New Relic         | APM, latency, alerts          |
| Load test   | Python + requests | Simulated traffic             |

---

## 3. Components

### 3.1 Backend (Express)

- **Responsibilities:** HTTP API, validation, rate limiting, error handling, DB and cache access.
- **Key sub-components:** Routes, Controllers, Services, Repositories, Config (DB, Redis), Middleware.

### 3.2 Frontend (Next.js)

- **Responsibilities:** Display top 10, submit score, look up rank; consumes backend API.

### 3.3 PostgreSQL

- **Responsibilities:** Source of truth for users, game_sessions, and leaderboard (aggregated totals).

### 3.4 Redis

- **Responsibilities:** Cache for “top 10” response; TTL 10s; invalidated on score submit.

### 3.5 New Relic

- **Responsibilities:** Instrumentation, transaction tracing, latency and throughput visibility.
- **Screenshots:** Dashboard and performance report with screenshots are in [Performance & New Relic](PERFORMANCE_NEWRELIC.md); images live in `newrelic/`.

---

## 4. Data Flow

### 4.1 Submit Score

1. Client sends `POST /api/leaderboard/submit` with `{ user_id, score }`.
2. Backend validates (user_id and score required, score ≥ 0).
3. Service starts transaction: insert `game_sessions` row, upsert `leaderboard` (add score to total).
4. Transaction commits; service invalidates Redis key `leaderboard:top10`.
5. Response: `{ success, data: { message } }`.

### 4.2 Get Top 10

1. Client sends `GET /api/leaderboard/top`.
2. Service checks Redis for `leaderboard:top10`.
3. **Cache hit:** Return cached JSON.
4. **Cache miss:** Query DB (ORDER BY total_score DESC LIMIT 10), store in Redis with 10s TTL, return result.

### 4.3 Get Player Rank

1. Client sends `GET /api/leaderboard/rank/:userId`.
2. Service queries DB for rank and total_score for that user.
3. No cache in current design; response returned directly.

---

## 5. Deployment & Environment

- **Backend:** Runs on port 8000; expects PostgreSQL at `localhost:5432` (DB `leaderboard`, user `postgres`) and Redis at `127.0.0.1:6379`.
- **Frontend:** Runs on port 3000; targets backend API (e.g. same host or configured base URL).
- **Secrets:** `DB_PASSWORD` required; `NEW_RELIC_LICENSE_KEY` and `NEW_RELIC_APP_NAME` optional for APM.

---

## 6. Non-Functional Requirements (Summary)

| Area           | Approach                                                                 |
|----------------|--------------------------------------------------------------------------|
| **Performance**| Redis cache for top 10; DB indexes on `total_score DESC`, `user_id`.    |
| **Consistency**| Score submit in single DB transaction; cache invalidated on write.      |
| **Reliability**| Health check `/health`; error middleware; rate limit (200 req/min/IP).   |
| **Observability**| New Relic APM; structured errors and logging where applicable.        |
| **Scalability**| Stateless API; DB and Redis can be scaled independently (future).       |

---

## 7. Out of Scope / Future Considerations

- Auth (e.g. JWT, API keys).
- Multiple games or leaderboards (single global leaderboard assumed).
- Real-time push (e.g. WebSockets) for leaderboard updates.
- Read replicas or Redis Cluster for higher scale.

---

*For module-level design, API contracts, schema, and algorithms see [LLD.md](LLD.md).*
