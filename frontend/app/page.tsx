"use client";

import {useRef, useState} from "react";
import ChessboardAnalysisComponent, {Analysis} from "./components/chessboard_analysis";
import {BaseChessboardHandles} from "./components/chessboard";

export default function Home() {
    const [username, setUsername] = useState("");
    const [stats, setStats] = useState<{
        username: string;
        avatar: string;
        title: string;
        bullet_rating_current: number;
        bullet_rating_highest: number;
        blitz_rating_current: number;
        blitz_rating_highest: number;
        rapid_rating_current: number;
        rapid_rating_highest: number;
    } | null>(null);
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
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-10">
                <div className="flex gap-24 items-center" style={{ minWidth: 500, maxWidth: 1200 }}>
                    <div className="flex flex-col items-center justify-center" style={{ minWidth: 500 }}>
                        <ChessboardAnalysisComponent
                            onAnalysisAction={setAnalysis}
                            boardRef={boardRef}
                            onMovesChange={(moves, pgn) => {
                                setMoves(moves);
                                setPgn(pgn);
                            }}
                        />

                        <div className="font-mono text-sm text-black dark:text-zinc-50 mt-3 w-full" style={{ minHeight: 100 }}>
                            {analysis ? (
                                <>
                                    <div className="text-center text-xs opacity-70 mb-2">
                                        Depth {analysis.depth}
                                    </div>
                                    {analysis.lines.map((l, i) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="w-12 text-right">
                                                {l.eval === null ? `#${l.mate}` : l.eval.toFixed(2)}
                                            </div>
                                            <div className="flex-1 truncate">{l.pv}</div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="text-center opacity-30">Waiting for analysis...</div>
                            )}
                        </div>

                        <div className="font-mono text-sm text-black dark:text-zinc-50 mt-4 w-full" style={{ minHeight: 100 }}>
                            {moves.length ? (
                                <>
                                    <div>
                                        {moves.map((m, i) => (
                                            <span key={i}>
                                                {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ""}
                                                {m}{" "}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-xs dark:text-zinc-300 bg-zinc-900 dark:bg-zinc-800 p-2 rounded overflow-x-auto whitespace-nowrap border border-zinc-700">
                                        <strong>PGN:</strong> {pgn}
                                    </div>
                                </>
                            ) : (
                                <div className="opacity-30">No moves yet</div>
                            )}
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
                    </div>

                    <div className="flex flex-col items-center justify-center" style={{ minWidth: 500 }}>
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

                        <button
                            onClick={() => {
                                setStats(null)
                                setMoves([]);
                                setPgn("");
                                setAnalysis(null);
                                setUsername("");
                            }}
                            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 mt-4"
                        >
                            Back
                        </button>
                    </div>
                </div>
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