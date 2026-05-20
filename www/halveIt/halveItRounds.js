// www/halveIt/halveItRounds.js

export const HALVE_IT_NUMBER_ROUNDS = [20, 19, 18, 17, 16, 15];

export const HALVE_IT_FINAL_ROUND = {
    label: "Shoot at the Bull",
    shortLabel: "Bull",
    type: "bull",
    description: "Hit the outer bull or bullseye. Outer bull = 25, bullseye = 50."
};

export const HALVE_IT_MINIGAME_POOL = [
    {
        label: "Hit a Double",
        shortLabel: "Double",
        type: "anyDouble",
        description: "Hit any double. Every valid double score counts."
    },
    {
        label: "Shoot at a Treble",
        shortLabel: "Treble",
        type: "anyTriple",
        description: "Hit any treble. Every valid treble score counts."
    },
    {
        label: "3 Different Colors",
        shortLabel: "Different Colors",
        type: "threeDifferentColors",
        description: "Try to hit 3 different board colors with your 3 darts."
    },
    {
        label: "3 Same Colors",
        shortLabel: "Same Colors",
        type: "threeSameColors",
        description: "Try to hit the same board color with all 3 darts."
    },
    {
        label: "Only Black",
        shortLabel: "Black",
        type: "singleColor",
        color: "black",
        description: "Only black segments count."
    },
    {
        label: "Only White",
        shortLabel: "White",
        type: "singleColor",
        color: "white",
        description: "Only white segments count."
    },
    {
        label: "Score 26 / 51 / 101+",
        shortLabel: "26 / 51 / 101+",
        type: "scoreChallenge",
        targets: [26, 51, 101],
        description: "Score exactly 26, exactly 51 or 101+ with 3 darts. Your actual score counts."
    },
    {
        label: "Score 66 / 116 / 121+",
        shortLabel: "66 / 116 / 121+",
        type: "scoreChallenge",
        targets: [66, 116, 121],
        description: "Score exactly 66, exactly 116 or 121+ with 3 darts. Your actual score counts."
    },
    {
        label: "Odd Numbers",
        shortLabel: "Odd",
        type: "oddNumbers",
        description: "Only odd numbers count."
    },
    {
        label: "Even Numbers",
        shortLabel: "Even",
        type: "evenNumbers",
        description: "Only even numbers count."
    }
];

function shuffleArray(array) {
    const shuffled = [...array];

    for (let index = shuffled.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));

        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
}

export function createHalveItRounds() {
    const selectedMiniGames = shuffleArray(HALVE_IT_MINIGAME_POOL).slice(0, 5);
    const rounds = [];

    HALVE_IT_NUMBER_ROUNDS.forEach((number, index) => {
        rounds.push({
            label: String(number),
            shortLabel: String(number),
            type: "number",
            value: number,
            description: `Only ${number}, double ${number} and treble ${number} count.`
        });

        if (index < selectedMiniGames.length) {
            rounds.push(selectedMiniGames[index]);
        }
    });

    rounds.push(HALVE_IT_FINAL_ROUND);

    return rounds;
}