import { ChaosModifier } from "../chaos-modifier.js";

export class TripleTrouble extends ChaosModifier {
    constructor() {
        super("Triple Trouble", "Only triples count this round.");
        this.spawnWeight = 10;
    }

    onThrow(context) {
        if (context.multiplier !== 3) {
            context.cancelThrow = true;
            context.message = "Only triples count this round.";
        }

        return context;
    }
}