# Postman – API Reference

**Base URL:** `http://localhost:8000`  
**Content-Type:** `application/json` (for POST)

---

## 1. Health check

| Field    | Value                    |
|----------|--------------------------|
| Method   | `GET`                    |
| URL      | `http://localhost:8000/health` |
| Body     | None                     |

**Example response (200):**
```json
{
  "status": "ok"
}
```

---

## 2. Get top 10 players

| Field    | Value                    |
|----------|--------------------------|
| Method   | `GET`                    |
| URL      | `http://localhost:8000/api/leaderboard/top` |
| Body     | None                     |

**Example response (200):**
```json
{
  "success": true,
  "data": [
    { "user_id": 42, "total_score": 150000 },
    { "user_id": 7, "total_score": 120000 }
  ]
}
```

---

## 3. Get player rank

| Field    | Value                    |
|----------|--------------------------|
| Method   | `GET`                    |
| URL      | `http://localhost:8000/api/leaderboard/rank/:userId` |
| Params   | `userId` = number (e.g. `42`) |
| Body     | None                     |

**Example URL:** `http://localhost:8000/api/leaderboard/rank/42`

**Example response (200):**
```json
{
  "success": true,
  "data": {
    "rank": 1,
    "total_score": 150000
  }
}
```

**Example error (400):** User not on leaderboard
```json
{
  "success": false,
  "message": "User not found on leaderboard"
}
```

---

## 4. Submit score

| Field    | Value                    |
|----------|--------------------------|
| Method   | `POST`                   |
| URL      | `http://localhost:8000/api/leaderboard/submit` |
| Headers  | `Content-Type: application/json` |
| Body     | Raw → JSON (see below)   |

**Body (raw JSON):**
```json
{
  "user_id": 42,
  "score": 5000
}
```

- `user_id`: number (must exist in `users` if you use referential integrity)
- `score`: number (non-negative)

**Example response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Score submitted successfully"
  }
}
```

**Example error (400):** Invalid types
```json
{
  "success": false,
  "message": "user_id and score must be numbers"
}
```

---

## 5. Create user (optional)

| Field    | Value                    |
|----------|--------------------------|
| Method   | `POST`                   |
| URL      | `http://localhost:8000/api/users` |
| Headers  | `Content-Type: application/json` |
| Body     | Raw → JSON               |

**Body (raw JSON):**
```json
{
  "username": "player1"
}
```

**Example response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1000001,
    "username": "player1"
  }
}
```

---

## Quick copy-paste for Postman

| Action        | Method | URL | Body |
|---------------|--------|-----|------|
| Health        | GET    | `http://localhost:8000/health` | — |
| Top 10        | GET    | `http://localhost:8000/api/leaderboard/top` | — |
| Rank (user 1) | GET    | `http://localhost:8000/api/leaderboard/rank/1` | — |
| Submit score  | POST   | `http://localhost:8000/api/leaderboard/submit` | `{"user_id": 1, "score": 1000}` |
| Create user   | POST   | `http://localhost:8000/api/users` | `{"username": "demo"}` |

Use **user_id** values that exist in your DB (e.g. 1–10000 for `seed-small.sql`, 1–1000000 for full seed).
