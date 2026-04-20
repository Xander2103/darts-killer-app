import { ChaosModifier } from "../chaos-modifier.js";

export class SafeZone extends ChaosModifier {
    constructor() {
        super("Safe Zone", "One random player cannot be targeted this round.");
    }

    isAvailable(game) {
        return game.players.filter(player => player.isAlive).length >= 3;
    }

    onRoundStart(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);

        if (alivePlayers.length < 3) {
            game.chaosSafeZonePlayerNumber = null;
            game.chaosSafeZonePlayerName = "";
            return;
        }

        const randomIndex = Math.floor(Math.random() * alivePlayers.length);
        const protectedPlayer = alivePlayers[randomIndex];

        game.chaosSafeZonePlayerNumber = protectedPlayer.number;
        game.chaosSafeZonePlayerName = protectedPlayer.name;

        game.players.forEach(player => {
            player.tempSafeZone = player.number === protectedPlayer.number;
        });
    }

    onThrow(context) {
        if (
            context.targetNumber !== context.player.number &&
            context.targetNumber === context.game.chaosSafeZonePlayerNumber
        ) {
            context.cancelThrow = true;
            context.message = "That player is protected by the Safe Zone this round.";
        }

        return context;
    }

    onRoundEnd(game) {
        game.chaosSafeZonePlayerNumber = null;
        game.chaosSafeZonePlayerName = "";

        game.players.forEach(player => {
            player.tempSafeZone = false;
        });
    }
}