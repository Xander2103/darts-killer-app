import { ChaosModifier } from "../chaos-modifier.js";

export class TargetLock extends ChaosModifier {
    constructor() {
        super("Target Lock", "Only your own number counts this round.");
    }

    onThrow(context) {
        if (context.targetNumber !== context.player.number) {
            context.cancelThrow = true;
            context.message = "Only your own number counts this round.";
        }

        return context;
    }
}