import { ChaosModifier } from "../chaos-modifier.js";

export class TargetLock extends ChaosModifier {
    constructor() {
        super(
            "Target Lock",
            "Only your own number counts this round. Fail to hit it this turn and lose 1 point."
        );
    }

    onRoundStart(game) {
        game.players.forEach(player => {
            player.tempTargetLockHit = false;
        });
    }

    onThrow(context) {
        if (context.targetNumber === context.player.number) {
            context.player.tempTargetLockHit = true;
            return context;
        }

        context.cancelThrow = true;
        context.message = "Only your own number counts this round. Fail to hit it this turn and lose 1 point.";

        return context;
    }

    onRoundEnd(game) {
        game.players.forEach(player => {
            player.tempTargetLockHit = false;
        });
    }
}