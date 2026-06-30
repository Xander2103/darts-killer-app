// www/aroundTheClock/atc-engine.js

// 21 targets: 1-20 (indices 0-19), then Bull (index 20)
const TOTAL_TARGETS = 21;

export class ATCEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.status = "setup"; // setup | playing | finished
        this.players = [];
        this.currentPlayerIndex = 0;
        this.dartsThisTurn = 0;
        this.history = [];
        this.winnerIndex = null;
    }

    targetLabel(index) {
        if (index === 20) return "Bull";
        if (index < 20) return String(index + 1);
        return "—";
    }

    totalTargets() {
        return TOTAL_TARGETS;
    }

    start(playerNames) {
        this.reset();
        this.players = playerNames.map((name, i) => ({
            name: (name && name.trim()) ? name.trim() : `Player ${i + 1}`,
            targetIndex: 0,   // 0 = aiming at 1, 20 = aiming at Bull
            dartsThrown: 0
        }));
        this.status = "playing";
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex] ?? null;
    }

    saveState() {
        this.history.push({
            players: JSON.parse(JSON.stringify(this.players)),
            currentPlayerIndex: this.currentPlayerIndex,
            dartsThisTurn: this.dartsThisTurn,
            status: this.status,
            winnerIndex: this.winnerIndex
        });
    }

    // multiplier: 0 = miss, 1 = single (+1), 2 = double (+2), 3 = triple (+3)
    // Single/double/triple advances target by that amount.
    // Reaching or passing TOTAL_TARGETS (21) wins.
    throwDart(multiplier) {
        if (this.status !== "playing") return;
        if (![0, 1, 2, 3].includes(multiplier)) return;
        const player = this.getCurrentPlayer();
        if (!player) return;

        this.saveState();
        player.dartsThrown++;
        this.dartsThisTurn++;

        if (multiplier > 0) {
            player.targetIndex += multiplier;
            if (player.targetIndex >= TOTAL_TARGETS) {
                player.targetIndex = TOTAL_TARGETS; // clamp for display safety
                this.winnerIndex = this.currentPlayerIndex;
                this.status = "finished";
                return;
            }
        }

        if (this.dartsThisTurn >= 3) {
            this._advanceTurn();
        }
    }

    endTurnEarly() {
        if (this.status !== "playing") return;
        this.saveState();
        this._advanceTurn();
    }

    _advanceTurn() {
        this.dartsThisTurn = 0;
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    undo() {
        const prev = this.history.pop();
        if (!prev) return;
        this.players = prev.players;
        this.currentPlayerIndex = prev.currentPlayerIndex;
        this.dartsThisTurn = prev.dartsThisTurn;
        this.status = prev.status;
        this.winnerIndex = prev.winnerIndex;
    }
}
