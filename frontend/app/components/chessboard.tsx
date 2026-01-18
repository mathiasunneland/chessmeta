"use client";

import { useRef, useState, useLayoutEffect, forwardRef, useImperativeHandle } from "react";
import { Chess, Square, PieceSymbol } from "chess.js";
import {
    Chessboard,
    chessColumnToColumnIndex,
    PieceDropHandlerArgs,
    SquareHandlerArgs
} from "react-chessboard";

export interface BaseChessboardProps {
    initialPosition?: string;
    onPositionChange?: (fen: string) => void;
    onMovesChange?: (moves: string[], pgn: string) => void;
}

export interface BaseChessboardHandles {
    undo: () => void;
    redo: () => void;
    getFen: () => string;
    getPgn: () => string;
    getMoves: () => string[];
}

const ChessboardComponent = forwardRef<BaseChessboardHandles, BaseChessboardProps>(
    ({ initialPosition, onPositionChange, onMovesChange }, ref) => {
        const chessGameRef = useRef(new Chess(initialPosition));
        const chessGame = chessGameRef.current;

        const chessboardRef = useRef<HTMLDivElement>(null);
        const [squareWidth, setSquareWidth] = useState(0);

        const [chessPosition, setChessPosition] = useState(chessGame.fen());
        const [moveFrom, setMoveFrom] = useState('');
        const [optionSquares, setOptionSquares] = useState({});
        const [promotionMove, setPromotionMove] = useState<Omit<PieceDropHandlerArgs, 'piece'> | null>(null);

        const redoStackRef = useRef<ReturnType<Chess['move']>[]>([]);
        const [moveHistory, setMoveHistory] = useState<string[]>([]);
        const [pgnHistory, setPgnHistory] = useState<string>('');

        useLayoutEffect(() => {
            if (chessboardRef.current) {
                const firstSquare = chessboardRef.current.querySelector('[data-column="a"][data-row="1"]');
                if (firstSquare) {
                    setSquareWidth(firstSquare.getBoundingClientRect().width);
                }
            }
        }, []);

        // Update history after every move/undo/redo
        const updateHistory = () => {
            const moves = chessGame.history();
            setMoveHistory(moves);
            const pgn = chessGame.pgn();
            setPgnHistory(pgn);
            onMovesChange?.(moves, pgn);
        };

        // Highlight move options
        function getMoveOptions(square: Square) {
            const moves = chessGame.moves({square, verbose: true});
            if (moves.length === 0) {
                setOptionSquares({});
                return false;
            }

            const newSquares: Record<string, React.CSSProperties> = {};
            for (const move of moves) {
                newSquares[move.to] = {
                    background:
                        chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color
                            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                    borderRadius: '50%',
                };
            }
            newSquares[square] = {background: 'rgba(255, 255, 0, 0.4)'};
            setOptionSquares(newSquares);
            return true;
        }

        // Unified move handling for click
        function handleMove(from: Square, to: Square) {
            const moves = chessGame.moves({square: from, verbose: true});
            const foundMove = moves.find(m => m.from === from && m.to === to);
            if (!foundMove) return false;

            const promotionNeeded = chessGame.get(from)?.type === 'p' && (to[1] === '8' || to[1] === '1');
            if (promotionNeeded) {
                setPromotionMove({sourceSquare: from, targetSquare: to});
                return true;
            }

            chessGame.move({from, to});
            redoStackRef.current = [];
            setChessPosition(chessGame.fen());
            onPositionChange?.(chessGame.fen());
            updateHistory();
            setOptionSquares({});
            setMoveFrom('');
            return true;
        }

        // Undo function
        function undo() {
            const move = chessGame.undo();
            if (move) {
                redoStackRef.current.push(move);
                setChessPosition(chessGame.fen());
                onPositionChange?.(chessGame.fen());
                updateHistory();
            }
        }

        // Redo function
        function redo() {
            const move = redoStackRef.current.pop();
            if (move) {
                chessGame.move(move);
                setChessPosition(chessGame.fen());
                onPositionChange?.(chessGame.fen());
                updateHistory();
            }
        }

        useImperativeHandle(ref, () => ({
            undo,
            redo,
            getFen: () => chessGame.fen(),
            getPgn: () => chessGame.pgn(),
            getMoves: () => chessGame.history(),
        }));

        // Add undo and redo to arrow keys
        useLayoutEffect(() => {
            function handleKeyDown(e: KeyboardEvent) {
                if (e.key === "ArrowLeft") {
                    undo();
                }

                if (e.key === "ArrowRight") {
                    redo();
                }
            }

            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }, []);

        // Click handler
        function onSquareClick({square, piece}: SquareHandlerArgs) {
            if (square === moveFrom) {
                setMoveFrom('');
                setOptionSquares({});
                return;
            }
            if (moveFrom) {
                const moved = handleMove(moveFrom as Square, square as Square);

                if (!moved && piece) {
                    const hasOptions = getMoveOptions(square as Square);
                    if (hasOptions) setMoveFrom(square);
                    else setMoveFrom('');
                } else if (!moved) {
                    setMoveFrom('');
                    setOptionSquares({});
                }
                return;
            }
            if (piece) {
                const hasOptions = getMoveOptions(square as Square);
                if (hasOptions) setMoveFrom(square);
            }
        }

        // Drag start handler
        function onPieceDrag({square, piece, isSparePiece}: {
            square: string | null;
            piece: { pieceType: string };
            isSparePiece: boolean
        }) {
            if (!square || !piece) return;
            const hasOptions = getMoveOptions(square as Square);
            if (hasOptions) setMoveFrom(square);
        }

        // Drag end handler
        function onPieceDrop({sourceSquare, targetSquare}: PieceDropHandlerArgs) {
            if (!targetSquare) return false;
            return handleMove(sourceSquare as Square, targetSquare as Square);
        }

        // Handle promotion selection
        function onPromotionPieceSelect(piece: PieceSymbol) {
            if (!promotionMove?.targetSquare) return;
            const {sourceSquare, targetSquare} = promotionMove;
            chessGame.move({from: sourceSquare, to: targetSquare, promotion: piece});
            redoStackRef.current = [];
            setChessPosition(chessGame.fen());
            onPositionChange?.(chessGame.fen());
            updateHistory();
            setPromotionMove(null);
            setOptionSquares({});
            setMoveFrom('');
        }

        // Calculate left position for promotion overlay
        const promotionSquareLeft =
            promotionMove?.targetSquare && squareWidth
                ? squareWidth *
                chessColumnToColumnIndex(
                    promotionMove.targetSquare[0],
                    8,
                    'white'
                )
                : 0;

        // Calculate top position for promotion overlay
        const promotionSquareTop =
            promotionMove && squareWidth
                ? chessGame.get(promotionMove.targetSquare as Square)?.color === 'w'
                    ? squareWidth * 4
                    : 0
                : 0;

        // Calculate order of pieces for promotion overlay
        const promotionPiecesOrdered: PieceSymbol[] = promotionMove
            ? chessGame.get(promotionMove.targetSquare as Square)?.color === 'w'
                ? ["n", "b", "r", "q"]
                : ["q", "r", "b", "n"]
            : ["q", "r", "b", "n"];

        // Cancel promotion when clicking outside
        useLayoutEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
                if (!promotionMove) return;

                const target = e.target as HTMLElement;
                if (!target.closest(".promotion-overlay")) {
                    setPromotionMove(null);
                }
            };

            document.addEventListener("click", handleClickOutside);
            return () => document.removeEventListener("click", handleClickOutside);
        }, [promotionMove]);

        const chessboardOptions = {
            onPieceDrag,
            onPieceDrop,
            onSquareClick,
            position: chessPosition,
            squareStyles: optionSquares,
            id: 'click-or-drag-to-move',
        };

        return (
            <div style={{position: "relative"}} ref={chessboardRef}>
                {promotionMove && squareWidth > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: promotionSquareTop,
                            left: promotionSquareLeft,
                            width: squareWidth,
                            zIndex: 1000,
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "white",
                            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                        }}
                    >
                        {promotionPiecesOrdered.map((piece, idx) => (
                            <button
                                key={piece}
                                onClick={() => onPromotionPieceSelect(piece)}
                                style={{
                                    width: "100%",
                                    aspectRatio: "1",
                                    border: "1px solid black",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.5rem",
                                    fontWeight: "bold",
                                    color: "black",
                                }}
                            >
                                {piece.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}
                <Chessboard options={chessboardOptions}/>
            </div>
        );
    }
);

export default ChessboardComponent;