import { ChaosModifier } from "../chaos-modifier.js";

export class LuckyHit extends ChaosModifier {
    constructor() {
        super("Lucky Hit", "Each successful hit has a 25% chance to gain +1 extra point.");
        this.spawnWeight = 10;
        this.bonusChance = 0.25;
    }

    isAvailable(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);
        return alivePlayers.length >= 2;
    }

    onRoundStart(game) {
        return;
    }

    onThrow(context) {
        const isLucky = Math.random() < this.bonusChance;

        if (isLucky) {
            const basePoints = context.pointsOverride ?? context.game.getPoints(context.multiplier);
            context.pointsOverride = basePoints + 1;
        }

        return context;
    }

    onRoundEnd(game) {
        return;
    }
}