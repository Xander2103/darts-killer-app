import { ChaosModifier } from "../chaos-modifier.js";

export class RandomTargetSwap extends ChaosModifier {
    constructor() {
        super("Random Target Swap", "Each player gets a temporary swapped target number.");
        this.spawnWeight = 5;
    }

    isAvailable(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);
        return alivePlayers.length >= 3;
    }

    onRoundStart(game) {
        const alivePlayers = game.players.filter(player => player.isAlive);

        if (alivePlayers.length < 3) {
            return;
        }

        const originalNumbers = alivePlayers.map(player => player.number);
        const shuffledNumbers = [...originalNumbers];

        // shuffle tot niemand zijn eigen nummer houdt
        let validShuffle = false;

        while (!validShuffle) {
            for (let i = shuffledNumbers.length - 1; i > 0; i--) {
                const randomIndex = Math.floor(Math.random() * (i + 1));
                const temp = shuffledNumbers[i];
                shuffledNumbers[i] = shuffledNumbers[randomIndex];
                shuffledNumbers[randomIndex] = temp;
            }

            validShuffle = alivePlayers.every((player, index) => {
                return shuffledNumbers[index] !== player.number;
            });
        }

        alivePlayers.forEach((player, index) => {
            player.tempTargetNumber = shuffledNumbers[index];
        });
    }

    onThrow(context) {
        return context;
    }

    onRoundEnd(game) {
        game.players.forEach(player => {
            player.tempTargetNumber = null;
        });
    }
}