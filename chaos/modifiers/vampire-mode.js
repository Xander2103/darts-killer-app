import { ChaosModifier } from "../chaos-modifier.js";

export class VampireMode extends ChaosModifier {
    constructor() {
        super("Vampire Mode", "Hit other players to steal 1 point.");
    }

    isAvailable(game) {
        const aliveKillers = game.players.filter(player => {
            return player.isAlive && player.isKiller;
        });

        return aliveKillers.length >= 2;
    }

    onThrow(context) {
        if (context.cancelThrow) {
            return context;
        }

        const { player, targetNumber } = context;

        // alleen bij aanvallen op anderen
        if (targetNumber !== player.number) {
            player.score += 1;

            if (player.score > 5) {
                player.score = 5;
            }

            if (player.score >= 5) {
                player.isKiller = true;
            }
        }

        return context;
    }
}