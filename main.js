const game = new KillerGame();

const homeScreen = document.getElementById("homeScreen");
const classicScreen = document.getElementById("classicScreen");

const classicModeBtn = document.getElementById("classicModeBtn");
const chaosModeBtn = document.getElementById("chaosModeBtn");
const drinkModeBtn = document.getElementById("drinkModeBtn");
const backToHomeButton = document.getElementById("backToHomeButton");

const setupError = document.getElementById("setupError");
const numberModeRandom = document.getElementById("numberModeRandom");
const numberModeManual = document.getElementById("numberModeManual");

function showSetupError(message) {
    setupError.textContent = message;
    setupError.classList.remove("hidden");
}

function clearSetupError() {
    setupError.textContent = "";
    setupError.classList.add("hidden");
}

function showHomeScreen() {
    homeScreen.classList.remove("hidden");
    classicScreen.classList.add("hidden");
}

function showClassicScreen() {
    homeScreen.classList.add("hidden");
    classicScreen.classList.remove("hidden");
}

function resetGameToClassicSetup() {
    game.isStarted = false;
    game.currentPlayerIndex = 0;
    game.currentThrow = 1;
    game.currentTurnThrows = [];
    game.winner = null;
    game.history = [];

    game.players.forEach(player => {
        player.score = 0;
        player.isKiller = false;
        player.isImmune = true;
        player.isAlive = true;
        player.pendingElimination = false;
        player.number = null;
    });
}

function resetGameCompletely() {
    game.players = [];
    game.currentPlayerIndex = 0;
    game.currentThrow = 1;
    game.isStarted = false;
    game.winner = null;
    game.history = [];
    game.currentTurnThrows = [];
    game.numberAssignmentMode = numberModeManual.checked ? "manual" : "random";
    clearSetupError();
}

function addPlayerFromInput() {
    game.addPlayer(playerNameInput.value);
    playerNameInput.value = "";
    clearSetupError();
    renderApp(game);
}

function openConfirmModal(title, message, onConfirm) {
    const isSure = confirm(message);

    if (isSure) {
        onConfirm();
    }
}

addPlayerButton.addEventListener("click", () => {
    addPlayerFromInput();
});

startGameButton.addEventListener("click", () => {
    const result = game.startGame();

    if (!result.success) {
        showSetupError(result.message);
        return;
    }

    clearSetupError();
    renderApp(game);
});

playerNameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addPlayerFromInput();
    }
});

numberModeRandom.addEventListener("change", () => {
    if (numberModeRandom.checked) {
        game.setNumberAssignmentMode("random");
        clearSetupError();
        renderApp(game);
    }
});

numberModeManual.addEventListener("change", () => {
    if (numberModeManual.checked) {
        game.setNumberAssignmentMode("manual");
        clearSetupError();
        renderApp(game);
    }
});

undoButton.addEventListener("click", () => {
    game.undo();
    renderApp(game);
});

classicModeBtn.addEventListener("click", () => {
    showClassicScreen();
    renderApp(game);
});

chaosModeBtn.addEventListener("click", () => {
    alert("Chaos Mode is nog in progress.");
});

drinkModeBtn.addEventListener("click", () => {
    alert("Drink Mode is nog in progress.");
});

backToHomeButton.addEventListener("click", () => {
    if (game.isStarted) {
        openConfirmModal(
            "Terug naar home?",
            "Ben je zeker dat je terug wilt gaan? De huidige match wordt gestopt.",
            () => {
                resetGameToClassicSetup();
                renderApp(game);
            }
        );
        return;
    }

    const hasSetupProgress = game.players.length > 0;

    if (hasSetupProgress) {
        const isSure = confirm("Ben je zeker dat je terug naar het menu wilt? Je ingestelde spelers gaan verloren.");

        if (!isSure) {
            return;
        }

        resetGameCompletely();
    }

    showHomeScreen();
    renderApp(game);
});

showHomeScreen();
renderApp(game);