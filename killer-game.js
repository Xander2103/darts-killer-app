//Darts Killer Game Logica

class KillerGame {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentThrow = 1;
        this.isStarted = false;
        this.winner = null;
        this.history = [];
        this.currentTurnThrows = [];
        this.numberAssignmentMode = "manual";

        //settings
        this.settings = {
            immunityEnabled: true,
            killerStaysForever: true,
            eliminateOnExactZeroOnly: false,
            allowRecoveryBeforeTurn: true
        };
    }

    //Huidige state opslaan zodat we later 1 stap terug kunnen
    saveState() {
        const snapshot = {
            players: JSON.parse(JSON.stringify(this.players)),
            currentPlayerIndex: this.currentPlayerIndex,
            currentThrow: this.currentThrow,
            isStarted: this.isStarted,
            winnerNumber: this.winner ? this.winner.number : null,
            currentTurnThrows: [...this.currentTurnThrows]
        };

        this.history.push(snapshot);
    }

    //Laatste state terugzetten
    undo() {
        if (this.history.length === 0) {
            return;
        }

        const previousState = this.history.pop();

        this.players = previousState.players;
        this.currentPlayerIndex = previousState.currentPlayerIndex;
        this.currentThrow = previousState.currentThrow;
        this.isStarted = previousState.isStarted;
        this.currentTurnThrows = previousState.currentTurnThrows;

        if (previousState.winnerNumber === null) {
            this.winner = null;
        } else {
            this.winner = this.players.find(player => player.number === previousState.winnerNumber) || null;
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
            pendingElimination: false
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
        this.winner = null;
        this.history = [];
        this.currentTurnThrows = [];

        return {
            success: true,
            message: ""
        };
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

    //Single, double, triple --> 1, 2, 3 punten
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

        //State opslaan voor undo
        this.saveState();

        //Speler aan de beurt
        const player = this.getCurrentPlayer();

        //Als speler al dood is, negeren we de worp
        if (!player || !player.isAlive) {
            return;
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

        this.processHit(player, targetNumber, multiplier);

        //Na de worp naar volgende dart of speler gaan
        if (!this.winner) {
            this.nextThrowOrPlayer();
        }
    }

    //Als speler mist, gaan we meteen naar de volgende worp of speler
    handleMiss() {
        if (!this.isStarted) {
            return;
        }

        if (this.winner) {
            return;
        }

        //State opslaan voor undo
        this.saveState();

        this.currentTurnThrows.push("Mis");
        this.nextThrowOrPlayer();
    }

    //SpelregelLogica: punten toekennen of afnemen, status van spelers bijwerken
    processHit(player, targetNumber, multiplier) {
        const points = this.getPoints(multiplier);

        if (points === 0) {
            return;
        }

        //Speler raakt zichzelf
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

        //Als speler nog geen killer is mag hij niet op anderen schieten
        if (!player.isKiller) {
            return;
        }

        //Zoeken naar het doelwit in de spelerslijst
        const targetPlayer = this.players.find(otherPlayer => {
            return otherPlayer.number === targetNumber && otherPlayer.isAlive;
        });

        //Als er geen geldig doelwit is, negeren we de worp
        if (!targetPlayer) {
            return;
        }

        //Je mag niet op jezelf schieten
        if (targetPlayer === player) {
            return;
        }

        //Je mag niet op immuun spelers schieten als immuniteit aanstaat
        if (this.settings.immunityEnabled && targetPlayer.isImmune) {
            return;
        }

        //Punten aftrekken van het doelwit
        targetPlayer.score -= points;

        const shouldEliminateNow = this.isDeadlyScore(targetPlayer.score);

        //Als iemand killer was maar onder 5 zakt, verliest die de killer-status
        if (!this.settings.killerStaysForever && targetPlayer.isKiller && targetPlayer.score < 5) {
            targetPlayer.isKiller = false;
        }

        //Als recovery aan staat en score is dodelijk, dan krijgt speler nog 1 kans
        if (this.settings.allowRecoveryBeforeTurn && shouldEliminateNow) {
            targetPlayer.pendingElimination = true;
        } else if (shouldEliminateNow) {
            targetPlayer.isAlive = false;
            targetPlayer.isKiller = false;
            targetPlayer.pendingElimination = false;
        }

        //Bij exact-zero-only clampen we negatieve scores visueel terug naar 0,
        //maar alleen als die speler NIET pending is
        if (
            targetPlayer.score < 0 &&
            this.settings.eliminateOnExactZeroOnly &&
            !targetPlayer.pendingElimination
        ) {
            targetPlayer.score = 0;
        }

        //Na elke geldige aanval controleren we of er nog maar 1 speler over is
        this.checkWinner();
    }

    //TurnLogica
    nextThrowOrPlayer() {
        //Als speler nog niet 3 worpen heeft gedaan, gaat hij door met de volgende worp
        if (this.currentThrow < 3) {
            this.currentThrow++;
            return;
        }

        const currentPlayer = this.getCurrentPlayer();

        //Als deze speler pending elimination had, checken we na zijn volledige beurt of hij veilig is
        if (currentPlayer && currentPlayer.pendingElimination) {
            if (this.isSafeAfterRecovery(currentPlayer.score)) {
                currentPlayer.pendingElimination = false;
            } else {
                currentPlayer.isAlive = false;
                currentPlayer.isKiller = false;
                currentPlayer.pendingElimination = false;
            }
        }

        //Na 3 worpen resetten we de worp teller en gaan we naar de volgende levende speler
        this.currentThrow = 1;
        this.currentTurnThrows = [];

        //Na een eventuele eliminatie opnieuw winnaar checken
        this.checkWinner();

        if (!this.winner) {
            this.goToNextAlivePlayer();
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

    //Na elke worp controleren we of er nog maar 1 speler over is
    checkWinner() {
        const alivePlayers = this.players.filter(player => player.isAlive);

        if (alivePlayers.length === 1) {
            this.winner = alivePlayers[0];
        }
    }

    //Hulp functies Recovery
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

    //Manier om nummers toe te wijzen aanpassen (random of handmatig)
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