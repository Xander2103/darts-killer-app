export class ChaosEngine {
    constructor(game) {
        this.game = game;
        this.availableModifiers = [];
        this.activeModifier = null;
        this.recentModifierNames = [];
        this.modifierCooldownRounds = 5;
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

        let selectableModifiers = availableNow.filter(modifier => {
            return !this.recentModifierNames.includes(modifier.name);
        });

        // fallback: als door cooldown alles uitgesloten wordt, pak gewoon weer de beschikbare lijst
        if (selectableModifiers.length === 0) {
            selectableModifiers = availableNow;
        }

        const randomIndex = Math.floor(Math.random() * selectableModifiers.length);
        this.activeModifier = selectableModifiers[randomIndex];

        this.activeModifier.onRoundStart(this.game);

        this.recentModifierNames.push(this.activeModifier.name);

        if (this.recentModifierNames.length > this.modifierCooldownRounds) {
            this.recentModifierNames.shift();
        }

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