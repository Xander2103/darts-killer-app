import { ChaosModifier } from "../chaos-modifier.js";

export class Equalizer extends ChaosModifier {
    constructor() {
        super("Equalizer", "Players with the lowest score gain +1 on their first successful hit this round.");
        this.spawnWeight = 7;
    }

    isAvailable(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);
        return alivePlayers.length >= 2;
    }

    onRoundStart(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);

        if (alivePlayers.length === 0) {
            return;
        }

        const lowestScore = Math.min(...alivePlayers.map(player => player.score));

        alivePlayers.forEach(player => {
            player.tempEqualizerBonus = player.score === lowestScore;
        });
    }

    onThrow(context) {
        const player = context.player;

        if (player.tempEqualizerBonus) {
            const basePoints = context.pointsOverride ?? context.game.getPoints(context.multiplier);
            context.pointsOverride = basePoints + 1;
            player.tempEqualizerBonus = false;
        }

        return context;
    }

    onRoundEnd(game) {
        game.players.forEach(player => {
            player.tempEqualizerBonus = false;
        });
    }
}