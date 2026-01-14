"use client";

import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");

  const fetchStats = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/stats/${username}`);
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

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