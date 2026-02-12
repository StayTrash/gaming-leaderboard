"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/leaderboard"
    : "";

interface Player {
  user_id: number;
  total_score: number;
}

interface RankData {
  rank: number;
  total_score: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

function formatScore(n: number): string {
  return n.toLocaleString();
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const [userId, setUserId] = useState("");
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState<string | null>(null);

  const [submitUserId, setSubmitUserId] = useState("");
  const [submitScore, setSubmitScore] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!API_BASE) return;
    setLeaderboardError(null);
    try {
      const res = await fetch(`${API_BASE}/top`);
      const json: ApiResponse<Player[]> = await res.json();
      if (!res.ok) {
        setLeaderboardError(json.message || `Error ${res.status}`);
        return;
      }
      setPlayers(json.data ?? []);
    } catch (e) {
      setLeaderboardError(e instanceof Error ? e.message : "Failed to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  const fetchUserRank = useCallback(async () => {
    const id = userId.trim();
    if (!id || !API_BASE) return;
    setRankError(null);
    setRankData(null);
    setRankLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rank/${encodeURIComponent(id)}`);
      const json: ApiResponse<RankData> = await res.json();
      if (!res.ok) {
        setRankError(json.message || `Error ${res.status}`);
        return;
      }
      if (json.data) setRankData(json.data);
    } catch (e) {
      setRankError(e instanceof Error ? e.message : "Failed to fetch rank");
    } finally {
      setRankLoading(false);
    }
  }, [userId]);

  const handleSubmitScore = useCallback(async () => {
    const uid = submitUserId.trim();
    const scoreStr = submitScore.trim();
    if (!uid || !scoreStr || !API_BASE) return;
    const uidNum = parseInt(uid, 10);
    const scoreNum = parseInt(scoreStr, 10);
    if (Number.isNaN(uidNum) || Number.isNaN(scoreNum) || scoreNum < 0) {
      setSubmitMessage({ type: "err", text: "User ID and a non-negative score are required." });
      return;
    }
    setSubmitMessage(null);
    setSubmitLoading(true);
    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uidNum, score: scoreNum }),
      });
      const json: ApiResponse<{ message?: string }> = await res.json();
      if (!res.ok) {
        setSubmitMessage({ type: "err", text: json.message || `Error ${res.status}` });
        return;
      }
      setSubmitMessage({ type: "ok", text: "Score submitted!" });
      setSubmitScore("");
      await fetchLeaderboard();
    } catch (e) {
      setSubmitMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Failed to submit score",
      });
    } finally {
      setSubmitLoading(false);
    }
  }, [submitUserId, submitScore, fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-amber-500/30 bg-stone-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight text-amber-400 sm:text-4xl">
            Live Leaderboard
          </h1>
          <p className="mt-1 text-stone-400">
            Top scores and rank lookup — updates every 5s
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Leaderboard */}
          <section
            className="rounded-xl border border-stone-700/80 bg-stone-900/50 p-6 shadow-xl"
            aria-labelledby="leaderboard-title"
          >
            <h2 id="leaderboard-title" className="mb-4 text-xl font-semibold text-amber-400">
              Top 10 Players
            </h2>

            {leaderboardLoading && players.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-stone-500">
                <span className="animate-pulse">Loading…</span>
              </div>
            ) : leaderboardError ? (
              <div className="rounded-lg border border-red-500/50 bg-red-950/30 px-4 py-3 text-red-300">
                {leaderboardError}
              </div>
            ) : players.length === 0 ? (
              <p className="py-8 text-center text-stone-500">No players yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-amber-500/40 bg-amber-950/30">
                      <th className="px-3 py-2.5 font-medium text-amber-300">Rank</th>
                      <th className="px-3 py-2.5 font-medium text-amber-300">User ID</th>
                      <th className="px-3 py-2.5 font-medium text-amber-300 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, index) => (
                      <tr
                        key={player.user_id}
                        className="border-b border-stone-700/60 hover:bg-stone-800/50"
                      >
                        <td className="px-3 py-2.5 font-medium text-stone-300">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                        </td>
                        <td className="px-3 py-2.5 text-stone-200">{player.user_id}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-amber-400">
                          {formatScore(player.total_score)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Rank lookup + Submit score */}
          <div className="flex flex-col gap-8">
            <section
              className="rounded-xl border border-stone-700/80 bg-stone-900/50 p-6 shadow-xl"
              aria-labelledby="rank-title"
            >
              <h2 id="rank-title" className="mb-4 text-xl font-semibold text-amber-400">
                Check Player Rank
              </h2>
              <label htmlFor="rank-user-id" className="sr-only">
                User ID
              </label>
              <input
                id="rank-user-id"
                type="number"
                inputMode="numeric"
                placeholder="Enter user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUserRank()}
                className="mb-3 w-full rounded-lg border border-stone-600 bg-stone-800 px-3 py-2.5 text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                aria-describedby="rank-result"
              />
              <button
                type="button"
                onClick={fetchUserRank}
                disabled={!userId.trim() || rankLoading}
                className="rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-stone-950 transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-stone-900 disabled:opacity-50 disabled:pointer-events-none"
              >
                {rankLoading ? "Checking…" : "Check Rank"}
              </button>

              <div id="rank-result" className="mt-4" aria-live="polite">
                {rankError && (
                  <p className="rounded-lg border border-red-500/50 bg-red-950/30 px-3 py-2 text-red-300">
                    {rankError}
                  </p>
                )}
                {rankData && !rankError && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-4 py-3">
                    <p className="font-medium text-amber-300">
                      Rank: <span className="text-stone-100">{rankData.rank}</span>
                    </p>
                    <p className="text-stone-400">
                      Total score: <span className="font-mono text-amber-400">{formatScore(rankData.total_score)}</span>
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section
              className="rounded-xl border border-stone-700/80 bg-stone-900/50 p-6 shadow-xl"
              aria-labelledby="submit-title"
            >
              <h2 id="submit-title" className="mb-4 text-xl font-semibold text-amber-400">
                Submit Score
              </h2>
              <div className="space-y-3">
                <label htmlFor="submit-user-id" className="sr-only">
                  User ID for submit
                </label>
                <input
                  id="submit-user-id"
                  type="number"
                  inputMode="numeric"
                  placeholder="User ID"
                  value={submitUserId}
                  onChange={(e) => setSubmitUserId(e.target.value)}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-3 py-2.5 text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <label htmlFor="submit-score" className="sr-only">
                  Score
                </label>
                <input
                  id="submit-score"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Score"
                  value={submitScore}
                  onChange={(e) => setSubmitScore(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitScore()}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-3 py-2.5 text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleSubmitScore}
                  disabled={submitLoading || !submitUserId.trim() || !submitScore.trim()}
                  className="w-full rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-stone-950 transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-stone-900 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitLoading ? "Submitting…" : "Submit Score"}
                </button>
              </div>
              {submitMessage && (
                <p
                  className={`mt-3 rounded-lg px-3 py-2 ${
                    submitMessage.type === "ok"
                      ? "border border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                      : "border border-red-500/50 bg-red-950/30 text-red-300"
                  }`}
                  role="status"
                >
                  {submitMessage.text}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
