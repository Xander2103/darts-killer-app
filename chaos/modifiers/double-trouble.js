import { ChaosModifier } from "../chaos-modifier.js";

export class DoubleTrouble extends ChaosModifier {
    constructor() {
        super("Double Trouble", "Alleen doubles tellen deze ronde.");
    }

    onThrow(context) {
        if (context.hitType !== "double") {
            context.scoreChange = 0;
            context.isValid = false;
            context.message = "Alleen doubles tellen deze ronde.";
        }

        return context;
    }
}