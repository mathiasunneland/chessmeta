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

    private async loadStockfish() {
        if (typeof window === "undefined") return;

        try {
            this.stockfish = new Worker("/stockfish/stockfish-17.1-single-a496a04.js", {
                type: "module",
            });

            this.onMessage = (callback: (msg: EngineMessage) => void) => {
                this.stockfish?.addEventListener("message", (event) => {
                    let msg: string;
                    if (typeof event.data === "string") msg = event.data;
                    else if (event.data instanceof ArrayBuffer)
                        msg = new TextDecoder().decode(event.data);
                    else msg = JSON.stringify(event.data);

                    callback(this.transformSFMessageData(msg));
                });
            };

            this.init();
        } catch (err) {
            console.error("Failed to load Stockfish:", err);
        }
    }

    private transformSFMessageData(msg: string): EngineMessage {
        return {
            uciMessage: msg,
            bestMove: msg.match(/bestmove\s+(\S+)/)?.[1],
            ponder: msg.match(/ponder\s+(\S+)/)?.[1],
            positionEvaluation: msg.match(/score cp (-?\d+)/)?.[1],
            possibleMate: msg.match(/score mate (-?\d+)/)?.[1],
            pv: msg.match(/ pv (.*)/)?.[1],
            depth: Number(msg.match(/ depth (\d+)/)?.[1] ?? 0),
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
        this.stockfish?.terminate();
    }
}