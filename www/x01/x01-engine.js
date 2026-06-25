// www/x01/x01-engine.js
import { getCheckoutAdvice } from "../checkout/checkout-routes.js";

export class X01Engine {
    constructor() {
        this.reset();
    }

    reset() {
        this.status = "setup"; // setup | playing | legWon | matchWon
        this.startScore = 501;
        this.playType = "individual"; // individual | teams
        this.legsToWin = 1;
        this.finishRule = "double"; // double | single
        this.checkoutSuggestions = true;

        // Individual mode
        this.players = [];

        // Teams mode
        this.teams = [];

        // Turn order: [{ label, teamIndex, playerIndex, teamPlayerIndex }]
        // For individual: teamIndex === null; for teams: playerIndex === null
        this.turnOrder = [];
        this.currentTurnPos = 0;

        // Scores: individual → keyed by playerIndex; teams → keyed by teamIndex
        this.scores = {};

        // Legs won: same keying as scores
        this.legsWon = {};

        this.currentLeg = 1;
        this.legWinnerLabel = null;
        this.matchWinnerLabel = null;

        // Last 8 turns for display (newest first)
        this.turnLog = [];

        // Undo history (snapshots of mutable state before each submitScore call)
        this.history = [];
    }

    start(config) {
        this.reset();

        this.startScore = config.startScore;
        this.playType = config.playType;
        this.legsToWin = config.legsToWin;
        this.finishRule = config.finishRule;
        this.checkoutSuggestions = config.checkoutSuggestions;

        if (this.playType === "individual") {
            this.players = config.players.map((p, i) => ({
                name: (p.name && p.name.trim()) ? p.name.trim() : `Player ${i + 1}`
            }));
            this._initScoresIndividual();
            this._buildTurnOrderIndividual();
        } else {
            this.teams = config.teams.map((t, ti) => ({
                name: (t.name && t.name.trim()) ? t.name.trim() : `Team ${ti + 1}`,
                players: t.players.map((p, pi) => ({
                    name: (p.name && p.name.trim()) ? p.name.trim() : `Player ${pi + 1}`
                }))
            }));
            this._initScoresTeams();
            this._buildTurnOrderTeams();
        }

        this.status = "playing";
    }

    _initScoresIndividual() {
        this.scores = {};
        this.legsWon = {};
        this.players.forEach((_, i) => {
            this.scores[i] = this.startScore;
            this.legsWon[i] = 0;
        });
    }

    _initScoresTeams() {
        this.scores = {};
        this.legsWon = {};
        this.teams.forEach((_, i) => {
            this.scores[i] = this.startScore;
            this.legsWon[i] = 0;
        });
    }

    _buildTurnOrderIndividual() {
        this.turnOrder = this.players.map((p, i) => ({
            label: p.name,
            teamIndex: null,
            playerIndex: i,
            teamPlayerIndex: null
        }));
    }

    // Interleaved rotation: Team1P1, Team2P1, Team1P2, Team2P2, …
    // With 2 teams [A,B] and [C,D]: order is A, C, B, D, repeat.
    _buildTurnOrderTeams() {
        const maxPlayers = Math.max(...this.teams.map(t => t.players.length));
        const order = [];
        for (let playerSlot = 0; playerSlot < maxPlayers; playerSlot++) {
            for (let teamIdx = 0; teamIdx < this.teams.length; teamIdx++) {
                const team = this.teams[teamIdx];
                // Wrap around if this team has fewer players than others
                const tp = playerSlot % team.players.length;
                const player = team.players[tp];
                order.push({
                    label: `${team.name} — ${player.name}`,
                    teamIndex: teamIdx,
                    playerIndex: null,
                    teamPlayerIndex: tp
                });
            }
        }
        this.turnOrder = order;
    }

    getCurrentTurn() {
        if (this.turnOrder.length === 0) return null;
        return this.turnOrder[this.currentTurnPos % this.turnOrder.length];
    }

    getCurrentScore() {
        const turn = this.getCurrentTurn();
        if (!turn) return 0;
        const key = turn.teamIndex !== null ? turn.teamIndex : turn.playerIndex;
        return this.scores[key] ?? 0;
    }

    submitScore(rawPoints) {
        if (this.status !== "playing") return;

        const points = Math.max(0, Math.min(180, Math.round(Number(rawPoints) || 0)));
        const turn = this.getCurrentTurn();
        if (!turn) return;

        const key = turn.teamIndex !== null ? turn.teamIndex : turn.playerIndex;
        const before = this.scores[key];
        const after = before - points;

        this.saveState();

        // Bust: would go below 0
        if (after < 0) {
            this._recordBust(turn.label, points, before);
            this._advanceTurn();
            return;
        }

        // Bust: remaining would be 1 in double-out (can't finish on a double from 1)
        if (this.finishRule === "double" && after === 1) {
            this._recordBust(turn.label, points, before);
            this._advanceTurn();
            return;
        }

        // Valid finish
        if (after === 0) {
            this.scores[key] = 0;
            this._recordTurn(turn.label, points, 0, false);
            this.legsWon[key] = (this.legsWon[key] || 0) + 1;
            this.legWinnerLabel = turn.label;

            if (this.legsWon[key] >= this.legsToWin) {
                this.matchWinnerLabel = turn.label;
                this.status = "matchWon";
            } else {
                this.status = "legWon";
            }
            return;
        }

        // Normal turn
        this.scores[key] = after;
        this._recordTurn(turn.label, points, after, false);
        this._advanceTurn();
    }

    // Call after leg won to reset scores and continue
    startNextLeg() {
        if (this.status !== "legWon") return;
        this.currentLeg++;
        this.legWinnerLabel = null;
        if (this.playType === "individual") {
            this._initScoresIndividual();
        } else {
            this._initScoresTeams();
        }
        this._advanceTurn();
        this.status = "playing";
    }

    undo() {
        const prev = this.history.pop();
        if (!prev) return;
        this.scores = prev.scores;
        this.currentTurnPos = prev.currentTurnPos;
        this.legsWon = prev.legsWon;
        this.currentLeg = prev.currentLeg;
        this.status = prev.status;
        this.turnLog = prev.turnLog;
        this.legWinnerLabel = prev.legWinnerLabel;
        this.matchWinnerLabel = prev.matchWinnerLabel;
    }

    saveState() {
        this.history.push({
            scores: JSON.parse(JSON.stringify(this.scores)),
            currentTurnPos: this.currentTurnPos,
            legsWon: JSON.parse(JSON.stringify(this.legsWon)),
            currentLeg: this.currentLeg,
            status: this.status,
            turnLog: JSON.parse(JSON.stringify(this.turnLog)),
            legWinnerLabel: this.legWinnerLabel,
            matchWinnerLabel: this.matchWinnerLabel
        });
    }

    getCheckoutSuggestion() {
        if (!this.checkoutSuggestions || this.status !== "playing") return null;
        const score = this.getCurrentScore();
        // Only show suggestion when checkout is theoretically possible (≤ 170, > 1)
        if (score > 170 || score <= 1) return null;
        return getCheckoutAdvice(score, 3);
    }

    _recordBust(label, scored, before) {
        this.turnLog.unshift({ label, scored, remaining: before, bust: true });
        if (this.turnLog.length > 8) this.turnLog.pop();
    }

    _recordTurn(label, scored, remaining, bust) {
        this.turnLog.unshift({ label, scored, remaining, bust });
        if (this.turnLog.length > 8) this.turnLog.pop();
    }

    _advanceTurn() {
        this.currentTurnPos++;
    }
}
