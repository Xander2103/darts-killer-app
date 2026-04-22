import { ChaosModifier } from "../chaos-modifier.js";

export class SuddenDeath extends ChaosModifier {
    constructor() {
        super("Sudden Death", "All alive players drop to 1 score.");
        this.spawnWeight = 2;
    }

    isAvailable(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);
        return alivePlayers.length >= 2;
    }

    onRoundStart(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);

        alivePlayers.forEach(player => {
            player.score = 1;
            player.pendingElimination = false;
            player.tempIgnoreImmunity = false;
            player.tempSafeZone = false;
            player.tempTargetLockHit = false;
        });
    }

    onThrow(context) {
        return context;
    }

    onRoundEnd(game) {
        return;
    }
}