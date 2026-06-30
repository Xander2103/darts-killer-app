// www/cricket/cricket-engine.js

// "bull" = unified Bull target. O.Bull UI button = 1 mark, I.Bull = 2 marks, value 25 pts each.
const TARGETS_STANDARD = [20, 19, 18, 17, 16, 15, "bull"];
const TARGETS_EXTENDED = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, "bull"];

// Point value scored per extra mark once a target is closed
const POINT_VALUE = {
    20: 20, 19: 19, 18: 18, 17: 17, 16: 16, 15: 15,
    14: 14, 13: 13, 12: 12, 11: 11, 10: 10,
    "bull": 25
};

export class CricketEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.status = "setup"; // setup | playing | finished
        this.players = [];
        this.activeTargets = [...TARGETS_STANDARD];
        this.variant = "standard";
        this.currentPlayerIndex = 0;
        this.dartsThisTurn = 0;
        this.history = [];
        this.winnerIndex = null;
    }

    // Returns the currently active target list (set by start())
    targets() {
        return this.activeTargets;
    }

    // variant: "standard" | "extended"
    start(playerNames, variant = "standard") {
        this.reset();
        this.variant = variant;
        this.activeTargets = variant === "extended"
            ? [...TARGETS_EXTENDED]
            : [...TARGETS_STANDARD];

        this.players = playerNames.map((name, i) => {
            const marks = {};
            this.activeTargets.forEach(t => { marks[t] = 0; });
            return {
                name: (name && name.trim()) ? name.trim() : `Player ${i + 1}`,
                marks,
                points: 0
            };
        });
        this.status = "playing";
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex] ?? null;
    }

    isTargetClosed(playerIndex, target) {
        return (this.players[playerIndex]?.marks[target] ?? 0) >= 3;
    }

    isTargetClosedByAll(target) {
        return this.players.every((_, i) => this.isTargetClosed(i, target));
    }

    saveState() {
        this.history.push({
            players: JSON.parse(JSON.stringify(this.players)),
            currentPlayerIndex: this.currentPlayerIndex,
            dartsThisTurn: this.dartsThisTurn,
            status: this.status,
            winnerIndex: this.winnerIndex
            // activeTargets and variant are immutable during a game — not saved
        });
    }

    // target: any value in activeTargets
    // marksAwarded: 1-3 (bull targets always receive 1 from the UI)
    throwDart(target, marksAwarded) {
        if (this.status !== "playing") return;
        if (!this.activeTargets.includes(target)) return;

        // If all players have already closed this target, do nothing
        if (this.isTargetClosedByAll(target)) return;

        this.saveState();

        const player = this.players[this.currentPlayerIndex];
        const currentMarks = player.marks[target];
        player.marks[target] = currentMarks + marksAwarded;

        // Award points for marks beyond 3, only while opponents haven't all closed
        const solo = this.players.length === 1;
        if (!solo && !this.isTargetClosedByAll(target)) {
            const pv = POINT_VALUE[target] ?? target;
            if (currentMarks >= 3) {
                player.points += marksAwarded * pv;
            } else {
                const marksToClose = 3 - currentMarks;
                const scoringMarks = Math.max(0, marksAwarded - marksToClose);
                player.points += scoringMarks * pv;
            }
        }

        this.dartsThisTurn++;

        if (this._checkWin(this.currentPlayerIndex)) {
            this.winnerIndex = this.currentPlayerIndex;
            this.status = "finished";
            return;
        }

        if (this.dartsThisTurn >= 3) {
            this._advanceTurn();
        }
    }

    miss() {
        if (this.status !== "playing") return;
        this.saveState();
        this.dartsThisTurn++;
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
        if (this._isDeadlocked()) {
            this.winnerIndex = this._findHighestScorer();
            this.status = "finished";
        }
    }

    _checkWin(playerIndex) {
        const player = this.players[playerIndex];
        const allClosed = this.activeTargets.every(t => (player.marks[t] ?? 0) >= 3);
        if (!allClosed) return false;
        // Solo: closing everything is a win
        if (this.players.length === 1) return true;
        // Multiplayer: must also have score >= every opponent
        return this.players.every((_, i) => i === playerIndex || player.points >= this.players[i].points);
    }

    _isDeadlocked() {
        return this.activeTargets.every(t => this.isTargetClosedByAll(t));
    }

    _findHighestScorer() {
        let bestPoints = -1;
        let bestIdx = 0;
        this.players.forEach((p, i) => {
            if (p.points > bestPoints) {
                bestPoints = p.points;
                bestIdx = i;
            }
        });
        return bestIdx;
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
