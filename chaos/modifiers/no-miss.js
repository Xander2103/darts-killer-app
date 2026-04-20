import { ChaosModifier } from "../chaos-modifier.js";

export class NoMiss extends ChaosModifier {
    constructor() {
        super("No Miss", "A miss costs you 1 point.");
    }

    onMiss(game, player) {
        if (!player || !player.isAlive) {
            return;
        }

        player.score -= 1;

        if (!game.settings.killerStaysForever && player.isKiller && player.score < 5) {
            player.isKiller = false;
        }

        const shouldEliminateNow = game.isDeadlyScore(player.score);

        if (game.settings.allowRecoveryBeforeTurn && shouldEliminateNow) {
            player.pendingElimination = true;
        } else if (shouldEliminateNow) {
            player.isAlive = false;
            player.isKiller = false;
            player.pendingElimination = false;
        }

        if (
            player.score < 0 &&
            game.settings.eliminateOnExactZeroOnly &&
            !player.pendingElimination
        ) {
            player.score = 0;
        }

        game.checkWinner();
    }
}