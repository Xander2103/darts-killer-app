import { drinkingChallenges } from "./drink-challenges.js";

export class DrinkEngine {
    constructor() {
        this.currentChallenge = null;
        this.deck = [];
        this.usedChallenges = [];
        this.challengeCount = 0;
    }

    start() {
        this.challengeCount = 0;
        this.usedChallenges = [];
        this.deck = this.createShuffledDeck();
        this.currentChallenge = this.drawChallenge();

        return this.currentChallenge;
    }

    nextChallenge() {
        this.challengeCount++;
        this.currentChallenge = this.drawChallenge();

        return this.currentChallenge;
    }

    getCurrentChallenge() {
        return this.currentChallenge;
    }

    getChallengeCount() {
        return this.challengeCount;
    }

    createShuffledDeck() {
        const deck = [...drinkingChallenges];

        for (let i = deck.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = deck[i];
            deck[i] = deck[randomIndex];
            deck[randomIndex] = temp;
        }

        return deck;
    }

    drawChallenge() {
        if (drinkingChallenges.length === 0) {
            return null;
        }

        if (this.deck.length === 0) {
            this.deck = this.createShuffledDeck();
            this.usedChallenges = [];
        }

        const challenge = this.deck.pop();
        this.usedChallenges.push(challenge.title);

        return challenge;
    }
}