# System Design Diagrams — Gaming Leaderboard

This document contains system design diagrams showing **what uses what** and **all flows** for the Gaming Leaderboard project. The diagrams match the actual codebase (routes, controllers, services, repositories in `backend/src/`). They are in [Mermaid](https://mermaid.js.org/) format and render in GitHub, VS Code, and many doc viewers.

**Quick navigation:**  
[1. System Context](#1-system-context-what-uses-what) · [2. Backend Components](#2-backend-component-diagram-what-uses-what-inside-backend) · [3. API → Layers](#3-api-endpoints-and-their-layers) · [4. Submit Score](#4-flow-submit-score) · [5. Get Top 10](#5-flow-get-top-10-cache-through) · [6. Get Rank](#6-flow-get-player-rank) · [7. Create User](#7-flow-create-user) · [8. Health](#8-flow-health-check) · [9. Data Stores](#9-data-store-usage-overview) · [10. Frontend](#10-frontend--backend-flow-ui) · [11. Summary Table](#11-all-flows-summary-table)

---

## 1. System Context (What Uses What)

High-level view: who uses the system and what external systems the backend depends on.

```mermaid
flowchart TB
    subgraph Clients["Clients"]
        Browser["Browser<br/>(Next.js UI)"]
        LoadTest["Load Test<br/>(Python + requests)"]
        ApiConsumer["API Consumers<br/>(any HTTP client)"]
    end

    subgraph Backend["Backend — Express :8000"]
        API["REST API<br/>CORS · JSON · Rate Limit 200/min<br/>New Relic APM"]
    end

    subgraph Data["Data Stores"]
        PG[("PostgreSQL<br/>leaderboard DB")]
        Redis[("Redis<br/>cache")]
    end

    subgraph Monitoring["Monitoring"]
        NR["New Relic"]
    end

    Browser -->|HTTP| API
    LoadTest -->|HTTP| API
    ApiConsumer -->|HTTP| API
    API -->|SQL / connection pool| PG
    API -->|get/set/del| Redis
    API -.->|APM instrumentation| NR
```

**Summary:**
- **Clients** (Browser, Load Test, API consumers) call the **Backend** over HTTP.
- **Backend** uses **PostgreSQL** for persistence and **Redis** for caching; it reports to **New Relic** for monitoring.

---

## 2. Backend Component Diagram (What Uses What Inside Backend)

Layered architecture: routes → controllers → services → repositories; config and middleware are cross-cutting.

```mermaid
flowchart TB
    subgraph Presentation["Presentation Layer"]
        LR["leaderboard.routes"]
        UR["user.routes"]
    end

    subgraph Controllers["Controller Layer"]
        LC["leaderboard.controller"]
        UC["user.controller"]
    end

    subgraph Services["Service Layer (Business Logic)"]
        LS["leaderboard.service"]
        US["user.service"]
    end

    subgraph Repositories["Data Access Layer"]
        LRepo["leaderboard.repository"]
        URepo["user.repository"]
    end

    subgraph Config["Config"]
        DBConfig["db.ts<br/>(pool)"]
        RedisConfig["redis.ts<br/>(client)"]
    end

    subgraph External["External"]
        PG[("PostgreSQL")]
        Redis[("Redis")]
    end

    subgraph Middleware["Cross-Cutting"]
        ErrMW["error.middleware"]
        Health["/health handler"]
    end

    LR --> LC
    UR --> UC
    LC --> LS
    UC --> US
    LS --> LRepo
    LS --> RedisConfig
    US --> URepo
    LRepo --> DBConfig
    URepo --> DBConfig
    DBConfig --> PG
    RedisConfig --> Redis
    LR -.-> ErrMW
    UR -.-> ErrMW
```

**Summary:**
- **Routes** map URLs to **controllers**; **controllers** call **services**; **services** use **repositories** and **Redis**.
- **Repositories** use **db** config (pool) to talk to **PostgreSQL**; **leaderboard.service** uses **redis** config for cache.
- **Error middleware** wraps all route handlers; **/health** is a simple inline handler.

---

## 3. API Endpoints and Their Layers

Which endpoint goes through which files and dependencies.

```mermaid
flowchart LR
    subgraph E["Endpoints"]
        E1["POST /api/leaderboard/submit"]
        E2["GET /api/leaderboard/top"]
        E3["GET /api/leaderboard/rank/:userId"]
        E4["POST /api/users"]
        E5["GET /health"]
    end

    subgraph Routes
        R1[leaderboard.routes]
        R2[user.routes]
    end

    subgraph Controllers
        C1[leaderboard.controller]
        C2[user.controller]
    end

    subgraph Services
        S1[leaderboard.service]
        S2[user.service]
    end

    subgraph Repos
        Repo1[leaderboard.repository]
        Repo2[user.repository]
    end

    subgraph Data
        PG[("PostgreSQL")]
        Redis[("Redis")]
    end

    E1 --> R1 --> C1 --> S1 --> Repo1 --> PG
    E2 --> R1 --> C1 --> S1 --> Redis
    E2 --> R1 --> C1 --> S1 --> Repo1 --> PG
    E3 --> R1 --> C1 --> S1 --> Repo1 --> PG
    E4 --> R2 --> C2 --> S2 --> Repo2 --> PG
    E5 -.->|inline| Health[health handler]
```

**Summary:**
- **Submit** and **rank** use leaderboard routes → controller → service → leaderboard repository → PostgreSQL.
- **Top 10** uses leaderboard service with **Redis** (cache) and, on cache miss, **leaderboard repository** → PostgreSQL.
- **Create user** uses user routes → user controller → user service → user repository → PostgreSQL.
- **Health** is a single handler, no service/repository.

---

## 4. Flow: Submit Score

End-to-end flow from client to DB and cache invalidation.

```mermaid
sequenceDiagram
    participant Client
    participant Routes
    participant Controller
    participant Service
    participant LeaderboardRepo
    participant PG as PostgreSQL
    participant Redis

    Client->>Routes: POST /api/leaderboard/submit { user_id, score }
    Routes->>Controller: submitScore(req, res)
    Controller->>Controller: validate body (user_id, score are numbers)
    Controller->>Service: submitScoreService(userId, score)

    Service->>Service: validate required, score ≥ 0
    Service->>LeaderboardRepo: submitScoreTransaction(userId, score)
    LeaderboardRepo->>PG: BEGIN
    LeaderboardRepo->>PG: INSERT game_sessions (user_id, score, game_mode)
    LeaderboardRepo->>PG: UPSERT leaderboard (total_score += score)
    LeaderboardRepo->>PG: COMMIT
    PG-->>LeaderboardRepo: ok
    LeaderboardRepo-->>Service: ok

    Service->>Redis: del("leaderboard:top10")
    Redis-->>Service: ok

    Service-->>Controller: success
    Controller-->>Client: 200 { success, data: { message } }
```

**Summary:**
- **Controller** validates that `user_id` and `score` are numbers; **service** validates they are present and `score ≥ 0`. Then the service runs a **single DB transaction** via `submitScoreTransaction`: insert `game_sessions`, upsert `leaderboard`.
- After commit, the service **invalidates** Redis key `leaderboard:top10` so the next top-10 read is fresh.

---

## 5. Flow: Get Top 10 (Cache-Through)

Cache hit vs cache miss path.

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant LeaderboardRepo
    participant Redis
    participant PG as PostgreSQL

    Client->>Controller: GET /api/leaderboard/top
    Controller->>Service: getTopPlayersService()

    Service->>Redis: get("leaderboard:top10")
    alt Cache HIT
        Redis-->>Service: cached JSON
        Service-->>Controller: parsed top 10
        Controller-->>Client: 200 { success, data: [...] }
    else Cache MISS
        Redis-->>Service: null
        Service->>LeaderboardRepo: getTopPlayers()
        LeaderboardRepo->>PG: SELECT user_id, total_score ... ORDER BY total_score DESC LIMIT 10
        PG-->>LeaderboardRepo: rows
        LeaderboardRepo-->>Service: rows
        Service->>Redis: set("leaderboard:top10", JSON, EX 10)
        Service-->>Controller: rows
        Controller-->>Client: 200 { success, data: [...] }
    end
```

**Summary:**
- Service checks **Redis** first. **Hit:** return cached JSON. **Miss:** query DB via repository, **set** cache with 10s TTL, then return.

---

## 6. Flow: Get Player Rank

No cache; single DB query.

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant LeaderboardRepo
    participant PG as PostgreSQL

    Client->>Controller: GET /api/leaderboard/rank/:userId
    Controller->>Controller: parse & validate userId
    Controller->>Service: getPlayerRankService(userId)

    Service->>LeaderboardRepo: getPlayerRank(userId)
    LeaderboardRepo->>PG: SELECT rank (COUNT), total_score FROM leaderboard WHERE user_id = $1
    PG-->>LeaderboardRepo: row or empty
    LeaderboardRepo-->>Service: { rank, total_score } or null

    alt User on leaderboard
        Service-->>Controller: { rank, total_score }
        Controller-->>Client: 200 { success, data: { rank, total_score } }
    else User not found
        Service-->>Controller: null / throw
        Controller-->>Client: 400 { message }
    end
```

**Summary:**
- Rank is computed in the repository (e.g. `COUNT(*) WHERE total_score > user's score`). No Redis; response is returned directly.

---

## 7. Flow: Create User

Used to create users (e.g. before submitting scores).

```mermaid
sequenceDiagram
    participant Client
    participant Routes
    participant Controller
    participant Service
    participant UserRepo
    participant PG as PostgreSQL

    Client->>Routes: POST /api/users { username }
    Routes->>Controller: createUser(req, res)
    Controller->>Controller: validate body (username)
    Controller->>Service: createUserService(username)

    Service->>UserRepo: createUser(username)
    UserRepo->>PG: INSERT INTO users (username) VALUES ($1)
    PG-->>UserRepo: user (id, username, join_date)
    UserRepo-->>Service: user

    Service-->>Controller: user
    Controller-->>Client: 201 { success, data: { id, username, join_date } }
```

**Summary:**
- User creation goes through user routes → controller → user service → user repository → PostgreSQL; response returns the new user.

---

## 8. Flow: Health Check

Simple liveness check; no DB or Redis in the diagram (implementation may add optional checks).

```mermaid
sequenceDiagram
    participant Client
    participant App as Express App

    Client->>App: GET /health
    App->>App: inline handler
    App-->>Client: 200 { status: "ok" }
```

**Summary:**
- Health is a single route handler; no service or repository. Optional: bootstrap or health handler can ping DB/Redis for readiness.

---

## 9. Data Store Usage Overview

What each store is used for and which components use it.

```mermaid
flowchart TB
    subgraph PostgreSQL["PostgreSQL (leaderboard DB)"]
        T1[users]
        T2[game_sessions]
        T3[leaderboard]
    end

    subgraph Redis["Redis"]
        K1["leaderboard:top10<br/>(TTL 10s)"]
    end

    subgraph BackendUsage["Used by"]
        URepo["user.repository<br/>→ users"]
        LRepo["leaderboard.repository<br/>→ game_sessions, leaderboard"]
        LService["leaderboard.service<br/>→ get/set/del top10"]
    end

    URepo --> T1
    LRepo --> T2
    LRepo --> T3
    LService --> K1
```

**Summary:**
- **PostgreSQL:** `users` (user.repository), `game_sessions` and `leaderboard` (leaderboard.repository).
- **Redis:** Only key `leaderboard:top10`; read/written by leaderboard.service; invalidated on score submit.

---

## 10. Frontend → Backend Flow (UI)

How the Next.js client uses the API.

```mermaid
flowchart LR
    subgraph NextJS["Next.js Client (port 3000)"]
        Page[page.tsx]
        LB["GET /api/leaderboard/top<br/>(initial load + every 5s)"]
        Rank["GET /api/leaderboard/rank/:id<br/>(on demand)"]
        Submit["POST /api/leaderboard/submit<br/>(on form submit)"]
    end

    API["Backend API<br/>localhost:8000"]

    Page --> LB
    Page --> Rank
    Page --> Submit
    LB --> API
    Rank --> API
    Submit --> API
```

**Summary:**
- Single page (`client/app/page.tsx`) uses three API operations: **top** (loaded on mount and refreshed every 5s), **rank** (when user enters an ID and requests rank), **submit** (when user submits the score form). All use the same backend base URL (`NEXT_PUBLIC_API_URL` or `http://localhost:8000`).

---

## 11. All Flows Summary Table

| Flow            | Trigger              | Path / Method                    | Uses Redis | Uses PostgreSQL | Cache invalidation     |
|-----------------|----------------------|----------------------------------|------------|------------------|------------------------|
| Submit score    | Form / API           | POST /api/leaderboard/submit     | Invalidate | Yes (transaction)| del leaderboard:top10  |
| Get top 10      | Page load / refresh  | GET /api/leaderboard/top         | Yes (read/write) | On cache miss | —                      |
| Get rank        | User clicks “Get rank” | GET /api/leaderboard/rank/:id  | No         | Yes              | —                      |
| Create user     | API / setup          | POST /api/users                  | No         | Yes              | —                      |
| Health          | LB / monitoring      | GET /health                      | No         | No               | —                      |

---

*For system goals and NFRs see [HLD.md](HLD.md). For API contracts and schema see [LLD.md](LLD.md).*
