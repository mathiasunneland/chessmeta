"use client";

import { useRef, useState, useEffect, ForwardedRef } from "react";
import { Chess } from "chess.js";
import Engine from "../Engine/engine";
import ChessboardComponent, {BaseChessboardHandles} from "./chessboard";

export type Analysis = {
    eval: number;
    depth: number;
    pv: string;
    mate?: string;
};

interface Props {
    onAnalysisAction?: (analysis: Analysis) => void;
    boardRef?: ForwardedRef<BaseChessboardHandles>;
}

export default function ChessboardAnalysisComponent({ onAnalysisAction, boardRef }: Props) {
    const [position, setPosition] = useState(new Chess().fen());
    const engineRef = useRef<Engine | null>(null);
    const multiPvLinesRef = useRef<string[]>([]);

    // Init engine
    useEffect(() => {
        const engine = new Engine();
        engineRef.current = engine;

        engineRef.current.stockfish?.postMessage("setoption name MultiPV value 3");

        engine.onMessage((msg) => {
            const uciMessage = msg.uciMessage;

            if (!uciMessage.startsWith("info") || !uciMessage.includes(" pv ")) return;

            const depthMatch = uciMessage.match(/depth (\d+)/);
            if (!depthMatch) return;
            const depth = Number(depthMatch[1]);
            if (depth < 10) return;

            const multipvMatch = uciMessage.match(/multipv (\d+)/);
            const multipv = multipvMatch ? Number(multipvMatch[1]) - 1 : 0;

            const pvMatch = uciMessage.match(/ pv (.+)/);
            if (!pvMatch) return;

            const pvUci = pvMatch[1];
            const tempChess = new Chess(position);
            const sanMoves: string[] = [];

            for (const uciMove of pvUci.split(" ")) {
                const from = uciMove.slice(0, 2);
                const to = uciMove.slice(2, 4);
                const promotion = uciMove[4] as string | undefined;
                try {
                    const move = tempChess.move({ from, to, promotion });
                    if (move) sanMoves.push(move.san);
                } catch { break; }
            }

            if (sanMoves.length) multiPvLinesRef.current[multipv] = sanMoves.join(" ");

            const cpMatch = uciMessage.match(/score cp (-?\d+)/);
            const mateMatch = uciMessage.match(/score mate (-?\d+)/);

            const evalScore = cpMatch
                ? (tempChess.turn() === "w" ? 1 : -1) * Number(cpMatch[1]) / 100
                : 0;
            const mate = mateMatch ? mateMatch[1] : undefined;

            onAnalysisAction?.({
                eval: evalScore,
                depth,
                pv: multiPvLinesRef.current.filter(Boolean).join("\n"),
                mate,
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
        engineRef.current.evaluatePosition(position, 18);
    }, [position]);

    return (
        <ChessboardComponent
            ref={boardRef}
            initialPosition={position}
            onPositionChange={(fen: string) => setPosition(fen)}
        />
    );
}