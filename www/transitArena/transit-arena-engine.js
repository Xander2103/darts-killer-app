// www/transitArena/transit-arena-engine.js

import {
    getRandomPowerUp,
    getRandomPowerUpSegment,
    matchesPowerUpSegment,
    getPowerUpById
} from "./transit-arena-powerups.js";

const START_HP = 10;
const START_MAX_HP = 15;
const ABSOLUTE_MAX_HP = 20;
const MAX_SHIELD = 5;
const BASE_DARTS = 3;
const SPEED_COLA_DARTS = 4;

export class TransitArenaEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.selectedTargetIndex = null;
        this.selectedMultiplier = 1;
        this.currentRound = 1;
        this.dartsThisTurn = 0;
        this.maxDartsThisTurn = BASE_DARTS;
        this.turnThrows = [];
        this.activePowerUp = null;
        this.powerUpSegment = null;
        this.pendingPowerUpClaim = false;
        this.pendingPowerUpPlayerIndex = null;
        this.pendingPowerUp = null;
        this.powerUpTurnsRemaining = 0;
        this.roundsUntilNextPowerUp = this._randomPowerUpInterval();
        this.history = [];
        this.status = "setup";
        this.winner = null;
        this.lastResult = null;
        this.playersWhoTookTurnThisRound = [];
    }

    start(playersInput) {
        this.reset();
        this.players = playersInput.map(p => ({
            name: typeof p === "string" ? p : p.name,
            hp: START_HP,
            maxHp: START_MAX_HP,
            shield: 0,
            isAlive: true,
            quickRevive: false,
            doubleTap: false,
            speedCola: false,
            deadshot: false,
            widowWine: false,
            instaKill: false
        }));
        this.status = "playing";
        const opponents = this.getAliveOpponentIndexes();
        this.selectedTargetIndex = opponents.length > 0 ? opponents[0] : null;
    }

    // ─── Player / target helpers ─────────────────────────────────────────────

    getAlivePlayers() {
        return this.players.filter(p => p.isAlive);
    }

    getAliveOpponentIndexes() {
        return this.players
            .map((p, i) => ({ p, i }))
            .filter(({ p, i }) => p.isAlive && i !== this.currentPlayerIndex)
            .map(({ i }) => i);
    }

    selectTarget(index) {
        const idx = Number(index);
        if (idx === this.currentPlayerIndex) return;
        const target = this.players[idx];
        if (!target || !target.isAlive) return;
        this.selectedTargetIndex = idx;
    }

    selectMultiplier(m) {
        if ([1, 2, 3].includes(Number(m))) {
            this.selectedMultiplier = Number(m);
        }
    }

    _ensureValidTarget() {
        const opponents = this.getAliveOpponentIndexes();
        if (opponents.length === 0) return;
        const current = this.players[this.selectedTargetIndex];
        if (
            this.selectedTargetIndex !== null &&
            this.selectedTargetIndex !== this.currentPlayerIndex &&
            current && current.isAlive
        ) {
            return;
        }
        this.selectedTargetIndex = opponents[0];
    }

    _findNextAlivePlayer(fromIndex) {
        const count = this.players.length;
        for (let i = 1; i < count; i++) {
            const idx = (fromIndex + i) % count;
            if (this.players[idx].isAlive) return idx;
        }
        return fromIndex;
    }

    // ─── Damage ──────────────────────────────────────────────────────────────

    applyDamage(targetPlayer, amount, _sourcePlayer, _context = {}) {
        if (!targetPlayer) {
            return { blockedByWidowWine: false, shieldDamage: 0, hpDamage: 0, revived: false, eliminated: false, remainingHp: 0, remainingShield: 0 };
        }

        const result = {
            blockedByWidowWine: false,
            shieldDamage: 0,
            hpDamage: 0,
            revived: false,
            eliminated: false,
            remainingHp: targetPlayer.hp,
            remainingShield: targetPlayer.shield
        };

        if (amount <= 0) return result;

        if (targetPlayer.widowWine) {
            targetPlayer.widowWine = false;
            result.blockedByWidowWine = true;
            return result;
        }

        const shieldAbsorb = Math.min(targetPlayer.shield, amount);
        targetPlayer.shield = Math.max(0, targetPlayer.shield - shieldAbsorb);
        const hpDamage = amount - shieldAbsorb;
        targetPlayer.hp = Math.max(0, targetPlayer.hp - hpDamage);

        result.shieldDamage = shieldAbsorb;
        result.hpDamage = hpDamage;
        result.remainingHp = targetPlayer.hp;
        result.remainingShield = targetPlayer.shield;

        if (targetPlayer.hp <= 0) {
            if (targetPlayer.quickRevive) {
                targetPlayer.hp = 3;
                targetPlayer.quickRevive = false;
                result.revived = true;
                result.remainingHp = 3;
            } else {
                targetPlayer.isAlive = false;
                result.eliminated = true;
            }
        }

        return result;
    }

    // ─── Throw actions ───────────────────────────────────────────────────────

    throwSegment(segment) {
        if (this.status !== "playing") return { type: "idle" };

        const prefixMap = { S: 1, D: 2, T: 3 };
        const prefix = segment[0];
        const segmentMultiplier = prefixMap[prefix] || 1;

        const result = {
            type: "throw",
            segment,
            powerUpSpawned: false,
            powerUpUnlocked: false,
            powerUpExpired: false,
            claimed: false,
            matchFinished: false,
            message: ""
        };

        this._ensureValidTarget();
        const currentPlayer = this.players[this.currentPlayerIndex];
        const target = this.players[this.selectedTargetIndex];

        if (!target) {
            result.message = "No valid target selected.";
            this.lastResult = { type: "miss", message: result.message };
            return result;
        }

        this.saveState();

        // Calculate damage with attacker power-ups
        let damage = segmentMultiplier;
        const willUseDoubleTap = currentPlayer.doubleTap && damage > 0;
        const willUseDeadshot = currentPlayer.deadshot && damage > 0;
        const willUseInstaKill = currentPlayer.instaKill && damage > 0;

        if (willUseDoubleTap) damage *= 2;
        if (willUseDeadshot) damage += 2;
        if (willUseInstaKill) damage += 5;

        const dmg = this.applyDamage(target, damage, currentPlayer);

        // Consume attacker power-ups only if the attack was not blocked
        if (!dmg.blockedByWidowWine) {
            if (willUseDoubleTap) currentPlayer.doubleTap = false;
            if (willUseDeadshot) currentPlayer.deadshot = false;
            if (willUseInstaKill) currentPlayer.instaKill = false;
        }

        const effect = dmg.blockedByWidowWine
            ? "blocked"
            : (dmg.shieldDamage > 0 || dmg.hpDamage > 0) ? "damage" : "none";

        this.turnThrows.push({ label: segment, effect, value: damage });

        // Build message
        if (dmg.blockedByWidowWine) {
            result.message = `${target.name}'s Widow's Wine blocked the attack!`;
        } else if (dmg.eliminated) {
            result.message = `${segment} — ${target.name} eliminated!`;
        } else if (dmg.revived) {
            result.message = `${segment} — ${target.name} revived by Quick Revive (3 HP)!`;
        } else if (dmg.shieldDamage > 0 || dmg.hpDamage > 0) {
            const parts = [];
            if (dmg.shieldDamage > 0) parts.push(`${dmg.shieldDamage} shield`);
            if (dmg.hpDamage > 0) parts.push(`${dmg.hpDamage} HP`);
            result.message = `${segment} — ${parts.join(" + ")} damage to ${target.name}.`;
        } else {
            result.message = `${segment} — no damage.`;
        }

        this.lastResult = { type: "hit", message: result.message };

        // Check if segment unlocks the active power-up
        if (
            this.activePowerUp !== null &&
            !this.pendingPowerUpClaim &&
            matchesPowerUpSegment(segment, this.powerUpSegment)
        ) {
            this.pendingPowerUpClaim = true;
            this.pendingPowerUpPlayerIndex = this.currentPlayerIndex;
            this.pendingPowerUp = this.activePowerUp;
            result.powerUpUnlocked = true;
            const puName = getPowerUpById(this.activePowerUp)?.name || this.activePowerUp;
            result.message += ` ${currentPlayer.name} unlocked ${puName}! Tap the coin to claim.`;
            this.lastResult.message = result.message;
        }

        this.dartsThisTurn++;

        // Check winner before advancing turn
        if (this.checkWinner()) {
            result.matchFinished = true;
            return result;
        }

        if (this.dartsThisTurn >= this.maxDartsThisTurn) {
            const endResult = this._endTurn();
            result.powerUpSpawned = endResult.powerUpSpawned;
            result.powerUpExpired = endResult.powerUpExpired;
        }

        return result;
    }

    throwBull(type) {
        if (this.status !== "playing") return { type: "idle" };

        const damage = type === "bull" ? 5 : 2;
        const label = type === "bull" ? "B50" : "B25";

        const result = {
            type: "throw",
            powerUpSpawned: false,
            powerUpUnlocked: false,
            powerUpExpired: false,
            claimed: false,
            matchFinished: false,
            message: ""
        };

        this._ensureValidTarget();
        const currentPlayer = this.players[this.currentPlayerIndex];
        const target = this.players[this.selectedTargetIndex];

        if (!target) {
            result.message = "No valid target selected.";
            this.lastResult = { type: "miss", message: result.message };
            return result;
        }

        this.saveState();

        let totalDamage = damage;
        const willUseDoubleTap = currentPlayer.doubleTap && totalDamage > 0;
        const willUseDeadshot = currentPlayer.deadshot && totalDamage > 0;
        const willUseInstaKill = currentPlayer.instaKill && totalDamage > 0;

        if (willUseDoubleTap) totalDamage *= 2;
        if (willUseDeadshot) totalDamage += 2;
        if (willUseInstaKill) totalDamage += 5;

        const dmg = this.applyDamage(target, totalDamage, currentPlayer);

        if (!dmg.blockedByWidowWine) {
            if (willUseDoubleTap) currentPlayer.doubleTap = false;
            if (willUseDeadshot) currentPlayer.deadshot = false;
            if (willUseInstaKill) currentPlayer.instaKill = false;
        }

        const effect = dmg.blockedByWidowWine
            ? "blocked"
            : (dmg.shieldDamage > 0 || dmg.hpDamage > 0) ? "damage" : "none";

        this.turnThrows.push({ label, effect, value: totalDamage });

        // Bulls do NOT unlock power-up segments
        if (dmg.blockedByWidowWine) {
            result.message = `${target.name}'s Widow's Wine blocked the ${label}!`;
        } else if (dmg.eliminated) {
            result.message = `${label} — ${target.name} eliminated!`;
        } else if (dmg.revived) {
            result.message = `${label} — ${target.name} revived by Quick Revive (3 HP)!`;
        } else if (dmg.shieldDamage > 0 || dmg.hpDamage > 0) {
            const parts = [];
            if (dmg.shieldDamage > 0) parts.push(`${dmg.shieldDamage} shield`);
            if (dmg.hpDamage > 0) parts.push(`${dmg.hpDamage} HP`);
            result.message = `${label} — ${parts.join(" + ")} damage to ${target.name}.`;
        } else {
            result.message = `${label} — no damage.`;
        }

        this.lastResult = { type: "hit", message: result.message };

        this.dartsThisTurn++;

        if (this.checkWinner()) {
            result.matchFinished = true;
            return result;
        }

        if (this.dartsThisTurn >= this.maxDartsThisTurn) {
            const endResult = this._endTurn();
            result.powerUpSpawned = endResult.powerUpSpawned;
            result.powerUpExpired = endResult.powerUpExpired;
        }

        return result;
    }

    miss() {
        if (this.status !== "playing") return { type: "idle" };

        this.saveState();

        const result = {
            type: "throw",
            powerUpSpawned: false,
            powerUpUnlocked: false,
            powerUpExpired: false,
            claimed: false,
            matchFinished: false,
            message: "Miss — 0 damage."
        };

        this.turnThrows.push({ label: "Miss", effect: "none", value: 0 });
        this.lastResult = { type: "miss", message: "Miss — 0 damage." };

        this.dartsThisTurn++;

        if (this.dartsThisTurn >= this.maxDartsThisTurn) {
            const endResult = this._endTurn();
            result.powerUpSpawned = endResult.powerUpSpawned;
            result.powerUpExpired = endResult.powerUpExpired;
        }

        return result;
    }

    // ─── Power-up claim ──────────────────────────────────────────────────────

    claimPendingPowerUp() {
        const result = {
            claimed: false,
            powerUpName: null,
            playerName: null,
            matchFinished: false,
            message: ""
        };

        if (!this.pendingPowerUpClaim || this.pendingPowerUpPlayerIndex === null) {
            return result;
        }

        this.saveState();

        const claimingPlayer = this.players[this.pendingPowerUpPlayerIndex];
        const powerUpId = this.pendingPowerUp;
        const powerUp = getPowerUpById(powerUpId);

        result.claimed = true;
        result.powerUpName = powerUp?.name || powerUpId;
        result.playerName = claimingPlayer.name;
        result.message = `${claimingPlayer.name} claimed ${result.powerUpName}!`;

        this._applyPowerUpEffect(powerUpId, claimingPlayer);

        // Clear all power-up state
        this.activePowerUp = null;
        this.powerUpSegment = null;
        this.pendingPowerUpClaim = false;
        this.pendingPowerUpPlayerIndex = null;
        this.pendingPowerUp = null;
        this.powerUpTurnsRemaining = 0;

        this.scheduleNextPowerUp();

        this.lastResult = { type: "powerUpClaimed", message: result.message };

        if (this.checkWinner()) {
            result.matchFinished = true;
        }

        return result;
    }

    _applyPowerUpEffect(powerUpId, player) {
        switch (powerUpId) {
            case "quickRevive":
                player.quickRevive = true;
                break;

            case "juggernog":
                player.maxHp = Math.min(player.maxHp + 2, ABSOLUTE_MAX_HP);
                player.hp = Math.min(player.hp + 5, player.maxHp);
                break;

            case "doubleTap":
                player.doubleTap = true;
                break;

            case "speedCola":
                player.speedCola = true;
                break;

            case "deadshot":
                player.deadshot = true;
                break;

            case "shield":
                player.shield = Math.min(player.shield + 3, MAX_SHIELD);
                break;

            case "carpenter":
                player.shield = MAX_SHIELD;
                break;

            case "widowWine":
                player.widowWine = true;
                break;

            case "instaKill":
                player.instaKill = true;
                break;

            case "nuke": {
                const claimerIndex = this.players.indexOf(player);
                this.players.forEach((p, idx) => {
                    if (idx !== claimerIndex && p.isAlive) {
                        this.applyDamage(p, 2, player);
                    }
                });
                break;
            }
        }
    }

    // ─── Power-up lifecycle ──────────────────────────────────────────────────

    spawnPowerUp() {
        const pu = getRandomPowerUp();
        const seg = getRandomPowerUpSegment();
        this.activePowerUp = pu.id;
        this.powerUpSegment = seg;
        this.powerUpTurnsRemaining = 1;
        this.pendingPowerUpClaim = false;
        this.pendingPowerUpPlayerIndex = null;
        this.pendingPowerUp = null;
    }

    expirePowerUp() {
        this.activePowerUp = null;
        this.powerUpSegment = null;
        this.powerUpTurnsRemaining = 0;
        this.pendingPowerUpClaim = false;
        this.pendingPowerUpPlayerIndex = null;
        this.pendingPowerUp = null;
        this.scheduleNextPowerUp();
    }

    scheduleNextPowerUp() {
        this.roundsUntilNextPowerUp = this._randomPowerUpInterval();
    }

    coinInfo() {
        // Display-only hint; no saveState
        const seg = this.powerUpSegment || "—";
        this.lastResult = {
            type: "hint",
            message: this.activePowerUp
                ? `Hit ${seg} first to unlock this power-up.`
                : "No active power-up."
        };
    }

    // ─── Winner check ────────────────────────────────────────────────────────

    checkWinner() {
        const alive = this.getAlivePlayers();
        if (alive.length <= 1) {
            this.status = "finished";
            this.winner = alive.length === 1 ? alive[0].name : null;
            return true;
        }
        return false;
    }

    // ─── Turn / round advancement ────────────────────────────────────────────

    _endTurn() {
        const result = { powerUpSpawned: false, powerUpExpired: false };

        // Record that the current player completed a turn this round
        if (!this.playersWhoTookTurnThisRound.includes(this.currentPlayerIndex)) {
            this.playersWhoTookTurnThisRound.push(this.currentPlayerIndex);
        }

        // Check full round: every currently-alive player has had a turn
        const alivePlayers = this.getAlivePlayers();
        const allHadTurn = alivePlayers.every(p => {
            const idx = this.players.indexOf(p);
            return this.playersWhoTookTurnThisRound.includes(idx);
        });

        if (allHadTurn) {
            this.currentRound++;
            this.playersWhoTookTurnThisRound = [];

            let justExpired = false;

            // Decrement power-up timer only when active and not pending claim
            if (this.activePowerUp !== null && !this.pendingPowerUpClaim) {
                this.powerUpTurnsRemaining--;
                if (this.powerUpTurnsRemaining <= 0) {
                    this.expirePowerUp();
                    result.powerUpExpired = true;
                    justExpired = true;
                }
            }

            // Spawn check — skip if we just scheduled via expiry
            if (this.activePowerUp === null && !justExpired) {
                this.roundsUntilNextPowerUp--;
                if (this.roundsUntilNextPowerUp <= 0) {
                    this.spawnPowerUp();
                    result.powerUpSpawned = true;
                }
            }
        }

        // Advance to next alive player
        const nextIndex = this._findNextAlivePlayer(this.currentPlayerIndex);
        this.currentPlayerIndex = nextIndex;
        this.dartsThisTurn = 0;
        this.turnThrows = [];

        // Apply Speed Cola for the incoming player's turn
        const nextPlayer = this.players[this.currentPlayerIndex];
        if (nextPlayer && nextPlayer.speedCola) {
            this.maxDartsThisTurn = SPEED_COLA_DARTS;
            nextPlayer.speedCola = false;
        } else {
            this.maxDartsThisTurn = BASE_DARTS;
        }

        // Ensure the next player has a valid target
        this._ensureValidTarget();

        return result;
    }

    // ─── History / undo ──────────────────────────────────────────────────────

    saveState() {
        this.history.push({
            players: JSON.parse(JSON.stringify(this.players)),
            currentPlayerIndex: this.currentPlayerIndex,
            selectedTargetIndex: this.selectedTargetIndex,
            selectedMultiplier: this.selectedMultiplier,
            currentRound: this.currentRound,
            dartsThisTurn: this.dartsThisTurn,
            maxDartsThisTurn: this.maxDartsThisTurn,
            turnThrows: JSON.parse(JSON.stringify(this.turnThrows)),
            activePowerUp: this.activePowerUp,
            powerUpSegment: this.powerUpSegment,
            pendingPowerUpClaim: this.pendingPowerUpClaim,
            pendingPowerUpPlayerIndex: this.pendingPowerUpPlayerIndex,
            pendingPowerUp: this.pendingPowerUp,
            powerUpTurnsRemaining: this.powerUpTurnsRemaining,
            roundsUntilNextPowerUp: this.roundsUntilNextPowerUp,
            status: this.status,
            winner: this.winner,
            lastResult: this.lastResult ? { ...this.lastResult } : null,
            playersWhoTookTurnThisRound: [...this.playersWhoTookTurnThisRound]
        });
    }

    undo() {
        const previous = this.history.pop();
        if (!previous) return;
        Object.assign(this, previous);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    _randomPowerUpInterval() {
        return Math.floor(Math.random() * 4) + 3; // 3–6
    }
}
