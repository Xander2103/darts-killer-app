// www/x01/x01-engine.js
import { getCheckoutAdvice } from "../checkout/checkout-routes.js";

export class X01Engine {
    constructor() {
        this.reset();
    }

    reset() {
        this.status = "setup"; // setup | playing | awaitingDoubleConfirm | legWon | matchWon
        this.startScore = 501;
        this.playType = "individual";
        this.legsToWin = 1;
        this.finishRule = "double";
        this.checkoutSuggestions = true;
        this.inputMode = "total"; // total | dartbydart

        this.players = [];
        this.teams = [];
        this.turnOrder = [];
        this.currentTurnPos = 0;

        this.scores = {};
        this.legsWon = {};

        this.currentLeg = 1;
        this.legWinnerLabel = null;
        this.matchWinnerLabel = null;

        // Dart-by-dart: darts thrown this turn (not yet committed to scores)
        // scores[key] is NOT updated mid-turn in dart-by-dart mode.
        this.turnDarts = []; // [{ value, label, isDouble }]
        this.selectedMultiplier = 1; // 1=Single, 2=Double, 3=Triple

        // Total mode: pending double-out confirmation
        this.pendingDoubleConfirm = null; // { key, points, turnLabel }

        this.turnLog = [];
        this.history = [];
        this.playerStats = {};
    }

    start(config) {
        this.reset();
        this.startScore = config.startScore;
        this.playType = config.playType;
        this.legsToWin = config.legsToWin;
        this.finishRule = config.finishRule;
        this.checkoutSuggestions = config.checkoutSuggestions;
        this.inputMode = "total"; // always starts in total mode; switched in-game

        if (this.playType === "individual") {
            this.players = config.players.map((p, i) => ({
                name: (p.name && p.name.trim()) ? p.name.trim() : `Player ${i + 1}`
            }));
            this._initScores("player");
            this._buildTurnOrderIndividual();
        } else {
            this.teams = config.teams.map((t, ti) => ({
                name: (t.name && t.name.trim()) ? t.name.trim() : `Team ${ti + 1}`,
                players: t.players.map((p, pi) => ({
                    name: (p.name && p.name.trim()) ? p.name.trim() : `Player ${pi + 1}`
                }))
            }));
            this._initScores("team");
            this._buildTurnOrderTeams();
        }

        this._initPlayerStats();
        this.status = "playing";
    }

    _initScores(type) {
        this.scores = {};
        this.legsWon = {};
        const items = type === "player" ? this.players : this.teams;
        items.forEach((_, i) => {
            this.scores[i] = this.startScore;
            this.legsWon[i] = 0;
        });
    }

    _buildTurnOrderIndividual() {
        this.turnOrder = this.players.map((p, i) => ({
            label: p.name,
            teamIndex: null,
            playerIndex: i
        }));
    }

    // Interleaved rotation: T1P1, T2P1, T1P2, T2P2, …
    _buildTurnOrderTeams() {
        const maxPlayers = Math.max(...this.teams.map(t => t.players.length));
        const order = [];
        for (let slot = 0; slot < maxPlayers; slot++) {
            for (let ti = 0; ti < this.teams.length; ti++) {
                const team = this.teams[ti];
                const pi = slot % team.players.length;
                order.push({
                    label: `${team.name} — ${team.players[pi].name}`,
                    teamIndex: ti,
                    teamPlayerIndex: pi,
                    playerIndex: null
                });
            }
        }
        this.turnOrder = order;
    }

    getCurrentTurn() {
        if (!this.turnOrder.length) return null;
        return this.turnOrder[this.currentTurnPos % this.turnOrder.length];
    }

    _activeKey() {
        const turn = this.getCurrentTurn();
        if (!turn) return null;
        return turn.teamIndex !== null ? turn.teamIndex : turn.playerIndex;
    }

    // Returns effective remaining for the active player.
    // In dart-by-dart mode, subtracts darts thrown this turn.
    getCurrentScore() {
        const key = this._activeKey();
        if (key === null) return 0;
        const base = this.scores[key] ?? 0;
        if (this.inputMode === "dartbydart") {
            return base - this._turnDartsTotal();
        }
        return base;
    }

    // ─── PLAYER STATS ─────────────────────────────────────────────────────────

    _initPlayerStats() {
        this.playerStats = {};
        if (this.playType === "individual") {
            this.players.forEach((_, i) => {
                this.playerStats[`p${i}`] = { legTurns: 0, legPoints: 0, matchTurns: 0, matchPoints: 0 };
            });
        } else {
            this.teams.forEach((team, ti) => {
                team.players.forEach((_, pi) => {
                    this.playerStats[`t${ti}p${pi}`] = { legTurns: 0, legPoints: 0, matchTurns: 0, matchPoints: 0 };
                });
            });
        }
    }

    _activeStatsKey() {
        const turn = this.getCurrentTurn();
        if (!turn) return null;
        if (turn.teamIndex !== null) {
            return `t${turn.teamIndex}p${turn.teamPlayerIndex ?? 0}`;
        }
        return `p${turn.playerIndex}`;
    }

    _recordTurnStats(statsKey, points) {
        const s = this.playerStats[statsKey];
        if (!s) return;
        s.legTurns++;
        s.legPoints += points;
        s.matchTurns++;
        s.matchPoints += points;
    }

    getLegAvg(statsKey) {
        const s = this.playerStats[statsKey];
        if (!s || s.legTurns === 0) return null;
        return s.legPoints / s.legTurns;
    }

    getMatchAvg(statsKey) {
        const s = this.playerStats[statsKey];
        if (!s || s.matchTurns === 0) return null;
        return s.matchPoints / s.matchTurns;
    }

    switchInputMode(newMode) {
        if (this.inputMode === newMode) return;
        // Clear any partial dart-by-dart turn silently
        this.turnDarts = [];
        this.selectedMultiplier = 1;
        this.inputMode = newMode;
    }

    // ─── TOTAL MODE ──────────────────────────────────────────────────────────

    submitScore(rawPoints) {
        if (this.status !== "playing") return;
        const points = Math.max(0, Math.min(180, Math.round(Number(rawPoints) || 0)));
        const turn = this.getCurrentTurn();
        if (!turn) return;
        const key = turn.teamIndex !== null ? turn.teamIndex : turn.playerIndex;
        const before = this.scores[key];
        const after = before - points;
        const statsKey = this._activeStatsKey();

        this.saveState();

        if (after < 0 || (this.finishRule === "double" && after === 1)) {
            this._recordTurnStats(statsKey, 0);
            this._recordBust(turn.label, points, before);
            this._advanceTurn();
            return;
        }

        if (after === 0) {
            if (this.finishRule === "double") {
                this.pendingDoubleConfirm = { key, points, turnLabel: turn.label, statsKey };
                this.status = "awaitingDoubleConfirm";
                return;
            }
            this._recordTurnStats(statsKey, points);
            this._awardLeg(key, turn.label, points);
            return;
        }

        this._recordTurnStats(statsKey, points);
        this.scores[key] = after;
        this._recordTurn(turn.label, points, after, false);
        this._advanceTurn();
    }

    confirmDoubleOut(confirmed) {
        if (this.status !== "awaitingDoubleConfirm" || !this.pendingDoubleConfirm) return;
        const { key, points, turnLabel, statsKey } = this.pendingDoubleConfirm;
        const before = this.scores[key];
        this.pendingDoubleConfirm = null;

        if (confirmed) {
            this._recordTurnStats(statsKey, points);
            this._awardLeg(key, turnLabel, points);
        } else {
            this._recordTurnStats(statsKey, 0);
            this._recordBust(turnLabel, points, before);
            this.status = "playing";
            this._advanceTurn();
        }
    }

    // ─── NEXT TURN / END TURN ─────────────────────────────────────────────────

    nextTurn() {
        if (this.status !== "playing") return;
        this.saveState();
        const turn = this.getCurrentTurn();
        const key = turn.teamIndex !== null ? turn.teamIndex : turn.playerIndex;
        const statsKey = this._activeStatsKey();
        this._recordTurnStats(statsKey, 0);
        this._recordTurn(turn.label, 0, this.scores[key], false);
        this.turnDarts = [];
        this.selectedMultiplier = 1;
        this._advanceTurn();
    }

    // Dart-by-dart: commit partial turn early. Scored = sum of darts thrown (0 if none).
    endTurnEarly() {
        if (this.status !== "playing") return;
        this.saveState();
        const turn = this.getCurrentTurn();
        const key = turn.teamIndex !== null ? turn.teamIndex : turn.playerIndex;
        const statsKey = this._activeStatsKey();
        const total = this._turnDartsTotal();
        this.scores[key] -= total;
        this._recordTurnStats(statsKey, total);
        this._recordTurn(turn.label, total, this.scores[key], false);
        this.turnDarts = [];
        this.selectedMultiplier = 1;
        this._advanceTurn();
    }

    // ─── DART-BY-DART MODE ───────────────────────────────────────────────────

    selectMultiplier(m) {
        if ([1, 2, 3].includes(m)) this.selectedMultiplier = m;
    }

    // rawValue: 1–20 for segments, 25 for outer/inner bull, 0 for miss.
    // scores[key] is the score at the START of the turn (never updated mid-turn).
    // Effective remaining = scores[key] − turnDartsTotal().
    addDart(rawValue) {
        if (this.status !== "playing") return;
        if (this.turnDarts.length >= 3) return;

        const mult = this.selectedMultiplier;
        let value, label, isDouble;

        if (rawValue === 0) {
            value = 0; label = "Miss"; isDouble = false;
        } else if (rawValue === 25) {
            if (mult === 2) {
                value = 50; label = "Bull"; isDouble = true;
            } else {
                value = 25; label = "25"; isDouble = false;
            }
        } else {
            value = rawValue * mult;
            const prefix = mult === 1 ? "" : mult === 2 ? "D" : "T";
            label = `${prefix}${rawValue}`;
            isDouble = (mult === 2);
        }

        const turn = this.getCurrentTurn();
        if (!turn) return;
        const key = turn.teamIndex !== null ? turn.teamIndex : turn.playerIndex;
        const statsKey = this._activeStatsKey();

        // scores[key] = turn start score (never changes mid-turn)
        const turnStart = this.scores[key];
        // Effective remaining BEFORE this dart:
        const runningRemaining = turnStart - this._turnDartsTotal();
        const afterThis = runningRemaining - value;

        this.saveState();
        this.selectedMultiplier = 1;

        // Bust: below zero or remaining 1 in double-out
        if (afterThis < 0 || (this.finishRule === "double" && afterThis === 1)) {
            this._recordTurnStats(statsKey, 0);
            this._recordBust(turn.label, this._turnDartsTotal() + value, turnStart);
            this.turnDarts = [];
            this._advanceTurn();
            return;
        }

        // Finish
        if (afterThis === 0) {
            if (this.finishRule === "double" && !isDouble) {
                // Must finish on a double or bull — bust
                this._recordTurnStats(statsKey, 0);
                this._recordBust(turn.label, this._turnDartsTotal() + value, turnStart);
                this.turnDarts = [];
                this._advanceTurn();
                return;
            }
            // Valid finish — commit the full turn
            const total = this._turnDartsTotal() + value;
            this.scores[key] = 0;
            this.turnDarts = [];
            this._recordTurnStats(statsKey, total);
            this._awardLeg(key, turn.label, total);
            return;
        }

        // Normal dart — add to turnDarts but do NOT update scores[key]
        this.turnDarts.push({ value, label, isDouble });

        if (this.turnDarts.length >= 3) {
            // End of 3-dart turn — commit
            const total = this._turnDartsTotal();
            this.scores[key] = turnStart - total;
            this._recordTurnStats(statsKey, total);
            this._recordTurn(turn.label, total, this.scores[key], false);
            this.turnDarts = [];
            this._advanceTurn();
        }
    }

    _turnDartsTotal() {
        return this.turnDarts.reduce((s, d) => s + d.value, 0);
    }

    // ─── LEG / MATCH ─────────────────────────────────────────────────────────

    _awardLeg(key, turnLabel, scored) {
        this.scores[key] = 0;
        this._recordTurn(turnLabel, scored, 0, false);
        this.legsWon[key] = (this.legsWon[key] || 0) + 1;
        this.legWinnerLabel = turnLabel;

        if (this.legsWon[key] >= this.legsToWin) {
            this.matchWinnerLabel = turnLabel;
            this.status = "matchWon";
        } else {
            this.status = "legWon";
        }
    }

    startNextLeg() {
        if (this.status !== "legWon") return;
        this.currentLeg++;
        this.legWinnerLabel = null;
        this.turnDarts = [];
        this.selectedMultiplier = 1;
        this._initScores(this.playType === "individual" ? "player" : "team");
        Object.values(this.playerStats).forEach(s => {
            s.legTurns = 0;
            s.legPoints = 0;
        });
        this._advanceTurn();
        this.status = "playing";
    }

    // ─── UNDO ────────────────────────────────────────────────────────────────

    saveState() {
        this.history.push({
            scores: JSON.parse(JSON.stringify(this.scores)),
            currentTurnPos: this.currentTurnPos,
            legsWon: JSON.parse(JSON.stringify(this.legsWon)),
            currentLeg: this.currentLeg,
            status: this.status,
            turnLog: JSON.parse(JSON.stringify(this.turnLog)),
            legWinnerLabel: this.legWinnerLabel,
            matchWinnerLabel: this.matchWinnerLabel,
            turnDarts: JSON.parse(JSON.stringify(this.turnDarts)),
            pendingDoubleConfirm: this.pendingDoubleConfirm ? { ...this.pendingDoubleConfirm } : null,
            selectedMultiplier: this.selectedMultiplier,
            playerStats: JSON.parse(JSON.stringify(this.playerStats))
        });
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
        this.turnDarts = prev.turnDarts;
        this.pendingDoubleConfirm = prev.pendingDoubleConfirm;
        this.selectedMultiplier = prev.selectedMultiplier;
        this.playerStats = prev.playerStats;
    }

    getCheckoutSuggestion() {
        if (!this.checkoutSuggestions || this.status !== "playing") return null;
        const score = this.getCurrentScore();
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
