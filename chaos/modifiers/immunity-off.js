import { ChaosModifier } from "../chaos-modifier.js";

export class ImmunityOff extends ChaosModifier {
    constructor() {
        super("Immunity Off", "Immuniteit werkt niet deze ronde.");
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