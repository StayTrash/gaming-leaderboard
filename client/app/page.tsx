"use client";

import { useEffect, useState } from "react";

interface Player {
  user_id: number;
  total_score: number;
}

const API_BASE = "http://localhost:8000/api/leaderboard";

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [userId, setUserId] = useState("");
  const [rankData, setRankData] = useState<any>(null);

  const fetchLeaderboard = async () => {
    const res = await fetch(`${API_BASE}/top`);
    const data = await res.json();
    setPlayers(data.data);
  };

  const fetchUserRank = async () => {
    if (!userId) return;
    const res = await fetch(`${API_BASE}/rank/${userId}`);
    const data = await res.json();
    setRankData(data.data);
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen p-10 bg-gray-100">
      <h1 className="text-4xl font-bold text-center mb-10">
        🏆 Live Leaderboard
      </h1>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Leaderboard */}
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Top 10 Players</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-2">Rank</th>
                <th className="p-2">User ID</th>
                <th className="p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.user_id} className="text-center border-t">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{player.user_id}</td>
                  <td className="p-2">{player.total_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rank Lookup */}
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Check Player Rank</h2>
          <input
            type="number"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="border p-2 w-full mb-4"
          />
          <button
            onClick={fetchUserRank}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Check Rank
          </button>

          {rankData && (
            <div className="mt-4">
              <p>Rank: {rankData.rank}</p>
              <p>Total Score: {rankData.total_score}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
