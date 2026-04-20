import { ChaosModifier } from "../chaos-modifier.js";

export class OneShot extends ChaosModifier {
    constructor() {
        super("One Shot", "Each player gets only one dart this turn.");
    }

    onRoundStart(game) {
        game.maxThrows = 1;
    }

    onRoundEnd(game) {
        game.maxThrows = 3;
    }
}