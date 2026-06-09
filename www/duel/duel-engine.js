// www/duel/duel-engine.js

export class DuelEngine {
    constructor() {
        this.settings = {
            startHp: 10,
            maxHp: 15,
            dartsPerTurn: 3
        };
        this.reset();
    }

    reset() {
        this.players = [];
        this.phase = "setup";
        this.numberSelectionIndex = 0;
        this.currentPlayerIndex = 0;
        this.currentRound = 1;
        this.dartsThisTurn = 0;
        this.selectedMultiplier = 1;
        this.turnThrows = [];
        this.history = [];
        this.winnerPlayerIndex = null;
        this.activeHealTarget = null;
        this.healRoundTurnsRemaining = 0;
        this.roundsUntilNextHeal = this._randomHealInterval();
        this.lastResult = null;
        this.lastResultCreatedAt = 0;
        this.resultDismissTimer = null;
    }

    start(players) {
        this.reset();
        this.players = players.slice(0, 2).map(p => ({
            name: p.name,
            number: null,
            hp: this.settings.startHp,
            maxHp: this.settings.maxHp,
            isAlive: true
        }));
        this.phase = "numberSelection";
    }

    selectMultiplier(m) {
        if ([1, 2, 3].includes(Number(m))) {
            this.selectedMultiplier = Number(m);
        }
    }

    confirmPlayerNumber(number) {
        const n = Number(number);
        if (!Number.isInteger(n) || n < 1 || n > 20) {
            return { success: false, message: "Pick a number between 1 and 20." };
        }
        const taken = this.players.some((p, i) => i !== this.numberSelectionIndex && p.number === n);
        if (taken) {
            return { success: false, message: `${n} is already taken. Pick a different number.` };
        }

        this.players[this.numberSelectionIndex].number = n;
        this.numberSelectionIndex++;

        if (this.numberSelectionIndex >= this.players.length) {
            this.phase = "playing";
        }

        return { success: true };
    }

    throwNumber(number, multiplier) {
        if (this.phase !== "playing") return;

        this.saveState();

        const m = Number(multiplier) || 1;
        const n = Number(number);
        const prefix = m === 2 ? "D" : m === 3 ? "T" : "S";
        const label = `${prefix}${n}`;

        const attackerIndex = this.currentPlayerIndex;
        const defenderIndex = 1 - this.currentPlayerIndex;
        const attacker = this.players[attackerIndex];
        const defender = this.players[defenderIndex];

        let effect = "none";
        let effectValue = 0;

        if (n === defender.number) {
            effectValue = m;
            defender.hp = defender.hp - m;
            effect = "damage";
        } else if (this.activeHealTarget !== null && n === this.activeHealTarget) {
            effectValue = m;
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + m);
            effect = "heal";
        }

        this.turnThrows.push({ label, effect, value: effectValue });
        this.dartsThisTurn++;

        if (this.dartsThisTurn >= this.settings.dartsPerTurn) {
            this._endTurn();
        }
    }

    throwOuterBull() {
        if (this.phase !== "playing") return;

        this.saveState();

        const player = this.players[this.currentPlayerIndex];
        player.hp = Math.min(player.maxHp, player.hp + 1);

        this.turnThrows.push({ label: "25", effect: "heal", value: 1 });
        this.dartsThisTurn++;

        if (this.dartsThisTurn >= this.settings.dartsPerTurn) {
            this._endTurn();
        }
    }

    throwBull() {
        if (this.phase !== "playing") return;

        this.saveState();

        const player = this.players[this.currentPlayerIndex];
        player.hp = Math.min(player.maxHp, player.hp + 2);

        this.turnThrows.push({ label: "Bull", effect: "heal", value: 2 });
        this.dartsThisTurn++;

        if (this.dartsThisTurn >= this.settings.dartsPerTurn) {
            this._endTurn();
        }
    }

    miss() {
        if (this.phase !== "playing") return;

        this.saveState();

        this.turnThrows.push({ label: "Miss", effect: "none", value: 0 });
        this.dartsThisTurn++;

        if (this.dartsThisTurn >= this.settings.dartsPerTurn) {
            this._endTurn();
        }
    }

    endTurnEarly() {
        if (this.phase !== "playing") return;
        this.saveState();
        this._endTurn();
    }

    _endTurn() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.hp <= 0) {
            currentPlayer.isAlive = false;
            const opponentIndex = 1 - this.currentPlayerIndex;
            this.winnerPlayerIndex = opponentIndex;
            this.phase = "finished";
            this.setLastResult(
                "success",
                `${this.players[opponentIndex].name} wins! ${currentPlayer.name} could not recover.`
            );
            return;
        }

        if (this.activeHealTarget !== null) {
            this.healRoundTurnsRemaining--;
            if (this.healRoundTurnsRemaining <= 0) {
                this.activeHealTarget = null;
                this.healRoundTurnsRemaining = 0;
            }
        }

        const nextPlayerIndex = 1 - this.currentPlayerIndex;

        // Full round completes when we wrap back to player 0
        if (nextPlayerIndex === 0) {
            this.currentRound++;

            if (this.activeHealTarget === null) {
                this.roundsUntilNextHeal--;
                if (this.roundsUntilNextHeal <= 0) {
                    const target = this._pickHealTarget();
                    if (target !== null) {
                        this.activeHealTarget = target;
                        this.healRoundTurnsRemaining = 2;
                    }
                    this.roundsUntilNextHeal = this._randomHealInterval();
                }
            }
        }

        this.currentPlayerIndex = nextPlayerIndex;
        this.dartsThisTurn = 0;
        this.selectedMultiplier = 1;
        this.turnThrows = [];
    }

    _randomHealInterval() {
        return Math.floor(Math.random() * 4) + 3; // 3–6
    }

    _pickHealTarget() {
        const used = this.players.map(p => p.number).filter(n => n !== null);
        const available = [];
        for (let i = 1; i <= 20; i++) {
            if (!used.includes(i)) available.push(i);
        }
        if (available.length === 0) return null;
        return available[Math.floor(Math.random() * available.length)];
    }

    setLastResult(type, message) {
        this.lastResult = { type, message };
        this.lastResultCreatedAt = Date.now();
    }

    clearLastResult() {
        this.lastResult = null;
        this.lastResultCreatedAt = 0;
    }

    saveState() {
        this.history.push({
            players: JSON.parse(JSON.stringify(this.players)),
            phase: this.phase,
            numberSelectionIndex: this.numberSelectionIndex,
            currentPlayerIndex: this.currentPlayerIndex,
            currentRound: this.currentRound,
            dartsThisTurn: this.dartsThisTurn,
            selectedMultiplier: this.selectedMultiplier,
            turnThrows: JSON.parse(JSON.stringify(this.turnThrows)),
            winnerPlayerIndex: this.winnerPlayerIndex,
            activeHealTarget: this.activeHealTarget,
            healRoundTurnsRemaining: this.healRoundTurnsRemaining,
            roundsUntilNextHeal: this.roundsUntilNextHeal,
            lastResult: this.lastResult ? { ...this.lastResult } : null,
            lastResultCreatedAt: this.lastResultCreatedAt
        });
    }

    undo() {
        const previous = this.history.pop();
        if (!previous) return;
        Object.assign(this, previous);
    }
}
