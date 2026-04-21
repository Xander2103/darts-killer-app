import { ChaosModifier } from "../chaos-modifier.js";

export class HotStreak extends ChaosModifier {
    constructor() {
        super(
            "Hot Streak",
            "Each hit in your turn gets stronger: 1st hit = normal, 2nd = +1, 3rd = +2 on top your normal score."
        );
        this.spawnWeight = 7;
    }

    onThrow(context) {
        // alleen als throw geldig is
        if (context.cancelThrow) {
            return context;
        }

        const streakBonus = context.turnHitCount;

        context.pointsOverride = context.multiplier + streakBonus;

        return context;
    }
}