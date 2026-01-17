/*!
 * Stockfish.js (http://github.com/nmrugg/stockfish.js)
 * License: GPL
 */

/*
 * Description of the universal chess interface (UCI)  https://gist.github.com/aliostad/f4470274f39d29b788c1b09519e67372/
 */

type EngineMessage = {
    /** stockfish engine message in UCI format*/
    uciMessage: string;
    /** found best move for current position in format `e2e4`*/
    bestMove?: string;
    /** found best move for opponent in format `e7e5` */
    ponder?: string;
    /**  material balance's difference in centipawns(IMPORTANT! stockfish gives the cp score in terms of whose turn it is)*/
    positionEvaluation?: string;
    /** count of moves until mate */
    possibleMate?: string;
    /** the best line found */
    pv?: string;
    /** number of halfmoves the engine looks ahead */
    depth?: number;
};

export default class Engine {
    stockfish: Worker | null = null;
    onMessage: (callback: (msg: EngineMessage) => void) => void = () => {};
    isReady: boolean = false;

    constructor() {
        if (typeof window !== "undefined") {
            this.loadStockfish();
        }
    }

    private loadStockfish() {
        this.stockfish = new Worker("/stockfish/stockfish.wasm.js");

        this.onMessage = (callback: (msg: EngineMessage) => void) => {
            this.stockfish?.addEventListener("message", (event) => {
                callback(this.transformSFMessageData(event.data));
            });
        };
        this.init();
    }

    private transformSFMessageData(msg: string): EngineMessage {
        const uciMessage = msg;
        return {
            uciMessage,
            bestMove: uciMessage.match(/bestmove\s+(\S+)/)?.[1],
            ponder: uciMessage.match(/ponder\s+(\S+)/)?.[1],
            positionEvaluation: uciMessage.match(/score cp (-?\d+)/)?.[1],
            possibleMate: uciMessage.match(/score mate (-?\d+)/)?.[1],
            pv: uciMessage.match(/ pv (.*)/)?.[1],
            depth: Number(uciMessage.match(/ depth (\d+)/)?.[1] ?? 0),
        };
    }

    init() {
        if (!this.stockfish) return;
        this.stockfish.postMessage("uci");
        this.stockfish.postMessage("isready");
        this.onMessage(({ uciMessage }) => {
            if (uciMessage === "readyok") this.isReady = true;
        });
    }

    onReady(callback: () => void) {
        this.onMessage(({ uciMessage }) => {
            if (uciMessage === "readyok") callback();
        });
    }

    evaluatePosition(fen: string, depth = 12) {
        if (!this.stockfish) return;
        if (depth > 24) depth = 24;
        this.stockfish.postMessage(`position fen ${fen}`);
        this.stockfish.postMessage(`go depth ${depth}`);
    }

    stop() {
        this.stockfish?.postMessage("stop");
    }

    terminate() {
        this.isReady = false;
        this.stockfish?.postMessage("quit");
    }
}