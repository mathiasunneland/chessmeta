"use client";

import { useRef, useState, useEffect, ForwardedRef } from "react";
import { Chess } from "chess.js";
import Engine from "../engine/engine";
import ChessboardComponent, {BaseChessboardHandles} from "./chessboard";

export type AnalysisLine = {
    eval: number | null;
    mate?: number;
    pv: string;
};

export type Analysis = {
    depth: number;
    lines: AnalysisLine[];
};

interface Props {
    onAnalysisAction?: (analysis: Analysis) => void;
    boardRef?: ForwardedRef<BaseChessboardHandles>;
    onMovesChange?: (moves: string[], pgn: string) => void;
}

export default function ChessboardAnalysisComponent({ onAnalysisAction, boardRef, onMovesChange }: Props) {
    const [position, setPosition] = useState(new Chess().fen());
    const engineRef = useRef<Engine | null>(null);
    const linesRef = useRef<AnalysisLine[]>([]);

    // Init engine
    useEffect(() => {
        const engine = new Engine();
        engineRef.current = engine;

        engineRef.current.stockfish?.postMessage("setoption name MultiPV value 3");

        engine.onMessage((msg) => {
            const uci = msg.uciMessage;
            if (!uci.startsWith("info") || !uci.includes(" pv ")) return;

            const depth = Number(uci.match(/depth (\d+)/)?.[1] ?? 0);
            if (depth < 10) return;

            const multipv = Number(uci.match(/multipv (\d+)/)?.[1] ?? 1) - 1;

            const pvUci = uci.match(/ pv (.+)/)?.[1];
            if (!pvUci) return;

            const temp = new Chess(position);
            const san: string[] = [];

            for (const m of pvUci.split(" ")) {
                try {
                    const move = temp.move({
                        from: m.slice(0, 2),
                        to: m.slice(2, 4),
                        promotion: m[4],
                    });
                    if (move) san.push(move.san);
                } catch {
                    break;
                }
            }

            const mate = uci.match(/score mate (-?\d+)/)?.[1];
            const cp = uci.match(/score cp (-?\d+)/)?.[1];

            const sideToMove = position.split(" ")[1];
            const evalScore =
                mate !== undefined
                    ? null
                    : cp
                        ? (sideToMove === "w" ? 1 : -1) * Number(cp) / 100
                        : 0;

            linesRef.current[multipv] = {
                eval: evalScore,
                mate: mate ? Number(mate) : undefined,
                pv: san.join(" "),
            };

            onAnalysisAction?.({
                depth,
                lines: linesRef.current.filter(Boolean),
            });
        });

        return () => engine.terminate();
    }, [onAnalysisAction, position]);

    // Evaluate whenever position changes
    useEffect(() => {
        if (!engineRef.current) return;
        const chess = new Chess(position);
        if (chess.isGameOver() || chess.isDraw()) return;

        engineRef.current.stop();
        engineRef.current.evaluatePosition(position, 5000);
    }, [position]);

    return (
        <ChessboardComponent
            ref={boardRef}
            initialPosition={position}
            onPositionChange={(fen: string) => setPosition(fen)}
            onMovesChange={onMovesChange}
        />
    );
}