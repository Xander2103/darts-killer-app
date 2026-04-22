import { ChaosModifier } from "../chaos-modifier.js";

export class LastDartPressure extends ChaosModifier {
    constructor() {
        super("Last Dart Pressure", "Your last dart counts double this round.");
        this.spawnWeight = 10;
    }

    onThrow(context) {
        if (context.currentThrow === context.maxThrows) {
            context.pointsOverride = context.multiplier * 2;
        }

        return context;
    }
}