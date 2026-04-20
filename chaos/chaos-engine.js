export class ChaosEngine {
    constructor(game) {
        this.game = game;
        this.availableModifiers = [];
        this.activeModifier = null;
    }

    register(modifier) {
        this.availableModifiers.push(modifier);
    }

    // Nieuwe chaos-ronde starten
    startNewRound() {
        const availableNow = this.availableModifiers.filter(modifier => {
            return modifier.isAvailable(this.game);
        });

        if (availableNow.length === 0) {
            this.activeModifier = null;
            return null;
        }

        const randomIndex = Math.floor(Math.random() * availableNow.length);
        this.activeModifier = availableNow[randomIndex];

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

    handleMiss(player) {
        if (!this.activeModifier) {
            return;
        }

        if (this.activeModifier.onMiss) {
            this.activeModifier.onMiss(this.game, player);
        }
    }
}