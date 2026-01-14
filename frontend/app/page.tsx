"use client";

import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState<{ username: string; title: string } | null>(null);

  const fetchStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/stats/${username}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Stats page
  if (stats) {
      return (
          <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-10">
              <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-4">
                  Stats for {stats.username || "N/A"}
              </h1>
              <p className="text-black dark:text-zinc-50 mb-2">Title: {stats.title || "N/A"}</p>
              <button
                  onClick={() => setStats(null)}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 mt-4"
              >
                  Back
              </button>
          </div>
      );
  }

  // Main page
  return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-10">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-4">
          Chessmeta
        </h1>

        <input
            placeholder="Enter Chess.com username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-400 rounded p-2 mb-4"
        />

        <button
            onClick={fetchStats}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Get Stats
        </button>
      </div>
  );
}