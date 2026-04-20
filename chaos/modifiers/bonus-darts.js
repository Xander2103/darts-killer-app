import { ChaosModifier } from "../chaos-modifier.js";

export class BonusDarts extends ChaosModifier {
    constructor() {
        super("Bonus Darts", "Iedereen krijgt 4 pijlen deze ronde.");
    }

    onRoundStart(game) {
        game.maxThrows = 4;
    }

    onRoundEnd(game) {
        game.maxThrows = 3;
    }
}