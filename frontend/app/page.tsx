"use client";

import {useRef, useState} from "react";
import ChessboardAnalysisComponent, { Analysis } from "./components/chessboard_analysis";
import { BaseChessboardHandles } from "./components/chessboard";

export default function Home() {
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState<{ username: string; avatar: string; title: string; bullet_rating_current: number; bullet_rating_highest: number; blitz_rating_current: number; blitz_rating_highest: number; rapid_rating_current: number; rapid_rating_highest: number; } | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const boardRef = useRef<BaseChessboardHandles>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [pgn, setPgn] = useState<string>("");

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
              <img
                  src={stats.avatar || "https://www.chess.com/bundles/web/images/user-image.007dad08.svg"}
                  className="w-24 h-24 mb-4"
              />
              <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-4">
                  Stats for {stats.title || ""} {stats.username || "user not found"}
              </h1>
              <p className="text-black dark:text-zinc-50 mb-2">Bullet: {stats.bullet_rating_current || "N/A"} Peak: {stats.bullet_rating_highest || "N/A"}</p>
              <p className="text-black dark:text-zinc-50 mb-2">Blitz: {stats.blitz_rating_current || "N/A"} Peak: {stats.blitz_rating_highest || "N/A"}</p>
              <p className="text-black dark:text-zinc-50 mb-2">Rapid: {stats.rapid_rating_current || "N/A"} Peak: {stats.rapid_rating_highest || "N/A"}</p>

              <div style={{ width: 450 }}>
                  <ChessboardAnalysisComponent
                      onAnalysisAction={setAnalysis}
                      boardRef={boardRef}
                      onMovesChange={(moves, pgn) => {
                          setMoves(moves);
                          setPgn(pgn);
                      }}
                  />
              </div>

              {analysis && (
                  <div className="font-mono text-sm text-black dark:text-zinc-50 mt-2">
                      <div>Eval: {analysis.mate ? `Mate in ${analysis.mate}` : analysis.eval.toFixed(2)}</div>
                      <div>Depth: {analysis.depth}</div>
                  </div>
              )}

              {analysis && (
                  <div className="font-mono text-sm text-black dark:text-zinc-50 mt-2">
                      {analysis.pv.split("\n").map((line, i) => (
                          <div key={i}>Line {i+1}: {line}</div>
                      ))}
                  </div>
              )}

              {/* Move history */}
              <div className="font-mono text-sm text-black dark:text-zinc-50 mt-4">
                  <div>
                      {moves.map((m, i) => (
                          <span key={i}>
                              {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ""}
                              {m}{" "}
                          </span>
                      ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                      <strong>PGN:</strong> {pgn}
                  </div>
              </div>

              <div className="mt-4 space-x-2">
                  <button
                      onClick={() => boardRef.current?.undo()}
                      className="px-2 py-1 border"
                  >
                      Undo
                  </button>
                  <button
                      onClick={() => boardRef.current?.redo()}
                      className="px-2 py-1 border"
                  >
                      Redo
                  </button>
              </div>

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
            onKeyDown={(e) => e.key === "Enter" && fetchStats()}
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