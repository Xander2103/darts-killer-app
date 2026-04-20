// main.js opstartlogica en event listeners
import { KillerGame } from "./killer-game.js";
import { ChaosEngine } from "./chaos/chaos-engine.js";
import { DoubleTrouble } from "./chaos/modifiers/double-trouble.js";
import { BonusDarts } from "./chaos/modifiers/bonus-darts.js";
import { ImmunityOff } from "./chaos/modifiers/immunity-off.js";
import { initSettings } from "./settings.js";
import {
    renderApp,
    playerNameInput,
    addPlayerButton,
    startGameButton,
    undoButton,
    backToHomeButton
} from "./ui.js";

const game = new KillerGame();
const chaosEngine = new ChaosEngine(game);

// beschikbare chaos modifiers registreren
chaosEngine.register(new DoubleTrouble());
chaosEngine.register(new BonusDarts());
chaosEngine.register(new ImmunityOff());

game.setChaosEngine(chaosEngine);

const homeScreen = document.getElementById("homeScreen");
const classicScreen = document.getElementById("classicScreen");

const classicModeBtn = document.getElementById("classicModeBtn");
const chaosModeBtn = document.getElementById("chaosModeBtn");
const drinkModeBtn = document.getElementById("drinkModeBtn");

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
    game.maxThrows = 3;
    game.currentTurnThrows = [];
    game.winner = null;
    game.history = [];
    game.activeChaosModifier = null;
    game.activeChaosAnnouncementShown = false;

    if (game.chaosEngine) {
        game.chaosEngine.activeModifier = null;
    }

    game.players.forEach(player => {
        player.score = 0;
        player.isKiller = false;
        player.isImmune = true;
        player.isAlive = true;
        player.pendingElimination = false;
        player.number = null;
        player.tempIgnoreImmunity = false;
    });
}

function resetGameCompletely() {
    game.players = [];
    game.currentPlayerIndex = 0;
    game.currentThrow = 1;
    game.maxThrows = 3;
    game.isStarted = false;
    game.winner = null;
    game.history = [];
    game.currentTurnThrows = [];
    game.activeChaosModifier = null;
    game.activeChaosAnnouncementShown = false;
    game.numberAssignmentMode = numberModeManual.checked ? "manual" : "random";
    clearSetupError();

    if (game.chaosEngine) {
        game.chaosEngine.activeModifier = null;
    }
}

function addPlayerFromInput() {
    game.addPlayer(playerNameInput.value);
    playerNameInput.value = "";
    clearSetupError();

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen
    });
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

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen
    });
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

        renderApp(game, {
            resetGameCompletely,
            showHomeScreen
        });
    }
});

numberModeManual.addEventListener("change", () => {
    if (numberModeManual.checked) {
        game.setNumberAssignmentMode("manual");
        clearSetupError();

        renderApp(game, {
            resetGameCompletely,
            showHomeScreen
        });
    }
});

undoButton.addEventListener("click", () => {
    game.undo();

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen
    });
});

classicModeBtn.addEventListener("click", () => {
    game.setGameMode("classic");
    showClassicScreen();

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen
    });
});

chaosModeBtn.addEventListener("click", () => {
    game.setGameMode("chaos");
    showClassicScreen();

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen
    });
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
                showHomeScreen();

                renderApp(game, {
                    resetGameCompletely,
                    showHomeScreen
                });
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

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen
    });
});

// settings initialiseren
initSettings(game, renderApp, {
    resetGameCompletely,
    showHomeScreen
});

// eerste render
showHomeScreen();
renderApp(game, {
    resetGameCompletely,
    showHomeScreen
});