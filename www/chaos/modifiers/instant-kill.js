import { ChaosModifier } from "../chaos-modifier.js";

export class InstantKill extends ChaosModifier {
    constructor() {
        super("Instant Kill", "One dart only. A killer can instantly eliminate with one valid hit.");
        this.spawnWeight = 1;
    }

    isAvailable(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);
        const aliveKillers = alivePlayers.filter(player => player.isKiller);

        return alivePlayers.length >= 3 && aliveKillers.length >= 1;
    }

    onRoundStart(game) {
        game.maxThrows = 1;
    }

    onThrow(context) {
        const { game, player, targetNumber } = context;

        if (!player || !player.isAlive) {
            return context;
        }

        // speler moet killer zijn om anderen te mogen raken
        if (!player.isKiller) {
            return context;
        }

        // doelwit zoeken
        const targetPlayer = game.players.find(otherPlayer => {
            return otherPlayer.number === targetNumber && otherPlayer.isAlive;
        });

        // geen geldig doelwit
        if (!targetPlayer) {
            return context;
        }

        // jezelf raken telt niet als instant kill
        if (targetPlayer === player) {
            return context;
        }

        // immuniteit blijft hier genegeerd: instant kill moet hard zijn
        targetPlayer.isAlive = false;
        targetPlayer.isKiller = false;
        targetPlayer.pendingElimination = false;
        targetPlayer.score = 0;

        game.checkWinner();

        // normale hitverwerking annuleren, anders komt er nog extra scorelogica bovenop
        context.cancelThrow = true;

        return context;
    }

    onRoundEnd(game) {
        game.maxThrows = 3;
    }
}