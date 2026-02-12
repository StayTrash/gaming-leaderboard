# Gaming Leaderboard

A leaderboard system for tracking player scores: submit scores, view top 10, and check a player's rank. Built with Express (backend), Next.js (frontend), PostgreSQL, Redis, and New Relic for monitoring.

## Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** (e.g. 14+)
- **Redis** (e.g. 6+)
- **Python 3** (for load test script; `requests` required)

## Environment

### Backend

Create `backend/.env` (or set in shell):

```env
DB_PASSWORD=your_postgres_password
```

Optional for New Relic (recommended instead of hardcoding in `newrelic.js`):

```env
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
```

Backend expects:

- PostgreSQL: `localhost:5432`, database `leaderboard`, user `postgres`, password from `DB_PASSWORD`.
- Redis: `127.0.0.1:6379`.

## Database Setup

1. Create the database:

```bash
createdb -U postgres leaderboard
```

2. Create tables (run from project root):

```bash
psql -U postgres -d leaderboard -f scripts/schema.sql
```

3. Seed data (choose one):

**Full dataset (1M users, 5M game_sessions)** — can take a long time:

```bash
psql -U postgres -d leaderboard -f scripts/seed.sql
```

**Small dataset (10k users, 50k sessions)** — for quick local testing:

```bash
psql -U postgres -d leaderboard -f scripts/seed-small.sql
```

4. Add indexes for better API latency:

```bash
psql -U postgres -d leaderboard -f scripts/indexes.sql
```

## Running the App

### Backend (port 8000)

```bash
cd backend
npm install
npm run dev
```

### Frontend (port 3000)

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the live leaderboard UI.

### Load Test (simulate real usage)

With the backend running:

```bash
pip install requests
python load_test.py
```

This script repeatedly picks a random user ID, submits a score, fetches the top 10 and that user's rank, then sleeps 0.5–2 seconds. Set `MAX_USER_ID` in `load_test.py` to match your seed: **10000** for `seed-small.sql`, **1000000** for full `seed.sql`. Use it to generate load for New Relic and to verify performance.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leaderboard/submit` | Submit a score. Body: `{ "user_id": number, "score": number }` |
| GET | `/api/leaderboard/top` | Top 10 players by total score |
| GET | `/api/leaderboard/rank/:userId` | Rank and total score for a user |
| POST | `/api/users` | Create user. Body: `{ "username": string }` |
| GET | `/health` | Health check |

## Project Structure

- **backend/** — Express API (TypeScript), PostgreSQL, Redis cache, New Relic
- **client/** — Next.js app (React), live leaderboard + rank lookup
- **scripts/** — DB schema, seed (full + small), indexes
- **load_test.py** — Load simulation script

## Performance & Monitoring

- **Caching:** GET `/api/leaderboard/top` is cached in Redis (10s TTL); cache is invalidated on score submit.
- **Indexes:** `leaderboard(total_score DESC)` and `game_sessions(user_id)` for fast queries.
- **Transactions:** Score submit updates `game_sessions` and `leaderboard` in a single transaction.
- **New Relic:** Configured in `backend/newrelic.js`. Run under load and use the New Relic dashboard for latency, bottlenecks, and alerts.

## License

ISC
