import { ChaosModifier } from "../chaos-modifier.js";

export class Revival extends ChaosModifier {
    constructor() {
        super("Revival", "One random eliminated player returns to the game.");
        this.spawnWeight = 10;
    }

    isAvailable(game) {
        const deadPlayers = game.players.filter(player => !player.isAlive);
        return deadPlayers.length >= 1;
    }

    onRoundStart(game) {
        const deadPlayers = game.players.filter(player => !player.isAlive);

        if (deadPlayers.length === 0) {
            game.chaosRevivedPlayerName = "";
            return;
        }

        const randomIndex = Math.floor(Math.random() * deadPlayers.length);
        const revivedPlayer = deadPlayers[randomIndex];

        revivedPlayer.isAlive = true;
        revivedPlayer.score = 1;
        revivedPlayer.isKiller = false;
        revivedPlayer.pendingElimination = false;
        revivedPlayer.isImmune = false;
        revivedPlayer.tempIgnoreImmunity = false;
        revivedPlayer.tempSafeZone = false;
        revivedPlayer.tempTargetLockHit = false;

        game.chaosRevivedPlayerName = revivedPlayer.name;
    }

    onThrow(context) {
        return context;
    }

    onRoundEnd(game) {
        game.chaosRevivedPlayerName = "";
    }
}