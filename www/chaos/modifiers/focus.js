import { ChaosModifier } from "../chaos-modifier.js";

export class Focus extends ChaosModifier {
    constructor() {
        super("Focus", "If your first two darts hit, your third dart gets +1 extra point.");
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
        const previousThrows = context.game.currentTurnThrows;

        const firstTwoWereHits =
            context.currentThrow === 3 &&
            previousThrows.length >= 2 &&
            previousThrows[0] !== "Mis" &&
            previousThrows[1] !== "Mis";

        if (firstTwoWereHits) {
            const basePoints = context.pointsOverride ?? context.game.getPoints(context.multiplier);
            context.pointsOverride = basePoints + 1;
        }

        return context;
    }

    onRoundEnd(game) {
        return;
    }
}