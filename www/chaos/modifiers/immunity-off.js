import { ChaosModifier } from "../chaos-modifier.js";

// Tijdelijk werkt immuniteit niet
export class ImmunityOff extends ChaosModifier {
    constructor() {
        super("No Immunity", "Immunity is not working this round.");
        this.spawnWeight = 10;
    }

    isAvailable(game) {
        const hasAliveKiller = game.players.some(player => {
            return player.isAlive && player.isKiller;
        });

        const hasAliveImmunePlayer = game.players.some(player => {
            return player.isAlive && player.isImmune;
        });

        return hasAliveKiller && hasAliveImmunePlayer;
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