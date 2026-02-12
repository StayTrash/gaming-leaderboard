/**
 * API tests for leaderboard endpoints.
 * Requires: PostgreSQL and Redis running, database seeded (e.g. seed-small.sql so user_id 1 exists).
 */
import request from 'supertest';
import app from '../app';

const BASE = '/api/leaderboard';

describe('Leaderboard API', () => {
  describe('GET /api/leaderboard/top', () => {
    it('returns 200 and an array of up to 10 players', async () => {
      const res = await request(app).get(`${BASE}/top`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(10);

      for (const player of res.body.data) {
        expect(player).toHaveProperty('user_id');
        expect(player).toHaveProperty('total_score');
        expect(typeof player.user_id).toBe('number');
        expect(typeof player.total_score).toBe('number');
      }
    });

    it('returns players ordered by total_score descending', async () => {
      const res = await request(app).get(`${BASE}/top`);
      expect(res.status).toBe(200);

      const scores = res.body.data.map((p: { total_score: number }) => p.total_score);
      const sorted = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sorted);
    });
  });

  describe('POST /api/leaderboard/submit', () => {
    it('returns 200 and success when given valid user_id and score', async () => {
      // Use user_id 1 (must exist after seed-small or full seed)
      const res = await request(app)
        .post(`${BASE}/submit`)
        .send({ user_id: 1, score: 1000 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('message');
    });

    it('returns 400 when user_id or score is missing or not a number', async () => {
      const badPayloads = [
        {},
        { user_id: 1 },
        { score: 100 },
        { user_id: '1', score: 100 },
        { user_id: 1, score: '100' },
      ];

      for (const body of badPayloads) {
        const res = await request(app).post(`${BASE}/submit`).send(body);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('success', false);
      }
    });
  });

  describe('GET /api/leaderboard/rank/:userId', () => {
    it('returns 200 with rank and total_score for an existing user', async () => {
      // User 1 should exist after seed
      const res = await request(app).get(`${BASE}/rank/1`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('rank');
      expect(res.body.data).toHaveProperty('total_score');
      expect(typeof res.body.data.rank).toBe('number');
      expect(typeof res.body.data.total_score).toBe('number');
    });

    it('returns 400 for a user not on the leaderboard', async () => {
      // Use an ID that is unlikely to have any leaderboard row (e.g. very high)
      const res = await request(app).get(`${BASE}/rank/999999999`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
    });
  });
});
