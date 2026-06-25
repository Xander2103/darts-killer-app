// www/transitArena/transit-arena-engine.js

import {
    getRandomEligiblePowerUp,
    getRandomPowerUpSegment,
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
        this.numberSelectionIndex = 0;
        this.selectedTargetIndex = null;
        this.selectedMultiplier = 1;
        this.currentRound = 1;
        this.dartsThisTurn = 0;
        this.maxDartsThisTurn = BASE_DARTS;
        this.turnThrows = [];
        // Power-ups: array of { uid, id, segment, turnsRemaining }
        this.activePowerUps = [];
        this.turnsUntilNextPowerUp = this._randomPowerUpTurnInterval();
        this.currentTurnHadAction = false;
        this._nextPowerUpUid = 0;
        // Special events
        this.activeSpecialEvent = null;     // null | "healers_round"
        this.healerTurnsRemaining = 0;
        this.roundsUntilNextHealerEvent = this._randomHealerInterval();
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
            targetNumber: null,
            quickRevive: false,
            doubleTap: false,
            speedCola: false,
            deadshot: false,
            widowWine: false,
            instaKill: false
        }));
        this.numberSelectionIndex = 0;
        this.status = "numberSelection";
    }

    // ─── Number selection phase ──────────────────────────────────────────────

    confirmPlayerNumber(number) {
        const n = Number(number);
        if (!Number.isInteger(n) || n < 1 || n > 20) {
            return { success: false, message: "Enter a number between 1 and 20." };
        }
        const taken = this.players.some(
            (p, i) => i !== this.numberSelectionIndex && p.targetNumber === n
        );
        if (taken) {
            return { success: false, message: "That number is already taken. Choose another." };
        }

        this.saveState();
        this.players[this.numberSelectionIndex].targetNumber = n;
        this.numberSelectionIndex++;

        if (this.numberSelectionIndex >= this.players.length) {
            this.status = "playing";
            const opponents = this.getAliveOpponentIndexes();
            this.selectedTargetIndex = opponents.length > 0 ? opponents[0] : null;
        }

        return { success: true };
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

        const segmentNumber = parseInt(segment.slice(1), 10);
        const isAttack = segmentNumber === target.targetNumber;
        let damage = isAttack ? segmentMultiplier : 0;
        const willUseDoubleTap = currentPlayer.doubleTap && damage > 0;
        const willUseDeadshot = currentPlayer.deadshot && damage > 0;
        const willUseInstaKill = currentPlayer.instaKill && damage > 0;

        if (willUseDoubleTap) damage *= 2;
        if (willUseDeadshot) damage += 2;
        if (willUseInstaKill) damage += 5;

        const dmg = this.applyDamage(target, damage, currentPlayer);

        if (!dmg.blockedByWidowWine) {
            if (willUseDoubleTap) currentPlayer.doubleTap = false;
            if (willUseDeadshot) currentPlayer.deadshot = false;
            if (willUseInstaKill) currentPlayer.instaKill = false;
        }

        const effect = dmg.blockedByWidowWine
            ? "blocked"
            : (dmg.shieldDamage > 0 || dmg.hpDamage > 0) ? "damage" : "none";

        this.turnThrows.push({ label: segment, effect, value: damage });

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

        this.currentTurnHadAction = true;
        this.dartsThisTurn++;

        if (this.checkWinner()) {
            result.matchFinished = true;
            return result;
        }

        if (this.dartsThisTurn >= this.maxDartsThisTurn) {
            const endResult = this._endTurn();
            result.powerUpSpawned = result.powerUpSpawned || endResult.powerUpSpawned;
            result.powerUpExpired = endResult.powerUpExpired;
            if (endResult.spawnedPowerUpId) result.spawnedPowerUpId = endResult.spawnedPowerUpId;
        }

        return result;
    }

    throwSegmentAtTarget(segment, targetIndex) {
        if (this.status !== "playing") return { type: "idle" };
        const idx = Number(targetIndex);
        const target = this.players[idx];
        if (!target || !target.isAlive || idx === this.currentPlayerIndex) {
            return { type: "idle", message: "Invalid target." };
        }
        this.selectedTargetIndex = idx;
        return this.throwSegment(segment);
    }

    throwBull(type) {
        if (this.status !== "playing") return { type: "idle" };

        // B50: +3 shield, B25: +1 shield
        const shieldGain = type === "bull" ? 3 : 1;
        const label = type === "bull" ? "B50" : "B25";

        const result = {
            type: "throw",
            powerUpSpawned: false,
            powerUpExpired: false,
            claimed: false,
            matchFinished: false,
            message: ""
        };

        this.saveState();

        const currentPlayer = this.players[this.currentPlayerIndex];
        const oldShield = currentPlayer.shield;
        currentPlayer.shield = Math.min(currentPlayer.shield + shieldGain, MAX_SHIELD);
        const gained = currentPlayer.shield - oldShield;

        this.turnThrows.push({ label, effect: "shield", value: gained });

        result.message = gained > 0
            ? `${label} — ${currentPlayer.name} gained ${gained} shield (${currentPlayer.shield}/${MAX_SHIELD}).`
            : `${label} — shield already full.`;

        this.lastResult = { type: "shield", message: result.message };

        this.currentTurnHadAction = true;
        this.dartsThisTurn++;

        if (this.checkWinner()) {
            result.matchFinished = true;
            return result;
        }

        if (this.dartsThisTurn >= this.maxDartsThisTurn) {
            const endResult = this._endTurn();
            result.powerUpSpawned = result.powerUpSpawned || endResult.powerUpSpawned;
            result.powerUpExpired = endResult.powerUpExpired;
            if (endResult.spawnedPowerUpId) result.spawnedPowerUpId = endResult.spawnedPowerUpId;
        }

        return result;
    }

    throwHealSelf(prefix) {
        if (this.status !== "playing") return { type: "idle" };
        if (this.activeSpecialEvent !== "healers_round") return { type: "idle" };

        const prefixMap = { S: 1, D: 2, T: 3 };
        const multiplier = prefixMap[prefix] || 1;
        const currentPlayer = this.players[this.currentPlayerIndex];
        const healSeg = `${prefix}${currentPlayer.targetNumber}`;

        const result = {
            type: "throw",
            powerUpSpawned: false,
            powerUpExpired: false,
            claimed: false,
            matchFinished: false,
            message: ""
        };

        this.saveState();

        const oldHp = currentPlayer.hp;
        currentPlayer.hp = Math.min(currentPlayer.hp + multiplier, currentPlayer.maxHp);
        const gained = currentPlayer.hp - oldHp;

        this.turnThrows.push({ label: healSeg, effect: "heal", value: gained });

        result.message = gained > 0
            ? `${healSeg} — ${currentPlayer.name} healed +${gained} HP (${currentPlayer.hp}/${currentPlayer.maxHp}).`
            : `${healSeg} — ${currentPlayer.name} is already at full HP.`;

        this.lastResult = { type: "heal", message: result.message };

        this.currentTurnHadAction = true;
        this.dartsThisTurn++;

        if (this.dartsThisTurn >= this.maxDartsThisTurn) {
            const endResult = this._endTurn();
            result.powerUpSpawned = result.powerUpSpawned || endResult.powerUpSpawned;
            result.powerUpExpired = endResult.powerUpExpired;
            if (endResult.spawnedPowerUpId) result.spawnedPowerUpId = endResult.spawnedPowerUpId;
        }

        return result;
    }

    endTurnManually() {
        if (this.status !== "playing") return { type: "idle" };

        this.saveState();

        const currentPlayer = this.players[this.currentPlayerIndex];
        const result = {
            type: "endTurn",
            powerUpSpawned: false,
            powerUpExpired: false,
            claimed: false,
            matchFinished: false,
            message: `${currentPlayer.name} ended their turn.`
        };

        this.lastResult = { type: "endTurn", message: result.message };

        // Counts as a played turn regardless of darts thrown
        this.currentTurnHadAction = true;
        const endResult = this._endTurn();
        result.powerUpSpawned = endResult.powerUpSpawned;
        result.powerUpExpired = endResult.powerUpExpired;
        if (endResult.spawnedPowerUpId) result.spawnedPowerUpId = endResult.spawnedPowerUpId;

        return result;
    }

    miss() {
        if (this.status !== "playing") return { type: "idle" };

        this.saveState();

        const result = {
            type: "throw",
            powerUpSpawned: false,
            powerUpExpired: false,
            claimed: false,
            matchFinished: false,
            message: "Miss — 0 damage."
        };

        this.turnThrows.push({ label: "Miss", effect: "none", value: 0 });
        this.lastResult = { type: "miss", message: "Miss — 0 damage." };

        this.currentTurnHadAction = true;
        this.dartsThisTurn++;

        if (this.dartsThisTurn >= this.maxDartsThisTurn) {
            const endResult = this._endTurn();
            result.powerUpSpawned = result.powerUpSpawned || endResult.powerUpSpawned;
            result.powerUpExpired = endResult.powerUpExpired;
            if (endResult.spawnedPowerUpId) result.spawnedPowerUpId = endResult.spawnedPowerUpId;
        }

        return result;
    }

    // ─── Power-up claim ──────────────────────────────────────────────────────

    claimPowerUp(uid) {
        const idx = this.activePowerUps.findIndex(p => p.uid === uid);
        const result = {
            claimed: false,
            powerUpName: null,
            playerName: null,
            matchFinished: false,
            message: ""
        };
        if (idx === -1) return result;

        this.saveState();

        const puEntry = this.activePowerUps[idx];
        const powerUp = getPowerUpById(puEntry.id);
        const claimingPlayer = this.players[this.currentPlayerIndex];

        result.claimed = true;
        result.powerUpName = powerUp?.name || puEntry.id;
        result.playerName = claimingPlayer.name;
        result.message = `${claimingPlayer.name} claimed ${result.powerUpName}!`;

        this._applyPowerUpEffect(puEntry.id, claimingPlayer);
        this.activePowerUps.splice(idx, 1);

        this.lastResult = { type: "powerUpClaimed", message: result.message };

        if (this.checkWinner()) result.matchFinished = true;

        return result;
    }

    // Backwards-compat: claims first active power-up
    claimPowerUpDirectly() {
        if (this.activePowerUps.length === 0) {
            return { claimed: false, powerUpName: null, playerName: null, matchFinished: false, message: "" };
        }
        return this.claimPowerUp(this.activePowerUps[0].uid);
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
            case "maxAmmo":
                // Reset darts used this turn — remaining darts become maxDartsThisTurn
                this.dartsThisTurn = 0;
                break;
        }
    }

    // ─── Power-up lifecycle ──────────────────────────────────────────────────

    _spawnPowerUpNow() {
        const pu = getRandomEligiblePowerUp(this.getAlivePlayers());
        if (!pu) return null;
        const seg = getRandomPowerUpSegment();
        const turnsRemaining = this.getAlivePlayers().length * 2;
        this.activePowerUps.push({
            uid: this._nextPowerUpUid++,
            id: pu.id,
            segment: seg,
            turnsRemaining
        });
        this.lastResult = {
            type: "powerUpSpawned",
            message: `Power-up appeared: ${pu.name}! Hit ${seg} to claim.`
        };
        return pu.id; // caller uses this to select the correct spawn sound
    }

    // Legacy public method
    spawnPowerUp() {
        this._spawnPowerUpNow();
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
        const result = { powerUpSpawned: false, powerUpExpired: false, healersRoundEnded: false, spawnedPowerUpId: null };

        // Record current player's completed turn
        if (!this.playersWhoTookTurnThisRound.includes(this.currentPlayerIndex)) {
            this.playersWhoTookTurnThisRound.push(this.currentPlayerIndex);
        }

        // Decrement power-up turn counters per turn (not per round)
        const expiredNames = [];
        this.activePowerUps = this.activePowerUps.filter(pu => {
            pu.turnsRemaining--;
            if (pu.turnsRemaining <= 0) {
                expiredNames.push(getPowerUpById(pu.id)?.name || pu.id);
                return false;
            }
            return true;
        });
        if (expiredNames.length > 0) {
            result.powerUpExpired = true;
            this.lastResult = { type: "powerUpExpired", message: `${expiredNames.join(", ")} expired.` };
        }

        // Spawn power-up after a counted played turn
        if (this.currentTurnHadAction) {
            this.turnsUntilNextPowerUp--;
            if (this.turnsUntilNextPowerUp <= 0) {
                this.turnsUntilNextPowerUp = this._randomPowerUpTurnInterval();
                if (this.activePowerUps.length < 2) {
                    const spawnedId = this._spawnPowerUpNow();
                    if (spawnedId) {
                        result.powerUpSpawned = true;
                        result.spawnedPowerUpId = spawnedId;
                    }
                }
            }
        }
        this.currentTurnHadAction = false;

        // Decrement healer's round turns per turn
        if (this.activeSpecialEvent === "healers_round") {
            this.healerTurnsRemaining--;
            if (this.healerTurnsRemaining <= 0) {
                this.activeSpecialEvent = null;
                this.healerTurnsRemaining = 0;
                this.roundsUntilNextHealerEvent = this._randomHealerInterval();
                result.healersRoundEnded = true;
                if (!result.powerUpExpired) {
                    this.lastResult = { type: "event", message: "Healer's Round ended." };
                }
            }
        }

        // Check if full round completed
        const alivePlayers = this.getAlivePlayers();
        const allHadTurn = alivePlayers.every(p => {
            const idx = this.players.indexOf(p);
            return this.playersWhoTookTurnThisRound.includes(idx);
        });

        if (allHadTurn) {
            this.currentRound++;
            this.playersWhoTookTurnThisRound = [];

            // Schedule Healer's Round at end of full rounds
            if (this.activeSpecialEvent === null) {
                this.roundsUntilNextHealerEvent--;
                if (this.roundsUntilNextHealerEvent <= 0) {
                    this.activeSpecialEvent = "healers_round";
                    this.healerTurnsRemaining = this.getAlivePlayers().length;
                    if (!result.powerUpExpired && !result.healersRoundEnded) {
                        this.lastResult = {
                            type: "event",
                            message: "Healer's Round begins! Hit your own number to heal."
                        };
                    }
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

        this._ensureValidTarget();

        return result;
    }

    // ─── History / undo ──────────────────────────────────────────────────────

    saveState() {
        this.history.push({
            players: JSON.parse(JSON.stringify(this.players)),
            currentPlayerIndex: this.currentPlayerIndex,
            numberSelectionIndex: this.numberSelectionIndex,
            selectedTargetIndex: this.selectedTargetIndex,
            selectedMultiplier: this.selectedMultiplier,
            currentRound: this.currentRound,
            dartsThisTurn: this.dartsThisTurn,
            maxDartsThisTurn: this.maxDartsThisTurn,
            turnThrows: JSON.parse(JSON.stringify(this.turnThrows)),
            activePowerUps: JSON.parse(JSON.stringify(this.activePowerUps)),
            turnsUntilNextPowerUp: this.turnsUntilNextPowerUp,
            currentTurnHadAction: this.currentTurnHadAction,
            _nextPowerUpUid: this._nextPowerUpUid,
            activeSpecialEvent: this.activeSpecialEvent,
            healerTurnsRemaining: this.healerTurnsRemaining,
            roundsUntilNextHealerEvent: this.roundsUntilNextHealerEvent,
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

    _randomPowerUpTurnInterval() {
        return Math.floor(Math.random() * 13) + 3; // 3–15 played turns
    }

    _randomHealerInterval() {
        return Math.floor(Math.random() * 5) + 6; // 6–10 rounds
    }
}
