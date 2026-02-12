# How to Write HLD and LLD Documentation

This guide explains **what** High-Level Design (HLD) and Low-Level Design (LLD) are and **how** to create them. This project’s concrete examples are in [HLD.md](HLD.md) and [LLD.md](LLD.md).

---

## HLD vs LLD (Quick Comparison)

| Aspect        | HLD (High-Level Design)     | LLD (Low-Level Design)           |
|---------------|-----------------------------|----------------------------------|
| **Audience**  | Architects, PMs, new devs   | Developers implementing the system |
| **Focus**     | What we build & why         | How we build it                   |
| **Detail**    | Components, boundaries, flow| Modules, APIs, schema, algorithms |
| **Abstraction** | Boxes and arrows          | Classes, endpoints, SQL, cache keys |

---

## How to Write an HLD

**Goal:** Describe the system so someone can understand scope, architecture, and main flows without reading code.

### 1. System overview

- **Purpose** — One or two sentences: what problem does this solve?
- **Scope** — In scope / out of scope (e.g. “Auth is out of scope”).
- **Stakeholders** — Who uses or operates the system?

### 2. Architecture

- **Diagram** — High-level picture: clients, backend, DB, cache, external services. Use ASCII or a tool (Draw.io, Mermaid).
- **Style** — e.g. layered, microservices, event-driven.
- **Stack** — Table: layer (e.g. Backend, DB) → technology → role.

### 3. Components

- List main components (Backend, Frontend, DB, Cache, etc.).
- For each: responsibility in one or two lines; no implementation detail.

### 4. Data flow

- For each main use case (e.g. “Submit score”, “Get top 10”): short numbered steps (client → API → service → DB/cache → response).
- No code; only “what happens” and where.

### 5. Deployment / environment

- Where things run (ports, hosts).
- Main config/secrets (e.g. DB, API keys). No full env dumps.

### 6. Non-functional requirements (NFRs)

- Performance (caching, indexes).
- Consistency (transactions, cache invalidation).
- Reliability (health checks, rate limits, errors).
- Observability (logging, APM).

### 7. Out of scope / future

- What is explicitly not in this version.
- Short note on possible evolution (e.g. auth, scale-out).

**Check:** Can a new team member understand *what* the system does and *how it’s structured* without opening the codebase? If yes, the HLD is in good shape.

---

## How to Write an LLD

**Goal:** Give enough detail so a developer can implement or change behaviour without guessing.

### 1. Module / package structure

- Directory tree or list of main modules.
- One-line responsibility per module/layer (e.g. “Controllers: parse request, call service, return JSON”).

### 2. API contract

- For each endpoint: method, path, request (body, params, query), response shape (sample JSON).
- Validation rules and error codes (400, 404, 500).
- Side effects (e.g. “Invalidates cache key X”).

### 3. Database schema

- Tables and columns (name, type, constraints).
- Main indexes and why they exist (e.g. “Top 10 by total_score”).

### 4. Key algorithms and logic

- Critical flows in short steps or pseudocode: e.g. “Submit: BEGIN → insert game_sessions → UPSERT leaderboard → COMMIT → invalidate cache.”
- Non-obvious queries (e.g. rank computation) with a short explanation or SQL sketch.
- Caching: key names, TTL, invalidation rules.

### 5. Cross-cutting concerns

- Middleware (auth, rate limit, CORS, error handler).
- Config (env vars, feature flags) that affect behaviour.

### 6. Testing approach

- How the system is tested (e.g. Jest API tests), and any prerequisites (DB, seed data).

**Check:** Can a developer implement or refactor a feature using only the LLD (and existing code for style)? If yes, the LLD is sufficient.

---

## Practical Tips

1. **Start from HLD** — Get the “what” and “where” right before detailing “how” in the LLD.
2. **Keep them in sync** — When you add a component in HLD, add the corresponding module/API in LLD; when you change an endpoint, update both if needed.
3. **One source of truth** — Prefer a single HLD and a single LLD (or one per bounded context in large systems). Avoid duplicated design in many small docs.
4. **Diagrams** — Simple ASCII in the repo is fine; for formal docs, use a standard tool and export to the repo or Confluence.
5. **Version / review** — Treat HLD/LLD as part of the design review; update them when you change architecture or contracts.

---

## Where to Put the Docs

- **This repo:** `docs/HLD.md`, `docs/LLD.md`, and this guide `docs/HLD_LLD_GUIDE.md`.
- **README:** Link to `docs/HLD.md` and `docs/LLD.md` so new contributors know they exist.

---

## Summary

- **HLD** = system view: purpose, architecture, components, data flow, NFRs, deployment.
- **LLD** = implementation view: modules, API contract, schema, algorithms, middleware, testing.
- **Process:** Write HLD first, then LLD; keep both updated when design or behaviour changes.

For this project’s actual HLD and LLD, see [HLD.md](HLD.md) and [LLD.md](LLD.md).
