import { ChaosModifier } from "../chaos-modifier.js";

export class SteadyHand extends ChaosModifier {
    constructor() {
        super("Steady Hand", "Players cannot drop below 0 score while this modifier is active.");
        this.spawnWeight = 10;
    }

    isAvailable(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);
        const aliveKillers = alivePlayers.filter(player => player.isKiller);

        return alivePlayers.length >= 2 && aliveKillers.length >= 1;
    }

    onRoundStart(game) {
        return;
    }

    onThrow(context) {
        return context;
    }

    onRoundEnd(game) {
        return;
    }
}