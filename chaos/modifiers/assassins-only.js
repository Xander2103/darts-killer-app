import { ChaosModifier } from "../chaos-modifier.js";

export class AssassinsOnly extends ChaosModifier {
    constructor() {
        super("Assassins Only", "Only killers can score this round.");
    }

    onThrow(context) {
        if (!context.player.isKiller) {
            context.cancelThrow = true;
            context.message = "Only killers can score this round.";
        }

        return context;
    }
}