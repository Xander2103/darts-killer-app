import { ChaosModifier } from "../chaos-modifier.js";

export class OpenSeason extends ChaosModifier {
    constructor() {
        super("Open Season", "For this round, every player can attack, even if they are not a killer.");
        this.spawnWeight = 7;
    }

    isAvailable(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);
        const aliveNonKillers = alivePlayers.filter(player => !player.isKiller);
        const attackablePlayers = alivePlayers.filter(player => {
            return !player.isImmune || player.tempIgnoreImmunity;
        });

        return alivePlayers.length >= 2 &&
            aliveNonKillers.length >= 1 &&
            attackablePlayers.length >= 1;
    }

    onRoundStart(game) {
        return;
    }

    onThrow(context) {
        return context;
    }

    onRoundEnd(game) {
        return;
    }
}