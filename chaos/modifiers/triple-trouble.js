import { ChaosModifier } from "../chaos-modifier.js";

export class TripleTrouble extends ChaosModifier {
    constructor() {
        super("Triple Trouble", "Only triples count this round.");
    }

    onThrow(context) {
        if (context.multiplier !== 3) {
            context.cancelThrow = true;
            context.message = "Only triples count this round.";
        }

        return context;
    }
}