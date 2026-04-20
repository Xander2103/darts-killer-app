// Darts Killer Game Logica

export class KillerGame {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentThrow = 1;
        this.maxThrows = 3;
        this.isStarted = false;
        this.winner = null;
        this.history = [];
        this.currentTurnThrows = [];
        this.numberAssignmentMode = "manual";

        // huidige gamemode
        this.gameMode = "classic";

        // chaos engine wordt later vanuit main.js gekoppeld
        this.chaosEngine = null;
        this.activeChaosModifier = null;
        this.activeChaosAnnouncementShown = false;

        // bijhouden wie al gespeeld heeft in de huidige chaos-ronde
        this.playersWhoPlayedThisRound = [];

        // settings
        this.settings = {
            immunityEnabled: true,
            killerStaysForever: true,
            eliminateOnExactZeroOnly: false,
            allowRecoveryBeforeTurn: true,
            chaosRuleScope: "round" // "round" of "turn"
        };
    }

    setGameMode(mode) {
        if (mode === "classic" || mode === "chaos" || mode === "drink") {
            this.gameMode = mode;
        }
    }

    setChaosEngine(chaosEngine) {
        this.chaosEngine = chaosEngine;
    }

    getActiveChaosModifier() {
        return this.activeChaosModifier;
    }

    markChaosAnnouncementShown() {
        this.activeChaosAnnouncementShown = true;
    }

    shouldShowChaosAnnouncement() {
        return this.gameMode === "chaos"
            && this.isStarted
            && this.activeChaosModifier
            && !this.activeChaosAnnouncementShown;
    }

    setChaosRuleScope(scope) {
        if (scope === "round" || scope === "turn") {
            this.settings.chaosRuleScope = scope;
        }
    }

    // Huidige state opslaan zodat we later 1 stap terug kunnen
    saveState() {
        const snapshot = {
            players: JSON.parse(JSON.stringify(this.players)),
            currentPlayerIndex: this.currentPlayerIndex,
            currentThrow: this.currentThrow,
            maxThrows: this.maxThrows,
            isStarted: this.isStarted,
            winnerNumber: this.winner ? this.winner.number : null,
            currentTurnThrows: [...this.currentTurnThrows],
            gameMode: this.gameMode,
            activeChaosModifierName: this.activeChaosModifier ? this.activeChaosModifier.name : null,
            activeChaosAnnouncementShown: this.activeChaosAnnouncementShown,
            playersWhoPlayedThisRound: [...this.playersWhoPlayedThisRound],
            settings: { ...this.settings }
        };

        this.history.push(snapshot);
    }

    // Laatste state terugzetten
    undo() {
        if (this.history.length === 0) {
            return;
        }

        const previousState = this.history.pop();

        this.players = previousState.players;
        this.currentPlayerIndex = previousState.currentPlayerIndex;
        this.currentThrow = previousState.currentThrow;
        this.maxThrows = previousState.maxThrows ?? 3;
        this.isStarted = previousState.isStarted;
        this.currentTurnThrows = previousState.currentTurnThrows;
        this.gameMode = previousState.gameMode ?? "classic";
        this.activeChaosAnnouncementShown = previousState.activeChaosAnnouncementShown ?? false;
        this.playersWhoPlayedThisRound = previousState.playersWhoPlayedThisRound ?? [];
        this.settings = previousState.settings ?? this.settings;

        if (previousState.winnerNumber === null) {
            this.winner = null;
        } else {
            this.winner = this.players.find(player => player.number === previousState.winnerNumber) || null;
        }

        if (this.chaosEngine && previousState.activeChaosModifierName) {
            this.activeChaosModifier =
                this.chaosEngine.availableModifiers.find(
                    modifier => modifier.name === previousState.activeChaosModifierName
                ) || null;

            this.chaosEngine.activeModifier = this.activeChaosModifier;
        } else {
            this.activeChaosModifier = null;

            if (this.chaosEngine) {
                this.chaosEngine.activeModifier = null;
            }
        }
    }

    addPlayer(name) {
        if (this.isStarted) {
            return;
        }

        if (this.players.length >= 20) {
            return;
        }

        const trimmedName = name.trim();

        if (trimmedName === "") {
            return;
        }

        const player = {
            name: trimmedName,
            number: null,
            manualNumber: "",
            score: 0,
            isKiller: false,
            isImmune: true,
            isAlive: true,
            pendingElimination: false,
            tempIgnoreImmunity: false
        };

        this.players.push(player);
    }

    startGame() {
        if (this.players.length < 2) {
            return {
                success: false,
                message: "Je moet minstens 2 spelers toevoegen."
            };
        }

        if (!this.numberAssignmentMode) {
            return {
                success: false,
                message: "Kies eerst hoe de nummers toegewezen worden."
            };
        }

        if (this.numberAssignmentMode === "manual") {
            const validationError = this.validateManualNumbers();

            if (validationError) {
                return {
                    success: false,
                    message: validationError
                };
            }

            this.assignManualNumbers();
        } else {
            this.assignUniqueNumbers();
        }

        this.isStarted = true;
        this.currentPlayerIndex = 0;
        this.currentThrow = 1;
        this.maxThrows = 3;
        this.winner = null;
        this.history = [];
        this.currentTurnThrows = [];
        this.playersWhoPlayedThisRound = [];

        this.players.forEach(player => {
            player.tempIgnoreImmunity = false;
        });

        if (this.gameMode === "chaos" && this.chaosEngine) {
            this.startNewChaosModifier();
        } else {
            this.activeChaosModifier = null;
            this.activeChaosAnnouncementShown = false;
        }

        return {
            success: true,
            message: ""
        };
    }

    startNewChaosModifier() {
        if (this.gameMode !== "chaos" || !this.chaosEngine) {
            this.activeChaosModifier = null;
            this.activeChaosAnnouncementShown = false;
            return;
        }

        this.activeChaosModifier = this.chaosEngine.startNewRound();
        this.activeChaosAnnouncementShown = false;
    }

    endCurrentChaosModifier() {
        if (this.gameMode === "chaos" && this.chaosEngine) {
            this.chaosEngine.endRound();
        }

        this.activeChaosModifier = null;
        this.activeChaosAnnouncementShown = false;
    }

    assignUniqueNumbers() {
        const availableNumbers = [];

        for (let i = 1; i <= 20; i++) {
            availableNumbers.push(i);
        }

        for (let i = availableNumbers.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = availableNumbers[i];
            availableNumbers[i] = availableNumbers[randomIndex];
            availableNumbers[randomIndex] = temp;
        }

        this.players.forEach((player, index) => {
            player.number = availableNumbers[index];
        });
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getAlivePlayers() {
        return this.players.filter(player => player.isAlive);
    }

    // Single, double, triple --> 1, 2, 3 punten
    getPoints(multiplier) {
        if (multiplier === 1 || multiplier === 2 || multiplier === 3) {
            return multiplier;
        }

        return 0;
    }

    handleThrow(targetNumber, multiplier) {
        if (!this.isStarted) {
            return;
        }

        if (this.winner) {
            return;
        }

        // State opslaan voor undo
        this.saveState();

        // Speler aan de beurt
        const player = this.getCurrentPlayer();

        // Als speler al dood is, negeren we de worp
        if (!player || !player.isAlive) {
            return;
        }

        // Throw context voor chaos modifiers
        let throwContext = {
            player,
            targetNumber,
            multiplier,
            cancelThrow: false,
            message: ""
        };

        // Alleen chaos laten ingrijpen wanneer chaos mode actief is
        if (this.gameMode === "chaos" && this.chaosEngine) {
            throwContext = this.chaosEngine.handleThrow(throwContext);
        }

        let throwLabel = "";

        if (multiplier === 1) {
            throwLabel = `S${targetNumber}`;
        } else if (multiplier === 2) {
            throwLabel = `D${targetNumber}`;
        } else if (multiplier === 3) {
            throwLabel = `T${targetNumber}`;
        }

        if (throwLabel !== "") {
            this.currentTurnThrows.push(throwLabel);
        }

        // Als een chaos modifier de throw annuleert, telt de pijl wel als gegooid
        if (!throwContext.cancelThrow) {
            this.processHit(player, targetNumber, multiplier);
        }

        // Na de worp naar volgende dart of speler gaan
        if (!this.winner) {
            this.nextThrowOrPlayer();
        }
    }

    // Als speler mist, gaan we meteen naar de volgende worp of speler
    handleMiss() {
        if (!this.isStarted) {
            return;
        }

        if (this.winner) {
            return;
        }

        // State opslaan voor undo
        this.saveState();

        this.currentTurnThrows.push("Mis");
        this.nextThrowOrPlayer();
    }

    // SpelregelLogica: punten toekennen of afnemen, status van spelers bijwerken
    processHit(player, targetNumber, multiplier) {
        const points = this.getPoints(multiplier);

        if (points === 0) {
            return;
        }

        // Speler raakt zichzelf
        if (targetNumber === player.number) {
            player.score += points;

            if (player.score > 5) {
                player.score = 5;
            }

            player.isImmune = false;

            if (player.score >= 5) {
                player.isKiller = true;
            }

            return;
        }

        // Als speler nog geen killer is mag hij niet op anderen schieten
        if (!player.isKiller) {
            return;
        }

        // Zoeken naar het doelwit in de spelerslijst
        const targetPlayer = this.players.find(otherPlayer => {
            return otherPlayer.number === targetNumber && otherPlayer.isAlive;
        });

        // Als er geen geldig doelwit is, negeren we de worp
        if (!targetPlayer) {
            return;
        }

        // Je mag niet op jezelf schieten
        if (targetPlayer === player) {
            return;
        }

        // Je mag niet op immuun spelers schieten als immuniteit aanstaat
        const immunityBlocksHit =
            this.settings.immunityEnabled &&
            targetPlayer.isImmune &&
            !targetPlayer.tempIgnoreImmunity;

        if (immunityBlocksHit) {
            return;
        }

        // Punten aftrekken van het doelwit
        targetPlayer.score -= points;

        const shouldEliminateNow = this.isDeadlyScore(targetPlayer.score);

        // Als iemand killer was maar onder 5 zakt, verliest die de killer-status
        if (!this.settings.killerStaysForever && targetPlayer.isKiller && targetPlayer.score < 5) {
            targetPlayer.isKiller = false;
        }

        // Als recovery aan staat en score is dodelijk, dan krijgt speler nog 1 kans
        if (this.settings.allowRecoveryBeforeTurn && shouldEliminateNow) {
            targetPlayer.pendingElimination = true;
        } else if (shouldEliminateNow) {
            targetPlayer.isAlive = false;
            targetPlayer.isKiller = false;
            targetPlayer.pendingElimination = false;
        }

        // Bij exact-zero-only clampen we negatieve scores visueel terug naar 0,
        // maar alleen als die speler NIET pending is
        if (
            targetPlayer.score < 0 &&
            this.settings.eliminateOnExactZeroOnly &&
            !targetPlayer.pendingElimination
        ) {
            targetPlayer.score = 0;
        }

        // Na elke geldige aanval controleren we of er nog maar 1 speler over is
        this.checkWinner();
    }

    registerFinishedTurn(player) {
        if (!player) {
            return;
        }

        if (!this.playersWhoPlayedThisRound.includes(player.number)) {
            this.playersWhoPlayedThisRound.push(player.number);
        }
    }

    hasEveryonePlayedThisRound() {
        const alivePlayers = this.getAlivePlayers();

        if (alivePlayers.length === 0) {
            return false;
        }

        return alivePlayers.every(player => this.playersWhoPlayedThisRound.includes(player.number));
    }

    handleChaosAfterTurn(currentPlayer) {
        if (this.gameMode !== "chaos" || !this.chaosEngine) {
            return;
        }

        if (this.settings.chaosRuleScope === "turn") {
            this.endCurrentChaosModifier();
            return;
        }

        // round mode
        this.registerFinishedTurn(currentPlayer);

        if (this.hasEveryonePlayedThisRound()) {
            this.endCurrentChaosModifier();
            this.playersWhoPlayedThisRound = [];
        }
    }

    startChaosForNextPlayerIfNeeded() {
        if (this.gameMode !== "chaos" || !this.chaosEngine) {
            this.activeChaosModifier = null;
            this.activeChaosAnnouncementShown = false;
            return;
        }

        if (this.settings.chaosRuleScope === "turn") {
            this.startNewChaosModifier();
            return;
        }

        // round mode
        if (!this.activeChaosModifier) {
            this.startNewChaosModifier();
        }
    }

    // TurnLogica
    nextThrowOrPlayer() {
        // Als speler nog niet zijn maximum aantal worpen heeft gedaan, gaat hij door met de volgende worp
        if (this.currentThrow < this.maxThrows) {
            this.currentThrow++;
            return;
        }

        const currentPlayer = this.getCurrentPlayer();

        // Als deze speler pending elimination had, checken we na zijn volledige beurt of hij veilig is
        if (currentPlayer && currentPlayer.pendingElimination) {
            if (this.isSafeAfterRecovery(currentPlayer.score)) {
                currentPlayer.pendingElimination = false;
            } else {
                currentPlayer.isAlive = false;
                currentPlayer.isKiller = false;
                currentPlayer.pendingElimination = false;
            }
        }

        // Na een eventuele eliminatie opnieuw winnaar checken
        this.checkWinner();

        // Huidige chaos-beurt / chaos-ronde verwerken
        if (!this.winner) {
            this.handleChaosAfterTurn(currentPlayer);
        }

        // Na max worpen resetten we de worp teller
        this.currentThrow = 1;
        this.currentTurnThrows = [];

        if (!this.winner) {
            this.goToNextAlivePlayer();
            this.startChaosForNextPlayerIfNeeded();
        }
    }

    goToNextAlivePlayer() {
        if (this.players.length === 0) {
            return;
        }

        let nextIndex = this.currentPlayerIndex;

        do {
            nextIndex++;

            if (nextIndex >= this.players.length) {
                nextIndex = 0;
            }
        } while (!this.players[nextIndex].isAlive);

        this.currentPlayerIndex = nextIndex;
    }

    // Na elke worp controleren we of er nog maar 1 speler over is
    checkWinner() {
        const alivePlayers = this.players.filter(player => player.isAlive);

        if (alivePlayers.length === 1) {
            this.winner = alivePlayers[0];
            this.endCurrentChaosModifier();
            this.playersWhoPlayedThisRound = [];
        }
    }

    // Hulp functies Recovery
    isDeadlyScore(score) {
        if (this.settings.eliminateOnExactZeroOnly) {
            return score === 0;
        }

        return score < 0;
    }

    isSafeAfterRecovery(score) {
        if (this.settings.eliminateOnExactZeroOnly) {
            return score > 0;
        }

        return score >= 0;
    }

    // Manier om nummers toe te wijzen aanpassen (random of handmatig)
    setNumberAssignmentMode(mode) {
        if (mode === "random" || mode === "manual") {
            this.numberAssignmentMode = mode;
        }
    }

    setPlayerManualNumber(playerIndex, value) {
        if (!this.players[playerIndex]) {
            return;
        }

        this.players[playerIndex].manualNumber = value;
    }

    validateManualNumbers() {
        const usedNumbers = new Set();

        for (const player of this.players) {
            const rawValue = String(player.manualNumber).trim();

            if (rawValue === "") {
                return "Geef voor elke speler een nummer in.";
            }

            const number = Number(rawValue);

            if (!Number.isInteger(number) || number < 1 || number > 20) {
                return "Alle nummers moeten unieke gehele getallen tussen 1 en 20 zijn.";
            }

            if (usedNumbers.has(number)) {
                return "Elke speler moet een uniek nummer krijgen.";
            }

            usedNumbers.add(number);
        }

        return null;
    }

    assignManualNumbers() {
        this.players.forEach(player => {
            player.number = Number(player.manualNumber);
        });
    }
}