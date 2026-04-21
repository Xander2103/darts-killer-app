import { ChaosModifier } from "../chaos-modifier.js";

export class DoubleTrouble extends ChaosModifier {
    constructor() {
        super("Double Trouble", "Only doubles count this round.");
        this.spawnWeight = 10;
    }

    onThrow(context) {
        if (context.hitType !== "double") {
            context.scoreChange = 0;
            context.isValid = false;
            context.message = "Only doubles count this round.";
        }

        return context;
    }
}