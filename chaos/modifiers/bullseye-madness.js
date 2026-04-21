import { ChaosModifier } from "../chaos-modifier.js";

export class BullseyeMadness extends ChaosModifier {
    constructor() {
        super("Bullseye Madness", "Normal hits are worth 1. Outer Bull scores 2, Inner Bull scores 3. Doubles and triples count as 1.");
        this.spawnWeight = 7;
    }

    isAvailable(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);
        return alivePlayers.length >= 2;
    }

    onRoundStart(game) {
        return;
    }

    onThrow(context) {
        // gewone nummers tellen altijd als 1 tijdens Bullseye Madness
        context.pointsOverride = 1;
        return context;
    }

    onRoundEnd(game) {
        return;
    }
}