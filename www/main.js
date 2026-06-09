// main.js opstartlogica en event listeners

// Game en chaos engine importeren
import { KillerGame } from "./killer-game.js";

// Chaos engine
import { ChaosEngine } from "./chaos/chaos-engine.js";

// Drink engine
import { DrinkEngine } from "./drink/drink-engine.js";
import { CheckoutEngine } from "./checkout/checkout-engine.js";
import { DuelEngine } from "./duel/duel-engine.js";

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
import { Revival } from "./chaos/modifiers/revival.js";
import { InstantKill } from "./chaos/modifiers/instant-kill.js";
import { SuddenDeath } from "./chaos/modifiers/sudden-death.js";
import { BullseyeMadness } from "./chaos/modifiers/bullseye-madness.js";
import { RandomTargetSwap } from "./chaos/modifiers/random-target-swap.js";
import { FirstBlood } from "./chaos/modifiers/first-blood.js";
import { Focus } from "./chaos/modifiers/focus.js";
import { Equalizer } from "./chaos/modifiers/equalizer.js";
import { LuckyHit } from "./chaos/modifiers/lucky-hit.js";
import { SteadyHand } from "./chaos/modifiers/steady-hand.js";
import { OpenSeason } from "./chaos/modifiers/open-season.js";

// UI en settings
import { initSettings } from "./settings.js";
import {
    renderApp,
    renderDrinkMode,
    renderCheckoutMode,
    playerNameInput,
    addPlayerButton,
    startGameButton,
    undoButton,
    backToHomeButton
} from "./ui.js";

import {
    createHalveItGame,
    getCurrentHalveItRound,
    getCurrentHalveItPlayer,
    addHalveItDart,
    finishHalveItTurn,
    undoLastHalveItDart,
    resetHalveItTurn,
    submitHalveItScore
} from "./halveIt/halveItEngine.js";

import { renderHalveItMode } from "./halveIt/halveItUi.js";
import { renderDuelMode } from "./duel/duel-ui.js";
import { TransitArenaEngine } from "./transitArena/transit-arena-engine.js";
import {
    renderTransitArenaMode,
    playTransitPowerUpSpawnSound,
    playTransitPowerUpUnlockSound,
    playTransitPowerUpClaimSound,
    playTransitPowerUpExpireSound
} from "./transitArena/transit-arena-ui.js";

const game = new KillerGame();
const chaosEngine = new ChaosEngine(game);
const drinkEngine = new DrinkEngine();
const checkoutEngine = new CheckoutEngine();
const duelEngine = new DuelEngine();
const transitArenaEngine = new TransitArenaEngine();
let halveItGame = null;

// Chaos modifiers registreren
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
chaosEngine.register(new Revival());
chaosEngine.register(new InstantKill());
chaosEngine.register(new SuddenDeath());
chaosEngine.register(new BullseyeMadness());
chaosEngine.register(new RandomTargetSwap());
chaosEngine.register(new FirstBlood());
chaosEngine.register(new Focus());
chaosEngine.register(new Equalizer());
chaosEngine.register(new LuckyHit());
chaosEngine.register(new SteadyHand());
chaosEngine.register(new OpenSeason());

game.setChaosEngine(chaosEngine);

const homeScreen = document.getElementById("homeScreen");
const classicScreen = document.getElementById("classicScreen");

const classicModeBtn = document.getElementById("classicModeBtn");
const chaosModeBtn = document.getElementById("chaosModeBtn");
const drinkModeBtn = document.getElementById("drinkModeBtn");
const checkoutModeBtn = document.getElementById("checkoutModeBtn");
const halveItModeBtn = document.getElementById("halveItModeBtn");
const duelModeBtn = document.getElementById("duelModeBtn");
const transitArenaModeBtn = document.getElementById("transitArenaModeBtn");

const setupError = document.getElementById("setupError");

function showSetupError(message) {
    setupError.textContent = message;
    setupError.classList.remove("hidden");
}

function clearSetupError() {
    setupError.textContent = "";
    setupError.classList.add("hidden");
}

function showHomeScreen() {
    document.body.dataset.currentMode = "home";
    homeScreen.classList.remove("hidden");
    classicScreen.classList.add("hidden");
}

function showClassicScreen() {
    homeScreen.classList.add("hidden");
    classicScreen.classList.remove("hidden");
}

function resetGameToClassicSetup() {
    game.phase = "setup";
    game.numberSelectionIndex = 0;
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
    game.chaosSafeZonePlayerName = "";
    game.chaosRevivedPlayerName = "";
    game.playersWhoPlayedThisRound = [];
    checkoutEngine.reset();
    duelEngine.reset();
    transitArenaEngine.reset();
    halveItGame = null;

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
        player.tempTargetNumber = null;
    });
}

function resetGameCompletely() {
    game.players = [];
    game.phase = "setup";
    game.numberSelectionIndex = 0;
    game.currentPlayerIndex = 0;
    game.currentThrow = 1;
    game.maxThrows = 3;
    game.isStarted = false;
    game.winner = null;
    game.history = [];
    game.currentTurnThrows = [];
    game.activeChaosModifier = null;
    game.activeChaosAnnouncementShown = false;
    game.chaosSafeZonePlayerNumber = null;
    game.chaosSafeZonePlayerName = "";
    game.chaosRevivedPlayerName = "";
    game.playersWhoPlayedThisRound = [];
    checkoutEngine.reset();
    duelEngine.reset();
    transitArenaEngine.reset();
    halveItGame = null;

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
        showHomeScreen,
        startCheckoutGame,
        startHalveItGame,
        checkoutEngine
    });
}

function openConfirmModal(title, message, onConfirm) {
    const isSure = confirm(message);

    if (isSure) {
        onConfirm();
    }
}

function showDrinkChallenge() {
    const challenge = drinkEngine.getCurrentChallenge();

    renderDrinkMode(challenge, {
        onDone: () => {
            drinkEngine.nextChallenge();
            showDrinkChallenge();
        },
        onBack: () => {
            resetGameCompletely();
            showHomeScreen();
        }
    });
}

function startCheckoutGame() {
    clearSetupError();
    checkoutEngine.start(game.players);
    game.phase = "game";
    game.isStarted = true;

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen,
        startCheckoutGame,
        startHalveItGame,
        checkoutEngine
    });
}

function startHalveItGame() {
    clearSetupError();

    if (game.players.length === 0) {
        showSetupError("Add at least one player before starting Halve It.");
        return;
    }

    halveItGame = createHalveItGame(game.players);

    game.phase = "game";
    game.isStarted = true;

    showHalveItGame();
}

function showHalveItGame() {
    if (!halveItGame) {
        return;
    }

    renderHalveItMode(halveItGame, {
        getCurrentHalveItRound,
        getCurrentHalveItPlayer,

        onDart: (dart) => {
            halveItGame = addHalveItDart(halveItGame, dart);

            if (halveItGame.dartsThisTurn.length >= 3) {
                halveItGame = finishHalveItTurn(halveItGame);
            }

            showHalveItGame();
        },

        onFinishTurn: () => {
            halveItGame = finishHalveItTurn(halveItGame);
            showHalveItGame();
        },

        onUndo: () => {
            halveItGame = undoLastHalveItDart(halveItGame);
            showHalveItGame();
        },

        onResetTurn: () => {
            halveItGame = resetHalveItTurn(halveItGame);
            showHalveItGame();
        },

        onSubmitScore: (score) => {
            halveItGame = submitHalveItScore(halveItGame, score);
            showHalveItGame();
        },

        onBack: () => {
            const isSure = confirm("Are you sure you want to stop the current Halve It match?");

            if (!isSure) {
                return;
            }

            halveItGame = null;
            game.phase = "setup";
            game.isStarted = false;

            renderApp(game, {
                resetGameCompletely,
                showHomeScreen,
                startCheckoutGame,
                startHalveItGame,
                checkoutEngine
            });
        }
    });
}
function startDuelGame() {
    clearSetupError();

    if (game.players.length !== 2) {
        showSetupError("Duel requires exactly 2 players.");
        return;
    }

    duelEngine.start(game.players);
    game.phase = "game";
    game.isStarted = true;

    showDuelGame();
}

function showDuelGame() {
    renderDuelMode(duelEngine, {
        onRender: () => showDuelGame(),

        onSelectMultiplier: (m) => {
            duelEngine.selectMultiplier(m);
            showDuelGame();
        },

        onThrowNumber: (number, multiplier) => {
            duelEngine.throwNumber(number, multiplier);
            duelEngine.selectMultiplier(1);
            showDuelGame();
        },

        onOuterBull: () => {
            duelEngine.throwOuterBull();
            showDuelGame();
        },

        onBull: () => {
            duelEngine.throwBull();
            showDuelGame();
        },

        onMiss: () => {
            duelEngine.miss();
            showDuelGame();
        },

        onEndTurnEarly: () => {
            duelEngine.endTurnEarly();
            showDuelGame();
        },

        onUndo: () => {
            duelEngine.undo();
            showDuelGame();
        },

        onRematch: () => {
            duelEngine.start(game.players);
            showDuelGame();
        },

        onBackToMenu: () => {
            duelEngine.reset();
            game.phase = "setup";
            game.isStarted = false;
            resetGameCompletely();
            showHomeScreen();

            renderApp(game, {
                resetGameCompletely,
                showHomeScreen,
                startCheckoutGame,
                startHalveItGame,
                startDuelGame,
                checkoutEngine
            });
        },

        onBack: () => {
            if (duelEngine.phase === "finished") {
                duelEngine.reset();
                game.phase = "setup";
                game.isStarted = false;

                renderApp(game, {
                    resetGameCompletely,
                    showHomeScreen,
                    startCheckoutGame,
                    startHalveItGame,
                    startDuelGame,
                    checkoutEngine
                });
                return;
            }

            const isSure = confirm("Are you sure you want to stop the current Duel?");
            if (!isSure) return;

            duelEngine.reset();
            game.phase = "setup";
            game.isStarted = false;

            renderApp(game, {
                resetGameCompletely,
                showHomeScreen,
                startCheckoutGame,
                startHalveItGame,
                startDuelGame,
                checkoutEngine
            });
        }
    });
}

function playTransitArenaResultSounds(result = {}) {
    if (result.powerUpSpawned)  playTransitPowerUpSpawnSound();
    if (result.powerUpUnlocked) playTransitPowerUpUnlockSound();
    if (result.powerUpExpired)  playTransitPowerUpExpireSound();
    if (result.claimed)         playTransitPowerUpClaimSound();
}

function startTransitArenaGame() {
    clearSetupError();

    if (game.players.length < 2) {
        showSetupError("Transit Arena requires at least 2 players.");
        return;
    }

    transitArenaEngine.start(game.players);
    game.phase = "game";
    game.isStarted = true;

    showTransitArenaGame();
}

function showTransitArenaGame() {
    renderTransitArenaMode(transitArenaEngine, {
        onSelectTarget: (index) => {
            transitArenaEngine.selectTarget(index);
            showTransitArenaGame();
        },

        onSelectMultiplier: (m) => {
            transitArenaEngine.selectMultiplier(m);
            showTransitArenaGame();
        },

        onThrowSegment: (segment) => {
            const result = transitArenaEngine.throwSegment(segment);
            playTransitArenaResultSounds(result);
            showTransitArenaGame();
        },

        onOuterBull: () => {
            const result = transitArenaEngine.throwBull("outer");
            playTransitArenaResultSounds(result);
            showTransitArenaGame();
        },

        onBull: () => {
            const result = transitArenaEngine.throwBull("bull");
            playTransitArenaResultSounds(result);
            showTransitArenaGame();
        },

        onMiss: () => {
            const result = transitArenaEngine.miss();
            playTransitArenaResultSounds(result);
            showTransitArenaGame();
        },

        onClaimCoin: () => {
            const result = transitArenaEngine.claimPendingPowerUp();
            playTransitArenaResultSounds(result);
            showTransitArenaGame();
        },

        onCoinInfo: () => {
            transitArenaEngine.coinInfo();
            showTransitArenaGame();
        },

        onUndo: () => {
            transitArenaEngine.undo();
            showTransitArenaGame();
        },

        onRematch: () => {
            transitArenaEngine.start(game.players);
            showTransitArenaGame();
        },

        onBackToMenu: () => {
            transitArenaEngine.reset();
            game.phase = "setup";
            game.isStarted = false;
            showHomeScreen();
            renderApp(game, {
                resetGameCompletely,
                showHomeScreen,
                startCheckoutGame,
                startHalveItGame,
                startDuelGame,
                startTransitArenaGame,
                checkoutEngine
            });
        },

        onBack: () => {
            if (transitArenaEngine.status === "finished") {
                transitArenaEngine.reset();
                game.phase = "setup";
                game.isStarted = false;
                renderApp(game, {
                    resetGameCompletely,
                    showHomeScreen,
                    startCheckoutGame,
                    startHalveItGame,
                    startDuelGame,
                    startTransitArenaGame,
                    checkoutEngine
                });
                return;
            }

            const isSure = confirm("Stop the current Transit Arena match?");
            if (!isSure) return;

            transitArenaEngine.reset();
            game.phase = "setup";
            game.isStarted = false;

            renderApp(game, {
                resetGameCompletely,
                showHomeScreen,
                startCheckoutGame,
                startHalveItGame,
                startDuelGame,
                startTransitArenaGame,
                checkoutEngine
            });
        }
    });
}

// Settings initialiseren
const settingsApi = initSettings(game, renderApp, {
    resetGameCompletely,
    showHomeScreen,
    startCheckoutGame,
    startHalveItGame,
    checkoutEngine
});

// Events
addPlayerButton.addEventListener("click", () => {
    addPlayerFromInput();
});

startGameButton.addEventListener("click", () => {
    if (game.gameMode === "checkout") {
        if (game.players.length === 0) {
            showSetupError("Add at least one player before setting up 121 Checkout.");
            return;
        }

        clearSetupError();
        game.phase = "checkoutSetup";

        renderApp(game, {
            resetGameCompletely,
            showHomeScreen,
            startCheckoutGame,
            startHalveItGame,
            checkoutEngine
        });
        return;
    }

    if (game.gameMode === "halveIt") {
        startHalveItGame();
        return;
    }

    if (game.gameMode === "duel") {
        startDuelGame();
        return;
    }

    if (game.gameMode === "transitArena") {
        startTransitArenaGame();
        return;
    }

    const result = game.startGame();

    if (!result.success) {
        showSetupError(result.message);
        return;
    }

    clearSetupError();

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen,
        startCheckoutGame,
        startHalveItGame,
        checkoutEngine
    });
});

playerNameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addPlayerFromInput();
    }
});

undoButton.addEventListener("click", () => {
    if (game.gameMode === "checkout") {
        checkoutEngine.undo();
    } else if (game.gameMode === "halveIt" && halveItGame) {
        halveItGame = undoLastHalveItDart(halveItGame);
        showHalveItGame();
        return;
    } else {
        game.undo();
    }

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen,
        startCheckoutGame,
        startHalveItGame,
        checkoutEngine
    });
});

classicModeBtn.addEventListener("click", () => {
    resetGameCompletely();
    game.setGameMode("classic");
    document.body.dataset.currentMode = "classic";
    settingsApi.applySettingsForCurrentMode();
    showClassicScreen();

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen,
        startCheckoutGame,
        startHalveItGame,
        checkoutEngine
    });
});

chaosModeBtn.addEventListener("click", () => {
    resetGameCompletely();
    game.setGameMode("chaos");
    document.body.dataset.currentMode = "chaos";
    settingsApi.applySettingsForCurrentMode();
    showClassicScreen();

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen,
        startCheckoutGame,
        startHalveItGame,
        checkoutEngine
    });
});

checkoutModeBtn.addEventListener("click", () => {
    resetGameCompletely();
    game.setGameMode("checkout");
    document.body.dataset.currentMode = "checkout";
    showClassicScreen();

    renderApp(game, {
        resetGameCompletely,
        showHomeScreen,
        startCheckoutGame,
        startHalveItGame,
        checkoutEngine
    });
});

if (halveItModeBtn) {
    halveItModeBtn.addEventListener("click", () => {
        resetGameCompletely();
        game.setGameMode("halveIt");
        document.body.dataset.currentMode = "halveIt";
        showClassicScreen();

        renderApp(game, {
            resetGameCompletely,
            showHomeScreen,
            startCheckoutGame,
            startHalveItGame,
            checkoutEngine
        });
    });
}

if (duelModeBtn) {
    duelModeBtn.addEventListener("click", () => {
        resetGameCompletely();
        game.setGameMode("duel");
        document.body.dataset.currentMode = "duel";
        showClassicScreen();

        renderApp(game, {
            resetGameCompletely,
            showHomeScreen,
            startCheckoutGame,
            startHalveItGame,
            startDuelGame,
            checkoutEngine
        });
    });
}

if (transitArenaModeBtn) {
    transitArenaModeBtn.addEventListener("click", () => {
        resetGameCompletely();
        game.setGameMode("transitArena");
        document.body.dataset.currentMode = "transitArena";
        showClassicScreen();

        renderApp(game, {
            resetGameCompletely,
            showHomeScreen,
            startCheckoutGame,
            startHalveItGame,
            startDuelGame,
            startTransitArenaGame,
            checkoutEngine
        });
    });
}

drinkModeBtn.addEventListener("click", () => {
    resetGameCompletely();
    game.setGameMode("drink");
    document.body.dataset.currentMode = "drink";

    homeScreen.classList.add("hidden");
    classicScreen.classList.remove("hidden");

    drinkEngine.start();
    showDrinkChallenge();
});

backToHomeButton.addEventListener("click", () => {
    if (game.gameMode === "drink") {
        resetGameCompletely();
        showHomeScreen();
        return;
    }

    if (game.gameMode === "duel" && game.phase === "game") {
        return;
    }

    if (game.gameMode === "transitArena" && game.phase === "game") {
        return;
    }

    if (game.gameMode === "checkout" && game.phase === "checkoutSetup") {
        game.phase = "setup";

        renderApp(game, {
            resetGameCompletely,
            showHomeScreen,
            startCheckoutGame,
            startHalveItGame,
            checkoutEngine
        });

        return;
    }

    if (game.gameMode === "checkout" && game.phase === "game") {
        openConfirmModal(
            "Back to setup?",
            "Are you sure you want to stop the current 121 Checkout session?",
            () => {
                checkoutEngine.reset();
                game.phase = "setup";
                game.isStarted = false;

                renderApp(game, {
                    resetGameCompletely,
                    showHomeScreen,
                    startCheckoutGame,
                    startHalveItGame,
                    checkoutEngine
                });
            }
        );

        return;
    }

    if (game.phase === "numberSelection") {
        game.goBack();

        renderApp(game, {
            resetGameCompletely,
            showHomeScreen
        });

        return;
    }

    if (game.phase === "game") {
        openConfirmModal(
            "Terug naar nummers?",
            "Ben je zeker dat je terug wilt gaan? De huidige match wordt gestopt.",
            () => {
                game.goBack();

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
        showHomeScreen,
        startCheckoutGame,
        startHalveItGame,
        checkoutEngine
    });
});

window.addEventListener("load", () => {
    const introSplash = document.getElementById("introSplash");

    setTimeout(() => {
        introSplash.classList.add("hidden");
    }, 2000);
});

// Eerste render
showHomeScreen();

renderApp(game, {
    resetGameCompletely,
    showHomeScreen,
    startCheckoutGame,
    startHalveItGame,
    checkoutEngine
});