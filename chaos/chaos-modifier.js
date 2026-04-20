// Basisclass voor elke chaos modifier
export class ChaosModifier {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }

    // Bepaalt of deze modifier momenteel gekozen mag worden
    isAvailable(game) {
        return true;
    }

    // Wordt uitgevoerd wanneer een nieuwe chaos-ronde start
    onRoundStart(game) { }

    // Wordt uitgevoerd bij elke throw
    onThrow(context) {
        return context;
    }

    onMiss(game, player) { }

    // Wordt uitgevoerd op het einde van de chaos-ronde
    onRoundEnd(game) { }
}