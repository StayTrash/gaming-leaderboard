# Low-Level Design (LLD) — Gaming Leaderboard

This document describes the implementation-level design: modules, layers, API contracts, database schema, and key algorithms. For system-level view see [HLD.md](HLD.md).

---

## 1. Module Structure (Backend)

```
backend/src/
├── app.ts              # Express app: middleware, routes, error handler
├── server.ts           # HTTP server + bootstrap (e.g. New Relic)
├── bootstrap.ts        # App startup (DB/Redis checks if any)
├── config/
│   ├── db.ts           # PostgreSQL pool
│   └── redis.ts        # Redis client
├── routes/
│   ├── leaderboard.routes.ts
│   └── user.routes.ts
├── controllers/
│   ├── leaderboard.controller.ts
│   └── user.controller.ts
├── services/
│   ├── leaderboard.service.ts
│   └── user.service.ts
├── repositories/
│   ├── leaderboard.repository.ts
│   └── user.repository.ts
└── middleware/
    └── error.middleware.ts
```

**Layer responsibilities:**

| Layer         | Role                                                                 |
|---------------|----------------------------------------------------------------------|
| **Routes**    | Map HTTP method/path to controller handlers.                         |
| **Controllers** | Parse request (body, params), call service, format JSON response.  |
| **Services**  | Business rules, validation, orchestration (DB + cache).              |
| **Repositories** | Raw DB/cache access; SQL and transactions.                        |

---

## 2. API Contract (Leaderboard)

### 2.1 POST `/api/leaderboard/submit`

**Request:**

- **Body (JSON):** `{ "user_id": number, "score": number }`
- **Validation:** `user_id` and `score` required; `score` must be ≥ 0; both must be numbers.

**Response (200):**

```json
{
  "success": true,
  "data": { "message": "Score submitted successfully" }
}
```

**Errors:**

- **400** — Missing/invalid body or validation failure (e.g. negative score).
- **500** — Server/DB error (handled by error middleware).

**Side effects:** One row inserted into `game_sessions`; `leaderboard` row inserted or updated (UPSERT); Redis key `leaderboard:top10` deleted.

---

### 2.2 GET `/api/leaderboard/top`

**Request:** No body; no required query/params.

**Response (200):**

```json
{
  "success": true,
  "data": [
    { "user_id": 42, "total_score": 15000 },
    ...
  ]
}
```

**Behaviour:** Service checks Redis `leaderboard:top10`; on miss, queries DB, caches with TTL 10s, returns array of up to 10 rows ordered by `total_score` DESC.

---

### 2.3 GET `/api/leaderboard/rank/:userId`

**Request:** Path param `userId` (numeric).

**Response (200):**

```json
{
  "success": true,
  "data": { "rank": 5, "total_score": 12000 }
}
```

**Errors:**

- **400** — Invalid/missing userId or user not found in leaderboard.

**Behaviour:** No cache; single DB query for rank and total_score.

---

## 3. Database Schema

### 3.1 Tables

**users**

| Column     | Type         | Constraints        |
|------------|--------------|--------------------|
| id         | SERIAL       | PRIMARY KEY        |
| username   | VARCHAR(255) | UNIQUE, NOT NULL   |
| join_date  | TIMESTAMP    | DEFAULT now        |

**game_sessions**

| Column   | Type      | Constraints                    |
|----------|-----------|--------------------------------|
| id       | SERIAL    | PRIMARY KEY                    |
| user_id  | INT       | FK → users(id) ON DELETE CASCADE|
| score    | INT       | NOT NULL                       |
| game_mode| VARCHAR(50)| NOT NULL                      |
| timestamp| TIMESTAMP | DEFAULT now                    |

**leaderboard**

| Column      | Type | Constraints                    |
|-------------|------|--------------------------------|
| id          | SERIAL | PRIMARY KEY                 |
| user_id     | INT  | FK → users(id), UNIQUE          |
| total_score | INT  | NOT NULL                       |
| rank        | INT  | (nullable; can be computed)    |

### 3.2 Indexes

- `idx_leaderboard_total_score_desc` on `leaderboard(total_score DESC)` — for top-10 query.
- Unique on `leaderboard(user_id)` (from schema).
- `idx_game_sessions_user_id` on `game_sessions(user_id)` — for per-user queries.

---

## 4. Key Algorithms & Logic

### 4.1 Score Submit (Repository)

1. Acquire DB client from pool.
2. `BEGIN` transaction.
3. Insert into `game_sessions`: `(user_id, score, game_mode='solo')`.
4. UPSERT `leaderboard`:  
   `INSERT (user_id, total_score) VALUES ($1, $2)`  
   `ON CONFLICT (user_id) DO UPDATE SET total_score = leaderboard.total_score + EXCLUDED.total_score`.
5. `COMMIT`; on any error `ROLLBACK`.
6. Release client.

Service layer then calls `redis.del("leaderboard:top10")`.

### 4.2 Top 10 (Service + Repository)

**Service:**

1. `cacheKey = "leaderboard:top10"`.
2. `cached = redis.get(cacheKey)`.
3. If `cached`: return `JSON.parse(cached)`.
4. Else: `rows = getTopPlayers()` (repository).
5. `redis.set(cacheKey, JSON.stringify(rows), "EX", 10)`.
6. Return `rows`.

**Repository:**  
`SELECT user_id, total_score FROM leaderboard ORDER BY total_score DESC LIMIT 10`.

### 4.3 Player Rank (Repository)

Single query:

```sql
SELECT
  (SELECT COUNT(*) + 1 FROM leaderboard WHERE total_score > l.total_score) AS rank,
  l.total_score
FROM leaderboard l
WHERE l.user_id = $1
```

Returns one row; rank and total_score normalized to JavaScript numbers (for bigint/numeric).

---

## 5. Middleware & Cross-Cutting

- **CORS:** Enabled for all origins (app-wide).
- **JSON body:** `express.json()`.
- **Rate limit:** 200 requests per IP per minute; disabled when `NODE_ENV === 'test'`.
- **Error handler:** Last middleware; sets status (e.g. from `error.status`) and JSON body.

---

## 6. Configuration

- **DB:** Connection from env (host, port, database, user, password); default `localhost:5432`, DB `leaderboard`, user `postgres`.
- **Redis:** Default `127.0.0.1:6379`.
- **New Relic:** Loaded first in `server.ts`; uses `NEW_RELIC_LICENSE_KEY`, `NEW_RELIC_APP_NAME`.

---

## 7. Testing (Backend)

- **Jest** for API tests; `NODE_ENV=test` to skip rate limiter.
- **Targets:** POST `/api/leaderboard/submit`, GET `/api/leaderboard/top`, GET `/api/leaderboard/rank/:userId`.
- **Prerequisite:** DB and Redis running; schema and seed (e.g. small seed) applied so known user IDs exist.

---

*For system context and architecture see [HLD.md](HLD.md).*
