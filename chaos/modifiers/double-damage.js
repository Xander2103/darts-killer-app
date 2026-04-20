import { ChaosModifier } from "../chaos-modifier.js";

export class DoubleDamage extends ChaosModifier {
    constructor() {
        super("Double Damage", "Hits on other players deal double damage this round.");
    }

    isAvailable(game) {
        return game.players.some(player => {
            return player.isAlive && player.isKiller;
        });
    }

    onThrow(context) {
        if (context.targetNumber !== context.player.number) {
            context.pointsOverride = context.multiplier * 2;
        }

        return context;
    }
}