import { ChaosModifier } from "../chaos-modifier.js";

// Tijdelijk werkt immuniteit niet
export class ImmunityOff extends ChaosModifier {
    constructor() {
        super("No Immunity", "Immunity is not working this round.");
    }

    isAvailable(game) {
        return game.players.some(player => {
            return player.isAlive && player.isImmune;
        });
    }

    onRoundStart(game) {
        game.players.forEach(player => {
            player.tempIgnoreImmunity = true;
        });
    }

    onRoundEnd(game) {
        game.players.forEach(player => {
            player.tempIgnoreImmunity = false;
        });
    }
}