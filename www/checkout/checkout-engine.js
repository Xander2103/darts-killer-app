// =====================================================
// 121 Checkout Engine
// =====================================================

import { getCheckoutAdvice } from "./checkout-routes.js";

export class CheckoutEngine {
    constructor() {
        this.defaultSettings = {
            startScore: 121,
            maxDarts: 9,
            roundLimit: 10,
            increaseOnSuccess: 1,
            safehouseEnabled: true,
            safehouseDartLimit: 3,
            doubleOut: true,
            dartsPerPlayerTurn: 3
        };

        this.settings = { ...this.defaultSettings };
        this.reset();
    }

    updateSettings(partialSettings = {}) {
        this.settings = {
            ...this.settings,
            ...partialSettings
        };
    }

    reset() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentTarget = this.settings.startScore;
        this.previousTarget = this.settings.startScore;
        this.remainingScore = this.settings.startScore;
        this.turnStartRemainingScore = this.settings.startScore;
        this.safehouseScore = this.settings.startScore;
        this.dartsUsed = 0;
        this.currentPlayerTurnDarts = 0;
        this.round = 1;
        this.highestCompletedTarget = null;
        this.selectedMultiplier = 1;
        this.throws = [];
        this.history = [];
        this.roundHistory = [];
        this.status = "setup"; // setup | playing | finished
        this.lastResult = null;
        this.lastResultCreatedAt = 0;
        this.resultDismissTimer = null;
        this.activeRouteParts = null;
        this.activeRouteAdvice = null;
    }

    start(players = []) {
        this.reset();
        this.players = players.map(player => ({ name: player.name }));
        this.status = "playing";
    }

    canPlay() {
        return this.status === "playing" && this.players.length > 0;
    }

    selectMultiplier(multiplier) {
        if ([1, 2, 3].includes(multiplier)) {
            this.selectedMultiplier = multiplier;
        }
    }

    throwNumber(number) {
        const numericNumber = Number(number);
        const value = numericNumber * this.selectedMultiplier;
        const label = `${this.getMultiplierLabel()}${numericNumber}`;
        const isValidCheckoutFinish = this.selectedMultiplier === 2;

        this.throwPoints(value, label, isValidCheckoutFinish);
    }

    throwBull(points) {
        const isInnerBull = points === 50;
        const label = isInnerBull ? "Bull 50" : "Outer Bull 25";
        this.throwPoints(points, label, isInnerBull);
    }

    miss() {
        this.throwPoints(0, "Miss", false);
    }

    submitTotalScore(total) {
        if (!this.canPlay()) return;

        const points = Math.max(0, Math.min(180, Math.round(Number(total) || 0)));
        const player = this.players[this.currentPlayerIndex];

        this.saveState();

        this.throws.push({
            playerName: player ? player.name : "Player",
            playerIndex: this.currentPlayerIndex,
            playerDartNumber: 1,
            teamDartNumber: this.dartsUsed + 1,
            points,
            label: String(points),
            isValidCheckoutFinish: true
        });

        this.dartsUsed += this.settings.dartsPerPlayerTurn;
        this.currentPlayerTurnDarts = this.settings.dartsPerPlayerTurn;
        const newRemaining = this.remainingScore - points;
        this.remainingScore = newRemaining;
        this.clearPlannedRoute();

        if (newRemaining === 0) {
            this.completeRound(true);
            return;
        }

        if (newRemaining < 0) {
            this.remainingScore = this.turnStartRemainingScore;
            if (this.dartsUsed >= this.settings.maxDarts) {
                this.completeRound(false, "Bust! Score too high. No darts left.");
                return;
            }
            this.setLastResult("warning", `Bust! Score too high. Remaining stays at ${this.remainingScore}.`);
            this.nextPlayer();
            return;
        }

        if (this.dartsUsed >= this.settings.maxDarts) {
            this.completeRound(false);
            return;
        }

        this.nextPlayer();
    }

    failTarget() {
        if (!this.canPlay()) return;

        this.saveState();
        this.clearPlannedRoute();

        this.roundHistory.unshift({
            round: this.round,
            target: this.currentTarget,
            result: "failed",
            dartsUsed: this.dartsUsed,
            throws: JSON.parse(JSON.stringify(this.throws))
        });

        const fallbackScore = this.settings.safehouseEnabled
            ? this.safehouseScore
            : Math.max(this.settings.startScore, this.currentTarget - 1);

        this.currentTarget = fallbackScore;
        this.setLastResult("failed", `Target failed. Back to ${fallbackScore}.`);

        this.round++;

        const nextPlayerIndex = (this.currentPlayerIndex + 1) % (this.players.length || 1);

        if (this.isFinished()) {
            this.status = "finished";
            this.remainingScore = this.currentTarget;
            this.throws = [];
            this.dartsUsed = 0;
            this.currentPlayerTurnDarts = 0;
            this.currentPlayerIndex = nextPlayerIndex;
            return;
        }

        this.remainingScore = this.currentTarget;
        this.turnStartRemainingScore = this.currentTarget;
        this.dartsUsed = 0;
        this.currentPlayerTurnDarts = 0;
        this.throws = [];
        this.currentPlayerIndex = nextPlayerIndex;
        this.status = "playing";
    }

    throwPoints(points, label, isValidCheckoutFinish = false) {
        if (!this.canPlay()) {
            return;
        }

        this.saveState();

        const player = this.players[this.currentPlayerIndex];
        const newRemainingScore = this.remainingScore - points;

        this.throws.push({
            playerName: player ? player.name : "Player",
            playerIndex: this.currentPlayerIndex,
            playerDartNumber: this.currentPlayerTurnDarts + 1,
            teamDartNumber: this.dartsUsed + 1,
            points,
            label,
            isValidCheckoutFinish
        });

        this.dartsUsed++;
        this.currentPlayerTurnDarts++;
        this.remainingScore = newRemainingScore;
        this.advanceOrClearRoute(label);

        if (newRemainingScore === 0) {
            if (this.settings.doubleOut && !isValidCheckoutFinish) {
                this.handleBustedTurn("No checkout. Finish on a double or Bull 50.");
                return;
            }

            this.completeRound(true);
            return;
        }

        if (newRemainingScore < 0) {
            this.handleBustedTurn("Bust. Score resets to the start of this turn.");
            return;
        }

        if (this.dartsUsed >= this.settings.maxDarts) {
            this.completeRound(false);
            return;
        }

        if (this.currentPlayerTurnDarts >= this.settings.dartsPerPlayerTurn) {
            this.nextPlayer();
        }
    }

    handleBustedTurn(message) {
        this.clearPlannedRoute();
        this.remainingScore = this.turnStartRemainingScore;

        const dartsToSkip = Math.max(
            this.settings.dartsPerPlayerTurn - this.currentPlayerTurnDarts,
            0
        );

        this.dartsUsed = Math.min(this.dartsUsed + dartsToSkip, this.settings.maxDarts);
        this.currentPlayerTurnDarts = this.settings.dartsPerPlayerTurn;

        if (this.dartsUsed >= this.settings.maxDarts) {
            this.completeRound(false, `${message} No darts left.`);
            return;
        }

        this.setLastResult("warning", `${message} Next player continues from ${this.remainingScore}.`);
        this.nextPlayer();
    }

    completeRound(success, customMessage = "") {
        this.clearPlannedRoute();
        const completedTarget = this.currentTarget;
        const completedThrows = [...this.throws];
        const completedDarts = this.dartsUsed;

        this.roundHistory.unshift({
            round: this.round,
            target: completedTarget,
            result: success ? "success" : "failed",
            dartsUsed: completedDarts,
            throws: completedThrows
        });

        if (success) {
            const shouldUpdateSafehouse =
                this.settings.safehouseEnabled &&
                completedDarts <= this.settings.safehouseDartLimit;

            if (shouldUpdateSafehouse) {
                this.safehouseScore = completedTarget;
            }

            this.highestCompletedTarget = Math.max(this.highestCompletedTarget ?? completedTarget, completedTarget);
            this.previousTarget = completedTarget;
            this.currentTarget = completedTarget + this.settings.increaseOnSuccess;
            this.setLastResult(
                "success",
                `Checkout hit in ${completedDarts} dart${completedDarts === 1 ? "" : "s"}. Next target: ${this.currentTarget}.`
            );
        } else {
            const fallbackScore = this.settings.safehouseEnabled
                ? this.safehouseScore
                : Math.max(this.settings.startScore, this.currentTarget - 1);

            this.currentTarget = fallbackScore;
            this.setLastResult(
                "failed",
                customMessage || `Checkout failed. Back to ${fallbackScore}.`
            );
        }

        this.round++;

        const nextPlayerIndex = (this.currentPlayerIndex + 1) % (this.players.length || 1);

        if (this.isFinished()) {
            this.status = "finished";
            this.remainingScore = this.currentTarget;
            this.throws = [];
            this.dartsUsed = 0;
            this.currentPlayerTurnDarts = 0;
            this.currentPlayerIndex = nextPlayerIndex;
            return;
        }

        this.remainingScore = this.currentTarget;
        this.turnStartRemainingScore = this.currentTarget;
        this.dartsUsed = 0;
        this.currentPlayerTurnDarts = 0;
        this.throws = [];
        this.currentPlayerIndex = nextPlayerIndex;
        this.status = "playing";
    }

    setLastResult(type, message) {
        this.lastResult = { type, message };
        this.lastResultCreatedAt = Date.now();
    }

    clearLastResult() {
        this.lastResult = null;
        this.lastResultCreatedAt = 0;
    }

    isFinished() {
        if (this.settings.roundLimit === "infinite") {
            return false;
        }

        return this.round > this.settings.roundLimit;
    }

    nextPlayer() {
        if (this.players.length === 0) {
            return;
        }

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.currentPlayerTurnDarts = 0;
        this.turnStartRemainingScore = this.remainingScore;
    }

    saveState() {
        this.history.push({
            players: JSON.parse(JSON.stringify(this.players)),
            currentPlayerIndex: this.currentPlayerIndex,
            currentTarget: this.currentTarget,
            previousTarget: this.previousTarget,
            remainingScore: this.remainingScore,
            turnStartRemainingScore: this.turnStartRemainingScore,
            safehouseScore: this.safehouseScore,
            dartsUsed: this.dartsUsed,
            currentPlayerTurnDarts: this.currentPlayerTurnDarts,
            round: this.round,
            highestCompletedTarget: this.highestCompletedTarget,
            selectedMultiplier: this.selectedMultiplier,
            throws: JSON.parse(JSON.stringify(this.throws)),
            roundHistory: JSON.parse(JSON.stringify(this.roundHistory)),
            status: this.status,
            lastResult: this.lastResult ? { ...this.lastResult } : null,
            lastResultCreatedAt: this.lastResultCreatedAt,
            activeRouteParts: this.activeRouteParts ? [...this.activeRouteParts] : null,
            activeRouteAdvice: this.activeRouteAdvice ? { ...this.activeRouteAdvice } : null
        });
    }

    undo() {
        const previous = this.history.pop();

        if (!previous) {
            return;
        }

        Object.assign(this, previous);
    }

    getMultiplierLabel() {
        if (this.selectedMultiplier === 2) {
            return "D";
        }

        if (this.selectedMultiplier === 3) {
            return "T";
        }

        return "S";
    }

    clearPlannedRoute() {
        this.activeRouteParts = null;
        this.activeRouteAdvice = null;
    }

    normalizeThrowLabel(label) {
        if (label === "Miss") return null;
        if (label === "Bull 50") return "Bull";
        if (label === "Outer Bull 25") return "25";
        if (label.startsWith("S")) return label.slice(1);
        return label;
    }

    advanceOrClearRoute(label) {
        if (!this.activeRouteParts || this.activeRouteParts.length === 0) {
            return;
        }
        const normalized = this.normalizeThrowLabel(label);
        if (normalized !== null && normalized === this.activeRouteParts[0]) {
            this.activeRouteParts = this.activeRouteParts.slice(1);
            if (this.activeRouteParts.length === 0) {
                this.clearPlannedRoute();
            }
        } else {
            this.clearPlannedRoute();
        }
    }

    getCurrentAdvice(dartsLeft) {
        if (!this.activeRouteParts || this.activeRouteParts.length === 0) {
            const advice = getCheckoutAdvice(this.remainingScore, dartsLeft);
            if (advice.type === "checkout") {
                this.activeRouteParts = advice.route.split(" + ");
                this.activeRouteAdvice = advice;
            }
            return advice;
        }
        return {
            type: this.activeRouteAdvice.type,
            title: this.activeRouteAdvice.title,
            route: this.activeRouteParts.join(" + "),
            helper: this.activeRouteParts.length > 1 ? this.activeRouteAdvice.helper : ""
        };
    }
}
