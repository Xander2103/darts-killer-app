// main.js opstartlogica en event listeners

// Game en chaos engine importeren
import { KillerGame } from "./killer-game.js";

// Chaos engine
import { ChaosEngine } from "./chaos/chaos-engine.js";

// Chaos modifiers
import { DoubleTrouble } from "./chaos/modifiers/double-trouble.js";
import { BonusDarts } from "./chaos/modifiers/bonus-darts.js";
import { ImmunityOff } from "./chaos/modifiers/immunity-off.js";
import { TripleTrouble } from "./chaos/modifiers/triple-trouble.js";
import { TargetLock } from "./chaos/modifiers/target-lock.js";
import { NoMiss } from "./chaos/modifiers/no-miss.js";
import { LastDartPressure } from "./chaos/modifiers/last-dart-pressure.js";
import { DoubleDamage } from "./chaos/modifiers/double-damage.js";
import { OneShot } from "./chaos/modifiers/one-shot.js";
import { SafeZone } from "./chaos/modifiers/safe-zone.js";
import { HotStreak } from "./chaos/modifiers/hot-streak.js";
import { VampireMode } from "./chaos/modifiers/vampire-mode.js";

// UI en settings
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
chaosEngine.register(new TripleTrouble());
chaosEngine.register(new BonusDarts());
chaosEngine.register(new ImmunityOff());
chaosEngine.register(new NoMiss());
chaosEngine.register(new TargetLock());
chaosEngine.register(new LastDartPressure());
chaosEngine.register(new DoubleDamage());
chaosEngine.register(new OneShot());
chaosEngine.register(new SafeZone());
chaosEngine.register(new HotStreak());
chaosEngine.register(new VampireMode());

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
    game.chaosSafeZonePlayerNumber = null;

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
        player.tempSafeZone = false;
        player.tempTargetLockHit = false;
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
    game.chaosSafeZonePlayerNumber = null;
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
    settingsApi.applySettingsForCurrentMode();
    showClassicScreen();

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen
    });
});

chaosModeBtn.addEventListener("click", () => {
    game.setGameMode("chaos");
    settingsApi.applySettingsForCurrentMode();
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
const settingsApi = initSettings(game, renderApp, {
    resetGameCompletely,
    showHomeScreen
});

// eerste render
showHomeScreen();
renderApp(game, {
    resetGameCompletely,
    showHomeScreen
});