export class ChaosModifier {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }

    onRoundStart(game) {}

    onThrow(context) {
        return context;
    }

    onRoundEnd(game) {}
}