import { ChaosModifier } from "../chaos-modifier.js";

export class BonusDarts extends ChaosModifier {
    constructor() {
        super("Bonus Darts", "Everyone gets 4 throws this round.");
    }

    onRoundStart(game) {
        game.maxThrows = 4;
    }

    onRoundEnd(game) {
        game.maxThrows = 3;
    }
}