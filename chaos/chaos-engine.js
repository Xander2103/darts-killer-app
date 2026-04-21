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

    getModifierKey(modifier) {
        const modifierKeyMap = {
            DoubleTrouble: "doubleTrouble",
            TripleTrouble: "tripleTrouble",
            BonusDarts: "bonusDarts",
            ImmunityOff: "immunityOff",
            TargetLock: "targetLock",
            NoMiss: "noMiss",
            LastDartPressure: "lastDartPressure",
            DoubleDamage: "doubleDamage",
            OneShot: "oneShot",
            SafeZone: "safeZone",
            HotStreak: "hotStreak",
            VampireMode: "vampireMode"
        };

        return modifierKeyMap[modifier.constructor.name] || null;
    }

    isModifierEnabled(modifier) {
        const settings = this.game.settings;

        if (!settings || !settings.chaosModifiers) {
            return true;
        }

        const modifierKey = this.getModifierKey(modifier);

        if (!modifierKey) {
            return true;
        }

        return settings.chaosModifiers[modifierKey] === true;
    }

    getEnabledAvailableModifiers() {
        return this.availableModifiers.filter(modifier => {
            return this.isModifierEnabled(modifier) && modifier.isAvailable(this.game);
        });
    }

    pickRandomModifier() {
        const availableNow = this.getEnabledAvailableModifiers();

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
        return selectableModifiers[randomIndex];
    }

    // Nieuwe chaos-ronde starten
    startNewRound() {
        const selectedModifier = this.pickRandomModifier();

        if (!selectedModifier) {
            this.activeModifier = null;
            return null;
        }

        this.activeModifier = selectedModifier;
        this.activeModifier.onRoundStart(this.game);

        this.recentModifierNames.push(this.activeModifier.name);

        if (this.recentModifierNames.length > this.modifierCooldownRounds) {
            this.recentModifierNames.shift();
        }

        return this.activeModifier;
    }

    // Voor later: als je modifier scope op "turn" staat
    startNewTurn() {
        const selectedModifier = this.pickRandomModifier();

        if (!selectedModifier) {
            this.activeModifier = null;
            return null;
        }

        this.activeModifier = selectedModifier;
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

    endTurn() {
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