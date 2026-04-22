import { ChaosModifier } from "../chaos-modifier.js";

export class FirstBlood extends ChaosModifier {
    constructor() {
        super("First Blood", "Your first dart of the turn gives +1 extra point if it hits.");
        this.spawnWeight = 10;
    }

    isAvailable(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);
        return alivePlayers.length >= 2;
    }

    onRoundStart(game) {
        return;
    }

    onThrow(context) {
        if (context.currentThrow === 1) {
            const basePoints = context.pointsOverride ?? context.game.getPoints(context.multiplier);
            context.pointsOverride = basePoints + 1;
        }

        return context;
    }

    onRoundEnd(game) {
        return;
    }
}