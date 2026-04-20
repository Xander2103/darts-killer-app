export class ChaosEngine {
    constructor(game) {
        this.game = game;
        this.availableModifiers = [];
        this.activeModifier = null;
    }

    register(modifier) {
        this.availableModifiers.push(modifier);
    }

    startNewRound() {
        if (this.availableModifiers.length === 0) {
            this.activeModifier = null;
            return null;
        }

        const randomIndex = Math.floor(Math.random() * this.availableModifiers.length);
        this.activeModifier = this.availableModifiers[randomIndex];
        this.activeModifier.onRoundStart(this.game);

        return this.activeModifier;
    }

    handleThrow(context) {
        if (!this.activeModifier) {
            return context;
        }

        return this.activeModifier.onThrow(context);
    }

    endRound() {
        if (this.activeModifier) {
            this.activeModifier.onRoundEnd(this.game);
        }

        this.activeModifier = null;
    }

    getActiveModifier() {
        return this.activeModifier;
    }
}