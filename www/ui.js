// =====================================================
// DOM REFERENCES
// =====================================================

const setupPanel = document.getElementById("setupPanel");
const gamePanel = document.getElementById("gamePanel");
const playerNameInput = document.getElementById("playerName");
const addPlayerButton = document.getElementById("addPlayerBtn");
const startGameButton = document.getElementById("startGameBtn");
const gameBoard = document.getElementById("gameBoard");
const playerList = document.getElementById("playerList");
const setupInfoText = document.getElementById("setupInfoText");

const undoButton = document.getElementById("undoButton");
const backToHomeButton = document.getElementById("backToHomeButton");

// Chaos header
const chaosHeader = document.getElementById("chaosHeader");
const chaosHeaderTitle = document.getElementById("chaosHeaderTitle");
const chaosInfoButton = document.getElementById("chaosInfoButton");
const chaosInfoExtra = document.getElementById("chaosInfoExtra");

// Chaos intro modal
const chaosIntroModal = document.getElementById("chaosIntroModal");
const chaosIntroTitle = document.getElementById("chaosIntroTitle");
const chaosIntroDescription = document.getElementById("chaosIntroDescription");
const chaosIntroConfirm = document.getElementById("chaosIntroConfirm");
const chaosIntroBackdrop = document.getElementById("chaosIntroBackdrop");
const chaosIntroExtra = document.getElementById("chaosIntroExtra");

// Chaos info modal
const chaosInfoModal = document.getElementById("chaosInfoModal");
const chaosInfoTitle = document.getElementById("chaosInfoTitle");
const chaosInfoDescription = document.getElementById("chaosInfoDescription");
const chaosInfoClose = document.getElementById("chaosInfoClose");
const chaosInfoBackdrop = document.getElementById("chaosInfoBackdrop");

// =====================================================
// SOUND / HAPTICS
// =====================================================

let audioContext = null;
let lastWinnerSoundName = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    return audioContext;
}

function playTone(frequency, duration = 0.08, type = "sine", volume = 0.08) {
    const ctx = getAudioContext();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
}

function vibrate(pattern = 25) {
    if ("vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}

function playHitSound(multiplier) {
    if (multiplier === 1) {
        playTone(420, 0.08, "sine", 0.07);
    } else if (multiplier === 2) {
        playTone(560, 0.1, "triangle", 0.08);
        setTimeout(() => playTone(720, 0.08, "triangle", 0.06), 55);
    } else if (multiplier === 3) {
        playTone(700, 0.08, "square", 0.06);
        setTimeout(() => playTone(900, 0.08, "square", 0.05), 55);
        setTimeout(() => playTone(1100, 0.09, "square", 0.045), 110);
    }

    vibrate(25);
}

function playMissSound() {
    playTone(180, 0.14, "sawtooth", 0.05);
    vibrate(45);
}

function playNextTurnSound() {
    playTone(300, 0.06, "sine", 0.04);
    setTimeout(() => playTone(440, 0.07, "sine", 0.05), 60);
}

function playWinnerSound() {
    playTone(523, 0.12, "triangle", 0.08);
    setTimeout(() => playTone(659, 0.12, "triangle", 0.08), 130);
    setTimeout(() => playTone(784, 0.16, "triangle", 0.09), 260);
    setTimeout(() => playTone(1046, 0.22, "triangle", 0.08), 430);

    vibrate([80, 50, 120]);
}

// =====================================================
// MAIN RENDER
// =====================================================

function renderApp(game, actions = {}) {
    renderSetupPanel(game);
    renderGamePanel(game);
    renderSetupModeBadge(game);
    updateSetupInfo(game);
    updateSetupActionButton(game);
    renderSetupPlayers(game, actions);
    renderChaosHeader(game);
    updateUndoButton(game, actions);
    updateBackButton(game);
    bindChaosInfoButton(game);
    maybeShowChaosIntro(game);

    if (game.phase === "checkoutSetup") {
        renderCheckoutSetup(game, actions.checkoutEngine, actions);
    } else if (game.phase === "numberSelection") {
        renderNumberSelection(game, actions);
    } else if (game.phase === "game") {
        if (game.gameMode === "checkout") {
            renderCheckoutMode(actions.checkoutEngine, actions);
        } else if (game.gameMode === "duel") {
            // rendering handled by showDuelGame() in main.js
        } else {
            renderGameBoard(game, actions);
        }
    }
}

// =====================================================
// PANELS / BASIC UI
// =====================================================

function renderGamePanel(game) {
    if (!gamePanel) {
        return;
    }

    if (game.phase === "numberSelection" || game.phase === "game" || game.phase === "checkoutSetup") {
        gamePanel.classList.remove("hidden");
    } else {
        gamePanel.classList.add("hidden");
    }
}

function renderSetupPanel(game) {
    if (!setupPanel) {
        return;
    }

    setupPanel.style.display = game.phase === "setup" ? "block" : "none";
}

function updateSetupActionButton(game) {
    if (!startGameButton) {
        return;
    }

    if (game.gameMode === "checkout") {
        startGameButton.innerHTML = `
            <span class="action-icon">⚙</span>
            Setup Game
        `;
        return;
    }

    if (game.gameMode === "duel") {
        startGameButton.innerHTML = `
            <span class="action-icon">⚔</span>
            Start Duel
        `;
        return;
    }

    if (game.gameMode === "transitArena") {
        startGameButton.innerHTML = `
            <span class="action-icon">▶</span>
            Start Arena
        `;
        return;
    }

    startGameButton.innerHTML = `
        <span class="action-icon">▶</span>
        Start Game
    `;
}

function updateUndoButton(game, actions = {}) {
    if (!undoButton) {
        return;
    }

    if (game.phase === "checkoutSetup" ||
        (game.gameMode === "checkout" && game.phase === "game") ||
        (game.gameMode === "duel" && game.phase === "game") ||
        (game.gameMode === "transitArena" && game.phase === "game")) {
        undoButton.disabled = true;
        undoButton.classList.add("hidden");
        return;
    }

    undoButton.classList.remove("hidden");

    if (game.gameMode === "checkout" && actions.checkoutEngine) {
        undoButton.disabled = actions.checkoutEngine.history.length === 0;
        return;
    }

    undoButton.disabled = game.history.length === 0;
}

function updateBackButton(game) {
    if (!backToHomeButton) {
        return;
    }

    backToHomeButton.textContent = game && game.phase === "checkoutSetup" ? "← Players" : "← Back";
}

function updateSetupInfo(game) {
    if (!setupInfoText) {
        return;
    }

    const infoContent = setupInfoText.querySelector(".setup-info-content");

    if (!infoContent) {
        return;
    }

    if (game.gameMode === "chaos") {
        infoContent.textContent = "Base rules and chaos modifiers can be adjusted in the settings.";
    } else if (game.gameMode === "checkout") {
        infoContent.textContent = "Add one or more players. In 121 Checkout everyone works together on the same target.";
    } else if (game.gameMode === "duel") {
        infoContent.textContent = "Add exactly 2 players. Each player picks a target number. Attack by hitting your opponent's number — first to 0 HP loses.";
    } else if (game.gameMode === "transitArena") {
        infoContent.textContent = "Add 2 or more players. Multiplayer HP battle with board-segment power-ups.";
    } else {
        infoContent.textContent = "Base rules can be adjusted in the settings.";
    }
}

// =====================================================
// CHAOS HEADER
// =====================================================

function renderChaosHeader(game) {
    if (!chaosHeader || !chaosHeaderTitle || !chaosInfoButton) {
        return;
    }

    const activeModifier = game.getActiveChaosModifier();
    const shouldShowHeader =
        game.gameMode === "chaos" &&
        game.isStarted &&
        !game.winner &&
        !!activeModifier;

    if (shouldShowHeader) {
        chaosHeader.classList.remove("hidden");
        chaosHeader.style.display = "flex";
        chaosHeaderTitle.textContent = activeModifier.name;
        chaosInfoButton.disabled = false;
    } else {
        chaosHeader.classList.add("hidden");
        chaosHeader.style.display = "none";
        chaosHeaderTitle.textContent = "";
        chaosInfoButton.disabled = true;
    }
}

// =====================================================
// CHAOS MODALS
// =====================================================

function maybeShowChaosIntro(game) {
    if (!chaosIntroModal || !chaosIntroTitle || !chaosIntroDescription || !chaosIntroConfirm) {
        return;
    }

    if (game.winner) {
        chaosIntroModal.classList.add("hidden");
        return;
    }

    if (!game.shouldShowChaosAnnouncement || !game.shouldShowChaosAnnouncement()) {
        return;
    }

    const activeModifier = game.getActiveChaosModifier();

    if (!activeModifier) {
        return;
    }

    chaosIntroTitle.textContent = activeModifier.name;
    chaosIntroDescription.textContent = activeModifier.description;

    if (chaosIntroExtra) {
        if (activeModifier.name === "Safe Zone" && game.chaosSafeZonePlayerName) {
            chaosIntroExtra.textContent = `Protected player: ${game.chaosSafeZonePlayerName}`;
            chaosIntroExtra.classList.remove("hidden");
        } else if (activeModifier.name === "Revival" && game.chaosRevivedPlayerName) {
            chaosIntroExtra.textContent = `${game.chaosRevivedPlayerName} has been revived!`;
            chaosIntroExtra.classList.remove("hidden");
        } else {
            chaosIntroExtra.textContent = "";
            chaosIntroExtra.classList.add("hidden");
        }
    }

    chaosIntroModal.classList.remove("hidden");

    const closeIntro = () => {
        chaosIntroModal.classList.add("hidden");
        game.markChaosAnnouncementShown();
        chaosIntroConfirm.removeEventListener("click", closeIntro);
        chaosIntroBackdrop?.removeEventListener("click", closeIntro);
    };

    chaosIntroConfirm.addEventListener("click", closeIntro);
    chaosIntroBackdrop?.addEventListener("click", closeIntro);
}

function bindChaosInfoButton(game) {
    if (!chaosInfoButton) {
        return;
    }

    chaosInfoButton.onclick = () => {
        const activeModifier = game.getActiveChaosModifier();

        if (!activeModifier || !chaosInfoModal || !chaosInfoTitle || !chaosInfoDescription) {
            return;
        }

        chaosInfoTitle.textContent = activeModifier.name;
        chaosInfoDescription.textContent = activeModifier.description;

        if (chaosInfoExtra) {
            if (activeModifier.name === "Safe Zone" && game.chaosSafeZonePlayerName) {
                chaosInfoExtra.textContent = `Protected player: ${game.chaosSafeZonePlayerName}`;
                chaosInfoExtra.classList.remove("hidden");
            } else if (activeModifier.name === "Revival" && game.chaosRevivedPlayerName) {
                chaosInfoExtra.textContent = `${game.chaosRevivedPlayerName} has been revived!`;
                chaosInfoExtra.classList.remove("hidden");
            } else {
                chaosInfoExtra.textContent = "";
                chaosInfoExtra.classList.add("hidden");
            }
        }

        chaosInfoModal.classList.remove("hidden");
    };

    if (chaosInfoClose && chaosInfoModal) {
        chaosInfoClose.addEventListener("click", () => {
            chaosInfoModal.classList.add("hidden");
        });
    }

    if (chaosInfoBackdrop && chaosInfoModal) {
        chaosInfoBackdrop.addEventListener("click", () => {
            chaosInfoModal.classList.add("hidden");
        });
    }
}

// =====================================================
// SETUP PLAYER LIST
// =====================================================

function renderSetupPlayers(game, actions = {}) {
    if (!playerList) {
        return;
    }

    playerList.innerHTML = "";

    game.players.forEach((player, index) => {
        const li = document.createElement("li");
        li.classList.add("player-list-item");

        li.appendChild(createSetupPlayerCard(game, player, index, actions));

        playerList.appendChild(li);
    });
}

function createSetupPlayerCard(game, player, index, actions) {
    const card = document.createElement("div");
    card.classList.add("manual-player-card");

    const topRow = document.createElement("div");
    topRow.classList.add("manual-player-top");

    const leftSide = document.createElement("div");
    leftSide.classList.add("manual-player-left");

    const indexBadge = document.createElement("div");
    indexBadge.classList.add("manual-player-index");
    indexBadge.textContent = index + 1;

    const nameSpan = document.createElement("div");
    nameSpan.classList.add("manual-player-name");
    nameSpan.textContent = player.name;

    leftSide.appendChild(indexBadge);
    leftSide.appendChild(nameSpan);

    const actionButtons = createSetupActionButtons(game, player, index, actions);

    topRow.appendChild(leftSide);
    topRow.appendChild(actionButtons);

    card.appendChild(topRow);

    return card;
}

function createSetupActionButtons(game, player, index, actions) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("manual-player-actions");

    const moveUpButton = document.createElement("button");
    moveUpButton.type = "button";
    moveUpButton.classList.add("manual-icon-button");
    moveUpButton.textContent = "↑";
    moveUpButton.title = "Move up";
    moveUpButton.disabled = index === 0;
    moveUpButton.addEventListener("click", () => {
        game.movePlayerUp(index);
        renderApp(game, actions);
    });

    const moveDownButton = document.createElement("button");
    moveDownButton.type = "button";
    moveDownButton.classList.add("manual-icon-button");
    moveDownButton.textContent = "↓";
    moveDownButton.title = "Move down";
    moveDownButton.disabled = index === game.players.length - 1;
    moveDownButton.addEventListener("click", () => {
        game.movePlayerDown(index);
        renderApp(game, actions);
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.classList.add("manual-icon-button");
    editButton.textContent = "✎";
    editButton.title = "Edit name";
    editButton.addEventListener("click", () => {
        const newName = prompt("New name:", player.name);

        if (newName !== null) {
            const trimmedName = newName.trim();

            if (trimmedName !== "") {
                player.name = trimmedName;
                renderApp(game, actions);
            }
        }
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("manual-icon-button", "remove-button");
    removeButton.textContent = "✕";
    removeButton.title = "Remove player";
    removeButton.addEventListener("click", () => {
        game.players.splice(index, 1);
        renderApp(game, actions);
    });

    wrapper.appendChild(moveUpButton);
    wrapper.appendChild(moveDownButton);
    wrapper.appendChild(editButton);
    wrapper.appendChild(removeButton);

    return wrapper;
}

// =====================================================
// GAME BOARD HELPERS
// =====================================================

function createScoreBlocks(player) {
    const scoreWrapper = document.createElement("div");
    scoreWrapper.classList.add("score-blocks");

    for (let i = 1; i <= 5; i++) {
        const block = document.createElement("span");
        block.classList.add("score-block");

        if (i <= player.score) {
            block.classList.add("filled");
            block.classList.add(`score-total-${player.score}`);
        }

        scoreWrapper.appendChild(block);
    }

    return scoreWrapper;
}

function createStatusBadge(player, game) {
    const statusBadge = document.createElement("div");
    statusBadge.classList.add("status-badge");

    if (!player.isAlive) {
        statusBadge.textContent = "Out";
        statusBadge.classList.add("badge-out");
    } else if (game.winner === player) {
        statusBadge.textContent = "WINNER";
        statusBadge.classList.add("badge-winner");
    } else if (player.pendingElimination) {
        statusBadge.textContent = "⚠ Pending";
        statusBadge.classList.add("badge-pending");
    } else if (player.tempSafeZone) {
        statusBadge.innerHTML = "🛡 Safe Zone";
        statusBadge.classList.add("badge-safezone");
    } else if (player.isKiller) {
        statusBadge.textContent = "🎯 Killer";
        statusBadge.classList.add("badge-killer");
    } else if (player.isImmune && game.settings.immunityEnabled && !player.tempIgnoreImmunity) {
        statusBadge.textContent = "Immune";
        statusBadge.classList.add("badge-immune");
    } else {
        statusBadge.textContent = "Active";
        statusBadge.classList.add("badge-active");
    }

    return statusBadge;
}

function isThrowButtonDisabled(game, multiplier) {
    if (game.gameMode !== "chaos") {
        return false;
    }

    const activeModifier = game.getActiveChaosModifier();

    if (!activeModifier) {
        return false;
    }

    if (activeModifier.name === "Double Trouble") {
        return multiplier !== 2;
    }

    if (activeModifier.name === "Triple Trouble") {
        return multiplier !== 3;
    }

    return false;
}

// =====================================================
// GAME BOARD
// =====================================================

function renderNumberSelection(game, actions = {}) {
    if (!gameBoard) {
        return;
    }

    const player = game.players[game.numberSelectionIndex];

    if (!player) {
        return;
    }

    gameBoard.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.classList.add("number-selection-card");

    wrapper.innerHTML = `
        <div class="number-selection-progress">
            Player ${game.numberSelectionIndex + 1} of ${game.players.length}
        </div>

        <h2>${player.name}</h2>

        <p class="number-selection-help">
            Throw 1 dart with your non-dominant hand.<br>
            Enter the number you hit.
        </p>

        <input id="numberSelectionInput" class="number-selection-input" type="number" min="1" max="20" placeholder="1-20">

        <div id="numberSelectionError" class="number-selection-error hidden"></div>

        <button id="confirmNumberBtn" type="button" class="number-selection-button">
            Confirm Number
        </button>

        <div class="number-selection-list">
            ${game.players.map((listedPlayer, index) => {
        const isCurrent = index === game.numberSelectionIndex;
        const hasNumber = listedPlayer.number !== null;

        return `
                    <div class="number-selection-player ${isCurrent ? "current" : ""}">
                        <span>${index + 1}. ${listedPlayer.name}</span>
                        <strong>${hasNumber ? listedPlayer.number : isCurrent ? "Now" : "Waiting"}</strong>
                    </div>
                `;
    }).join("")}
        </div>
    `;

    gameBoard.appendChild(wrapper);

    const input = document.getElementById("numberSelectionInput");
    const confirmButton = document.getElementById("confirmNumberBtn");
    const errorBox = document.getElementById("numberSelectionError");

    input.focus();

    function confirmNumber() {
        const number = Number(input.value);
        const result = game.confirmPlayerNumber(number);

        if (!result.success) {
            errorBox.textContent = result.message;
            errorBox.classList.remove("hidden");
            input.select();
            return;
        }

        renderApp(game, actions);
    }

    confirmButton.addEventListener("click", confirmNumber);

    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            confirmNumber();
        }
    });
}

function renderGameBoard(game, actions = {}) {
    const { resetGameCompletely, showHomeScreen } = actions;

    if (!gameBoard) {
        return;
    }

    gameBoard.innerHTML = "";

    if (!game.isStarted) {
        return;
    }

    if (game.players.length === 0) {
        gameBoard.innerHTML = "<p>No players added yet.</p>";
        return;
    }

    const activeModifier = game.getActiveChaosModifier();
    const isBullseyeMadnessActive =
        game.gameMode === "chaos" &&
        activeModifier &&
        activeModifier.name === "Bullseye Madness";

    const isTargetSwapActive =
        game.gameMode === "chaos" &&
        activeModifier &&
        activeModifier.name === "Random Target Swap";

    const sortedPlayers = [
        ...game.players.filter(player => player.isAlive),
        ...game.players.filter(player => !player.isAlive)
    ];

    sortedPlayers.forEach((player) => {
        const index = game.players.indexOf(player);
        const row = document.createElement("div");
        row.classList.add("game-row");

        const isActivePlayer =
            game.isStarted &&
            index === game.currentPlayerIndex &&
            player.isAlive &&
            !game.winner;

        if (isActivePlayer) {
            row.classList.add("active-row");
        }

        if (!player.isAlive) {
            row.classList.add("eliminated-row");
        }

        if (game.winner === player) {
            row.classList.add("winner-row");
        }

        if (player.pendingElimination && player.isAlive) {
            row.classList.add("pending-row");
        } else if (player.isKiller && player.isAlive && game.winner !== player) {
            row.classList.add("killer-row");
        }

        if (player.tempSafeZone && player.isAlive) {
            row.classList.add("safe-zone-row");
        }

        if (!player.isAlive) {
            const topRow = document.createElement("div");
            topRow.classList.add("game-row-top", "out-player-top");

            const leftSide = document.createElement("div");
            leftSide.classList.add("game-row-left");

            const nameLine = document.createElement("div");
            nameLine.classList.add("player-main-info");

            if (player.number !== null) {
                const numberBadge = document.createElement("span");
                numberBadge.classList.add("player-number-badge");
                numberBadge.textContent = player.number;
                nameLine.appendChild(numberBadge);
            }

            const nameText = document.createElement("span");
            nameText.classList.add("player-name");
            nameText.textContent = player.name;
            nameLine.appendChild(nameText);

            leftSide.appendChild(nameLine);

            const rightSide = document.createElement("div");
            rightSide.classList.add("game-row-right");

            const statusBadge = createStatusBadge(player, game);
            rightSide.appendChild(statusBadge);

            topRow.appendChild(leftSide);
            topRow.appendChild(rightSide);

            row.appendChild(topRow);
            gameBoard.appendChild(row);

            return;
        }

        const topRow = document.createElement("div");
        topRow.classList.add("game-row-top");

        const leftSide = document.createElement("div");
        leftSide.classList.add("game-row-left");

        const nameLine = document.createElement("div");
        nameLine.classList.add("player-main-info");

        if (player.number !== null) {
            const numberBadge = document.createElement("span");
            numberBadge.classList.add("player-number-badge");
            numberBadge.textContent = player.number;
            nameLine.appendChild(numberBadge);
        }

        const nameText = document.createElement("span");
        nameText.classList.add("player-name");
        nameText.textContent = player.name;
        nameLine.appendChild(nameText);

        leftSide.appendChild(nameLine);

        if (isActivePlayer && isTargetSwapActive && player.tempTargetNumber !== null) {
            const targetBadge = document.createElement("div");
            targetBadge.classList.add("target-info-line");
            targetBadge.textContent = `🎯 Target ${player.tempTargetNumber}`;
            leftSide.appendChild(targetBadge);
        }

        leftSide.appendChild(createScoreBlocks(player));

        const rightSide = document.createElement("div");
        rightSide.classList.add("game-row-right");

        const statusBadge = createStatusBadge(player, game);
        rightSide.appendChild(statusBadge);

        const scoreInfo = document.createElement("div");
        scoreInfo.classList.add("score-pill");
        scoreInfo.innerHTML = `Score: <strong>${player.score}</strong>`;

        if (player.score < 0 || player.pendingElimination) {
            scoreInfo.classList.add("score-pill-warning");
        }

        rightSide.appendChild(scoreInfo);

        topRow.appendChild(leftSide);
        topRow.appendChild(rightSide);

        const buttonRow = document.createElement("div");
        buttonRow.classList.add("game-row-buttons");

        const displayedTargetNumber = player.tempTargetNumber ?? player.number;

        if (game.isStarted && !game.winner) {
            const singleButton = document.createElement("button");
            singleButton.textContent = `S ${displayedTargetNumber}`;
            singleButton.disabled = isThrowButtonDisabled(game, 1);
            singleButton.addEventListener("click", () => {
                if (singleButton.disabled) {
                    return;
                }

                game.handleThrow(displayedTargetNumber, 1);
                playHitSound(1);
                renderApp(game, actions);
            });

            const doubleButton = document.createElement("button");
            doubleButton.textContent = `D ${displayedTargetNumber}`;
            doubleButton.disabled = isThrowButtonDisabled(game, 2);
            doubleButton.addEventListener("click", () => {
                if (doubleButton.disabled) {
                    return;
                }

                game.handleThrow(displayedTargetNumber, 2);
                playHitSound(2);
                renderApp(game, actions);
            });

            const tripleButton = document.createElement("button");
            tripleButton.textContent = `T ${displayedTargetNumber}`;
            tripleButton.disabled = isThrowButtonDisabled(game, 3);
            tripleButton.addEventListener("click", () => {
                if (tripleButton.disabled) {
                    return;
                }

                game.handleThrow(displayedTargetNumber, 3);
                playHitSound(3);
                renderApp(game, actions);
            });

            const missButton = document.createElement("button");
            missButton.textContent = "Miss";
            missButton.classList.add("miss-button");
            missButton.addEventListener("click", () => {
                game.handleMiss();
                playMissSound();
                renderApp(game, actions);
            });

            const nextTurnButton = document.createElement("button");
            nextTurnButton.textContent = "Next Turn →";
            nextTurnButton.classList.add("next-turn-button");
            nextTurnButton.addEventListener("click", () => {
                game.endTurn();
                playNextTurnSound();
                renderApp(game, actions);
            });

            buttonRow.appendChild(singleButton);
            buttonRow.appendChild(doubleButton);
            buttonRow.appendChild(tripleButton);

            if (isActivePlayer) {
                buttonRow.appendChild(missButton);
                buttonRow.appendChild(nextTurnButton);
            }

            if (isBullseyeMadnessActive) {
                const outerBullButton = document.createElement("button");
                outerBullButton.textContent = "Outer Bull";
                outerBullButton.addEventListener("click", () => {
                    game.handleBullHit(2);
                    playHitSound(2);
                    renderApp(game, actions);
                });

                const innerBullButton = document.createElement("button");
                innerBullButton.textContent = "Inner Bull";
                innerBullButton.addEventListener("click", () => {
                    game.handleBullHit(3);
                    playHitSound(3);
                    renderApp(game, actions);
                });

                buttonRow.appendChild(outerBullButton);
                buttonRow.appendChild(innerBullButton);
            }
        }

        row.appendChild(topRow);

        if (isActivePlayer) {
            const turnInfoPanel = document.createElement("div");
            turnInfoPanel.classList.add("turn-info-panel");

            const throwsLine = document.createElement("div");
            throwsLine.classList.add("turn-info-throws");
            throwsLine.textContent =
                game.currentTurnThrows.length === 0
                    ? "No throws yet"
                    : game.currentTurnThrows.join(" • ");

            turnInfoPanel.appendChild(throwsLine);
            row.appendChild(turnInfoPanel);
        }

        row.appendChild(buttonRow);
        gameBoard.appendChild(row);
    });

    if (game.winner) {
        if (lastWinnerSoundName !== game.winner.name) {
            playWinnerSound();
            lastWinnerSoundName = game.winner.name;
        }

        const winnerCelebration = document.createElement("div");
        winnerCelebration.classList.add("winner-celebration");

        winnerCelebration.innerHTML = `
            <div class="firework firework-1"></div>
            <div class="firework firework-2"></div>
            <div class="firework firework-3"></div>

            <div class="winner-title">🎉 Winner!</div>
            <div class="winner-name">${game.winner.name}</div>
        `;

        const winnerActions = document.createElement("div");
        winnerActions.classList.add("winner-actions");

        const backToMenuButton = document.createElement("button");
        backToMenuButton.type = "button";
        backToMenuButton.classList.add("winner-menu-button");
        backToMenuButton.textContent = "Back to menu";
        backToMenuButton.addEventListener("click", () => {
            lastWinnerSoundName = null;

            if (typeof resetGameCompletely === "function") {
                resetGameCompletely();
            }

            if (typeof showHomeScreen === "function") {
                showHomeScreen();
            }

            renderApp(game, actions);
        });

        winnerActions.appendChild(backToMenuButton);

        gameBoard.appendChild(winnerCelebration);
        gameBoard.appendChild(winnerActions);
    } else {
        lastWinnerSoundName = null;
    }
}

function getModeDisplayInfo(game) {
    switch (game.gameMode) {
        case "classic":
            return {
                title: "Classic Killer",
                description: "Standard Killer rules."
            };

        case "chaos":
            return {
                title: "Chaos Mode",
                description: "Random modifiers and party chaos."
            };

        case "checkout":
            return {
                title: "121 Checkout",
                description: "Checkout training. Reach exactly 0 within the dart limit."
            };

        case "halveIt":
            return {
                title: "Halve It",
                description: "Number rounds with random challenges. Miss a round and your score is halved."
            };

        case "duel":
            return {
                title: "Duel",
                description: "1v1 HP battle. Hit your opponent's number to deal damage. Bull heals you."
            };

        case "transitArena":
            return {
                title: "Transit Arena",
                description: "Multiplayer HP battle with board-segment power-ups."
            };

        case "drink":
            return {
                title: "Drink Mode",
                description: "Party mode with drink challenges and fun events."
            };

        default:
            return {
                title: "Classic Killer",
                description: "Standard Killer rules."
            };
    }
}

function renderSetupModeBadge(game) {
    const existingBadge = document.getElementById("setupModeBadge");

    if (existingBadge) {
        existingBadge.remove();
    }

    if (!setupPanel) {
        return;
    }

    const titleRow = setupPanel.querySelector(".section-title-row");

    if (!titleRow) {
        return;
    }

    const modeInfo = getModeDisplayInfo(game);

    const badge = document.createElement("div");
    badge.id = "setupModeBadge";
    badge.classList.add("setup-mode-badge");

    badge.innerHTML = `
        <span class="setup-mode-label">Current mode</span>
        <strong>${modeInfo.title}</strong>
        <p>${modeInfo.description}</p>
    `;

    titleRow.insertAdjacentElement("afterend", badge);
}

// =====================================================
// 121 CHECKOUT SETUP
// =====================================================

function renderCheckoutSetup(game, checkoutEngine, actions = {}) {
    if (!gameBoard || !checkoutEngine) {
        return;
    }

    gameBoard.innerHTML = "";

    const settings = checkoutEngine.settings;
    const screen = document.createElement("section");
    screen.classList.add("checkout-setup-screen");

    const card = document.createElement("article");
    card.classList.add("checkout-setup-card");

    const roundLimitText = settings.roundLimit === "infinite" ? "Infinite" : settings.roundLimit;
    const safehouseText = settings.safehouseEnabled
        ? `After check with ${settings.safehouseDartLimit} darts`
        : "Off";

    card.innerHTML = `
        <div class="checkout-setup-header">
            <span class="checkout-mode-badge">121 Checkout</span>
            <h2>Game Setup</h2>
            <p>Choose the rules for this checkout session. Everyone works together on the same target.</p>
        </div>

        <div class="checkout-setup-summary">
            <span>Start: <strong>${settings.startScore}</strong></span>
            <span>Darts: <strong>${settings.maxDarts}</strong></span>
            <span>Rounds: <strong>${roundLimitText}</strong></span>
            <span>Safehouse: <strong>${safehouseText}</strong></span>
        </div>
    `;

    function rerenderWith(partialSettings) {
        checkoutEngine.updateSettings(partialSettings);
        renderCheckoutSetup(game, checkoutEngine, actions);
    }

    function createOptionGroup(title, help, options, activeValue, onSelect) {
        const group = document.createElement("div");
        group.classList.add("checkout-setting-group");

        const header = document.createElement("div");
        header.classList.add("checkout-setting-header");
        header.innerHTML = `
            <h3>${title}</h3>
            ${help ? `<p>${help}</p>` : ""}
        `;

        const row = document.createElement("div");
        row.classList.add("checkout-segment-row");

        options.forEach(option => {
            const button = document.createElement("button");
            button.type = "button";
            button.classList.add("checkout-segment-button");
            if (String(activeValue) === String(option.value)) {
                button.classList.add("active");
            }
            button.innerHTML = option.label;
            button.addEventListener("click", () => onSelect(option.value));
            row.appendChild(button);
        });

        group.appendChild(header);
        group.appendChild(row);
        return group;
    }

    const startScoreGroup = createOptionGroup(
        "Start score",
        "The target you need to checkout first.",
        [
            { value: 121, label: "121" },
            { value: 170, label: "170" }
        ],
        settings.startScore,
        value => rerenderWith({ startScore: Number(value) })
    );

    const customStart = document.createElement("div");
    customStart.classList.add("checkout-custom-row");
    customStart.innerHTML = `
        <label for="checkoutCustomStart">Custom start score</label>
        <input id="checkoutCustomStart" type="number" min="2" max="501" value="${settings.startScore}">
    `;
    customStart.querySelector("input").addEventListener("change", event => {
        const value = Math.max(2, Number(event.target.value) || 121);
        rerenderWith({ startScore: value });
    });
    startScoreGroup.appendChild(customStart);
    card.appendChild(startScoreGroup);

    card.appendChild(createOptionGroup(
        "Maximum amount of darts",
        "The team must checkout within this amount of darts.",
        [3, 6, 9, 12, 15].map(value => ({ value, label: String(value) })),
        settings.maxDarts,
        value => rerenderWith({ maxDarts: Number(value) })
    ));

    card.appendChild(createOptionGroup(
        "Safehouse",
        "A fast checkout can save your progress. On fail you fall back to the last safehouse.",
        [
            { value: "off", label: "Off" },
            { value: 3, label: "After 3 darts" },
            { value: 6, label: "After 6 darts" },
            { value: 9, label: "After 9 darts" }
        ],
        settings.safehouseEnabled ? settings.safehouseDartLimit : "off",
        value => {
            if (value === "off") {
                rerenderWith({ safehouseEnabled: false });
                return;
            }

            rerenderWith({
                safehouseEnabled: true,
                safehouseDartLimit: Number(value)
            });
        }
    ));

    const roundsGroup = createOptionGroup(
        "Number of rounds",
        "Stop after a fixed amount of rounds or play without a limit.",
        [
            { value: 10, label: "10" },
            { value: 25, label: "25" },
            { value: "infinite", label: "Infinite" }
        ],
        settings.roundLimit,
        value => rerenderWith({ roundLimit: value === "infinite" ? "infinite" : Number(value) })
    );

    const customRounds = document.createElement("div");
    customRounds.classList.add("checkout-custom-row");
    customRounds.innerHTML = `
        <label for="checkoutCustomRounds">Custom rounds</label>
        <input id="checkoutCustomRounds" type="number" min="1" max="99" value="${settings.roundLimit === "infinite" ? 25 : settings.roundLimit}">
    `;
    customRounds.querySelector("input").addEventListener("change", event => {
        const value = Math.max(1, Number(event.target.value) || 10);
        rerenderWith({ roundLimit: value });
    });
    roundsGroup.appendChild(customRounds);
    card.appendChild(roundsGroup);

    const increaseGroup = document.createElement("div");
    increaseGroup.classList.add("checkout-setting-group");
    increaseGroup.innerHTML = `
        <div class="checkout-setting-header">
            <h3>Increase on success</h3>
            <p>How much harder the target becomes after a successful checkout.</p>
        </div>
        <div class="checkout-stepper-row">
            <button type="button" class="checkout-stepper-button" data-step="down">−</button>
            <strong>${settings.increaseOnSuccess}</strong>
            <button type="button" class="checkout-stepper-button" data-step="up">+</button>
        </div>
    `;

    increaseGroup.querySelector('[data-step="down"]').addEventListener("click", () => {
        rerenderWith({ increaseOnSuccess: Math.max(1, settings.increaseOnSuccess - 1) });
    });

    increaseGroup.querySelector('[data-step="up"]').addEventListener("click", () => {
        rerenderWith({ increaseOnSuccess: Math.min(25, settings.increaseOnSuccess + 1) });
    });

    card.appendChild(increaseGroup);

    const startButton = document.createElement("button");
    startButton.type = "button";
    startButton.classList.add("checkout-start-button");
    startButton.textContent = "Start 121 Checkout";
    startButton.addEventListener("click", () => {
        if (typeof actions.startCheckoutGame === "function") {
            actions.startCheckoutGame();
        }
    });

    card.appendChild(startButton);
    screen.appendChild(card);
    gameBoard.appendChild(screen);
}

// =====================================================
// 121 CHECKOUT MODE
// =====================================================

let checkoutDartPanelOpen = false;

function resetCheckoutDartPanel() {
    checkoutDartPanelOpen = false;
}

function scrollCheckoutToTop() {
    window.setTimeout(() => {
        const checkoutCard = document.querySelector(".checkout-main-card");
        const fallbackTarget = document.querySelector(".checkout-screen");
        const target = checkoutCard || fallbackTarget;

        if (!target) {
            window.scrollTo({ top: 0, behavior: "auto" });
            return;
        }

        const targetTop = target.getBoundingClientRect().top + window.pageYOffset - 10;
        window.scrollTo({ top: Math.max(targetTop, 0), behavior: "auto" });

        const scrollableParents = [document.documentElement, document.body, gameBoard, gameBoard?.parentElement].filter(Boolean);
        scrollableParents.forEach(parent => {
            if (parent.scrollHeight > parent.clientHeight) {
                parent.scrollTop = Math.max(target.offsetTop - 10, 0);
            }
        });
    }, 0);
}

function groupCheckoutThrowsByPlayer(throws = []) {
    const grouped = [];

    throws.forEach(item => {
        let group = grouped[grouped.length - 1];

        if (!group || group.playerName !== item.playerName) {
            group = {
                playerName: item.playerName,
                darts: []
            };
            grouped.push(group);
        }

        group.darts.push(item);
    });

    return grouped;
}

function createCheckoutThrowsPanel(checkoutEngine) {
    const throwsPanel = document.createElement("div");
    throwsPanel.classList.add("checkout-throws-panel");

    const title = document.createElement("span");
    title.textContent = "This round";
    throwsPanel.appendChild(title);

    if (checkoutEngine.throws.length === 0) {
        const empty = document.createElement("strong");
        empty.textContent = "No darts yet";
        throwsPanel.appendChild(empty);
        return throwsPanel;
    }

    const groups = document.createElement("div");
    groups.classList.add("checkout-throw-groups");

    groupCheckoutThrowsByPlayer(checkoutEngine.throws).forEach(group => {
        const row = document.createElement("div");
        row.classList.add("checkout-throw-player-row");

        const name = document.createElement("div");
        name.classList.add("checkout-throw-player-name");
        name.textContent = group.playerName;

        const darts = document.createElement("div");
        darts.classList.add("checkout-dart-chip-row");

        group.darts.forEach((dart, index) => {
            const chip = document.createElement("span");
            chip.classList.add("checkout-dart-chip");
            chip.textContent = `${index + 1}. ${dart.label}`;
            darts.appendChild(chip);
        });

        row.appendChild(name);
        row.appendChild(darts);
        groups.appendChild(row);
    });

    throwsPanel.appendChild(groups);
    return throwsPanel;
}

function renderCheckoutMode(checkoutEngine, actions = {}) {
    if (!gameBoard || !checkoutEngine) {
        return;
    }

    gameBoard.innerHTML = "";

    if (undoButton) {
        undoButton.classList.add("hidden");
    }

    const screen = document.createElement("section");
    screen.classList.add("checkout-screen");

    const currentPlayer = checkoutEngine.players[checkoutEngine.currentPlayerIndex];
    const playerDartsLeft = Math.max(checkoutEngine.settings.dartsPerPlayerTurn - checkoutEngine.currentPlayerTurnDarts, 0);
    const isInfiniteRoundLimit = checkoutEngine.settings.roundLimit === "infinite";
    const roundLimitText = isInfiniteRoundLimit ? "∞" : checkoutEngine.settings.roundLimit;
    const currentRoundText = isInfiniteRoundLimit
        ? checkoutEngine.round
        : Math.min(checkoutEngine.round, checkoutEngine.settings.roundLimit);
    const undoDisabled = checkoutEngine.history.length === 0 || checkoutEngine.status === "finished";

    // ── MAIN CARD ──────────────────────────────────────────
    const topCard = document.createElement("article");
    topCard.classList.add("checkout-main-card");

    topCard.innerHTML = `
        <div class="checkout-header-bar">
            <span class="checkout-mode-badge">121 Checkout</span>
            <span class="checkout-round-pill">Round ${currentRoundText} / ${roundLimitText}</span>
            <button type="button" class="checkout-undo-button"${undoDisabled ? " disabled" : ""}>↶ Undo</button>
        </div>

        <div class="checkout-score-grid">
            <div class="checkout-score-box">
                <span>Target</span>
                <strong>${checkoutEngine.currentTarget}</strong>
            </div>
            <div class="checkout-score-box checkout-score-box-primary">
                <span>Remaining</span>
                <strong>${checkoutEngine.remainingScore}</strong>
            </div>
            <div class="checkout-score-box checkout-score-box-player">
                <span>Player</span>
                <strong class="checkout-player-pulse"></strong>
            </div>
        </div>
    `;

    topCard.querySelector(".checkout-player-pulse").textContent = currentPlayer ? currentPlayer.name : "–";

    topCard.querySelector(".checkout-undo-button").addEventListener("click", () => {
        checkoutEngine.undo();
        renderCheckoutMode(checkoutEngine, actions);
        scrollCheckoutToTop();
    });

    screen.appendChild(topCard);

    // ── FINISHED SCREEN ────────────────────────────────────
    if (checkoutEngine.status === "finished") {
        const finishedBox = document.createElement("div");
        finishedBox.classList.add("checkout-finished-box");
        finishedBox.innerHTML = `
            <h2>Session finished</h2>
            <p>Rounds are finished.</p>
            <p>Highest completed target: <strong>${checkoutEngine.highestCompletedTarget ?? "None"}</strong></p>
        `;

        const actionWrap = document.createElement("div");
        actionWrap.classList.add("checkout-finished-actions");

        const rematchButton = document.createElement("button");
        rematchButton.type = "button";
        rematchButton.classList.add("checkout-start-button");
        rematchButton.textContent = "Rematch same setup";
        rematchButton.addEventListener("click", () => {
            checkoutDartPanelOpen = false;
            if (typeof actions.startCheckoutGame === "function") {
                actions.startCheckoutGame();
            }
        });

        const menuButton = document.createElement("button");
        menuButton.type = "button";
        menuButton.classList.add("winner-menu-button");
        menuButton.textContent = "Back to main menu";
        menuButton.addEventListener("click", () => {
            checkoutDartPanelOpen = false;
            if (typeof actions.resetGameCompletely === "function") {
                actions.resetGameCompletely();
            }
            if (typeof actions.showHomeScreen === "function") {
                actions.showHomeScreen();
            }
        });

        actionWrap.appendChild(rematchButton);
        actionWrap.appendChild(menuButton);
        finishedBox.appendChild(actionWrap);
        screen.appendChild(finishedBox);

    } else {
        // ── PLAYING ────────────────────────────────────────

        // Route / advice (based on current player's darts left)
        const adviceDartsLeft = Math.max(playerDartsLeft, 1);
        const checkoutAdvice = checkoutEngine.getCurrentAdvice(adviceDartsLeft);
        const ruleNote = document.createElement("div");
        ruleNote.classList.add("checkout-rule-note");
        ruleNote.innerHTML = `<span>${checkoutAdvice.title}</span><strong>${checkoutAdvice.route}</strong>`;
        if (checkoutAdvice.helper) {
            const adviceHelper = document.createElement("small");
            adviceHelper.textContent = checkoutAdvice.helper;
            ruleNote.appendChild(adviceHelper);
        }
        topCard.appendChild(ruleNote);

        // Total score input area
        const totalArea = document.createElement("div");
        totalArea.classList.add("checkout-total-area");

        const totalRow = document.createElement("div");
        totalRow.classList.add("checkout-total-row");

        const totalInput = document.createElement("input");
        totalInput.type = "number";
        totalInput.classList.add("checkout-total-input");
        totalInput.min = "0";
        totalInput.max = "180";
        totalInput.placeholder = "0 – 180";
        totalInput.autocomplete = "off";
        totalInput.inputMode = "numeric";
        totalInput.pattern = "[0-9]*";

        const submitBtn = document.createElement("button");
        submitBtn.type = "button";
        submitBtn.classList.add("checkout-submit-btn");
        submitBtn.textContent = "Submit";

        const handleSubmit = () => {
            const raw = totalInput.value.trim();
            const score = raw === "" ? 0 : Math.max(0, Math.min(180, Math.round(Number(raw) || 0)));
            checkoutEngine.submitTotalScore(score);
            totalInput.value = "";
            renderCheckoutMode(checkoutEngine, actions);
            scrollCheckoutToTop();
        };

        submitBtn.addEventListener("click", handleSubmit);
        totalInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleSubmit();
        });

        totalRow.appendChild(totalInput);
        totalRow.appendChild(submitBtn);
        totalArea.appendChild(totalRow);

        // Quick score shortcuts
        const quickBtns = document.createElement("div");
        quickBtns.classList.add("checkout-quick-btns");
        [0, 26, 41, 60, 100].forEach(val => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.classList.add("checkout-quick-btn");
            btn.textContent = val;
            btn.addEventListener("click", () => {
                totalInput.value = val;
                totalInput.focus();
            });
            quickBtns.appendChild(btn);
        });
        totalArea.appendChild(quickBtns);
        topCard.appendChild(totalArea);

        // Result zone — reserved height so buttons don't jump
        const resultZone = document.createElement("div");
        resultZone.classList.add("checkout-result-zone");

        const shouldShowResult = checkoutEngine.lastResult &&
            (!checkoutEngine.lastResultCreatedAt || Date.now() - checkoutEngine.lastResultCreatedAt < 5000);

        if (shouldShowResult) {
            const resultBox = document.createElement("div");
            resultBox.classList.add("checkout-result-box", `checkout-result-${checkoutEngine.lastResult.type}`);
            resultBox.textContent = checkoutEngine.lastResult.message;
            resultZone.appendChild(resultBox);

            if (checkoutEngine.resultDismissTimer) {
                clearTimeout(checkoutEngine.resultDismissTimer);
            }
            checkoutEngine.resultDismissTimer = setTimeout(() => {
                checkoutEngine.clearLastResult();
                renderCheckoutMode(checkoutEngine, actions);
            }, 5000);
        } else if (checkoutEngine.lastResult) {
            checkoutEngine.clearLastResult();
        }

        topCard.appendChild(resultZone);

        // 3-dart turn visual + compact darts-used counter
        const turnVisual = document.createElement("div");
        turnVisual.classList.add("checkout-turn-visual");

        const dartSlots = document.createElement("div");
        dartSlots.classList.add("checkout-dart-slots");
        for (let i = 0; i < 3; i++) {
            const slot = document.createElement("span");
            slot.classList.add("checkout-dart-slot");
            dartSlots.appendChild(slot);
        }

        const turnLabel = document.createElement("span");
        turnLabel.classList.add("checkout-turn-label");
        turnLabel.textContent = "3-dart turn";

        const dartsCounter = document.createElement("span");
        dartsCounter.classList.add("checkout-darts-counter");
        dartsCounter.textContent = `${checkoutEngine.dartsUsed}/${checkoutEngine.settings.maxDarts} darts`;

        turnVisual.appendChild(dartSlots);
        turnVisual.appendChild(turnLabel);
        turnVisual.appendChild(dartsCounter);
        topCard.appendChild(turnVisual);

        // Lower action buttons
        const lowerActions = document.createElement("div");
        lowerActions.classList.add("checkout-lower-actions");

        const failBtn = document.createElement("button");
        failBtn.type = "button";
        failBtn.classList.add("checkout-fail-btn");
        failBtn.textContent = "Fail / Next round";
        failBtn.addEventListener("click", () => {
            checkoutEngine.failTarget();
            checkoutDartPanelOpen = false;
            renderCheckoutMode(checkoutEngine, actions);
            scrollCheckoutToTop();
        });

        const dartToggleBtn = document.createElement("button");
        dartToggleBtn.type = "button";
        dartToggleBtn.classList.add("checkout-dart-toggle-btn");
        dartToggleBtn.textContent = checkoutDartPanelOpen ? "✕ Close dart input" : "🎯 Dart input";
        dartToggleBtn.addEventListener("click", () => {
            checkoutDartPanelOpen = !checkoutDartPanelOpen;
            renderCheckoutMode(checkoutEngine, actions);
        });

        lowerActions.appendChild(failBtn);
        lowerActions.appendChild(dartToggleBtn);
        topCard.appendChild(lowerActions);

        // ── DART-BY-DART PANEL (collapsible) ───────────────
        if (checkoutDartPanelOpen) {
            const dartPanel = document.createElement("div");
            dartPanel.classList.add("checkout-dart-panel");

            const dartPanelHeader = document.createElement("div");
            dartPanelHeader.classList.add("checkout-dart-panel-header");
            dartPanelHeader.textContent = "Dart-by-dart input";
            dartPanel.appendChild(dartPanelHeader);

            const multiplierRow = document.createElement("div");
            multiplierRow.classList.add("checkout-multiplier-row");

            [
                { value: 1, label: "Single" },
                { value: 2, label: "Double" },
                { value: 3, label: "Triple" }
            ].forEach(item => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.classList.add("checkout-multiplier-button");
                if (checkoutEngine.selectedMultiplier === item.value) {
                    btn.classList.add("active");
                }
                btn.textContent = item.label;
                btn.addEventListener("click", () => {
                    checkoutEngine.selectMultiplier(item.value);
                    renderCheckoutMode(checkoutEngine, actions);
                });
                multiplierRow.appendChild(btn);
            });

            const numberGrid = document.createElement("div");
            numberGrid.classList.add("checkout-number-grid");

            for (let number = 1; number <= 20; number++) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = number;
                btn.addEventListener("click", () => {
                    const selectedMultiplier = checkoutEngine.selectedMultiplier;
                    checkoutEngine.throwNumber(number);
                    checkoutEngine.selectMultiplier(1);
                    playHitSound(selectedMultiplier);
                    renderCheckoutMode(checkoutEngine, actions);
                    scrollCheckoutToTop();
                });
                numberGrid.appendChild(btn);
            }

            const actionRow = document.createElement("div");
            actionRow.classList.add("checkout-action-row");

            const outerBullBtn = document.createElement("button");
            outerBullBtn.type = "button";
            outerBullBtn.textContent = "Outer Bull 25";
            outerBullBtn.addEventListener("click", () => {
                checkoutEngine.throwBull(25);
                checkoutEngine.selectMultiplier(1);
                playHitSound(2);
                renderCheckoutMode(checkoutEngine, actions);
                scrollCheckoutToTop();
            });

            const bullBtn = document.createElement("button");
            bullBtn.type = "button";
            bullBtn.textContent = "Bull 50";
            bullBtn.addEventListener("click", () => {
                checkoutEngine.throwBull(50);
                checkoutEngine.selectMultiplier(1);
                playHitSound(3);
                renderCheckoutMode(checkoutEngine, actions);
                scrollCheckoutToTop();
            });

            const missBtn = document.createElement("button");
            missBtn.type = "button";
            missBtn.classList.add("checkout-miss-button");
            missBtn.textContent = "Miss";
            missBtn.addEventListener("click", () => {
                checkoutEngine.miss();
                checkoutEngine.selectMultiplier(1);
                playMissSound();
                renderCheckoutMode(checkoutEngine, actions);
                scrollCheckoutToTop();
            });

            actionRow.appendChild(outerBullBtn);
            actionRow.appendChild(bullBtn);
            actionRow.appendChild(missBtn);

            dartPanel.appendChild(multiplierRow);
            dartPanel.appendChild(numberGrid);
            dartPanel.appendChild(actionRow);

            screen.appendChild(dartPanel);
        }
    }

    // ── THIS ROUND THROWS ──────────────────────────────────
    if (checkoutEngine.throws.length > 0) {
        screen.appendChild(createCheckoutThrowsPanel(checkoutEngine));
    }

    // ── HISTORY ────────────────────────────────────────────
    if (checkoutEngine.roundHistory.length > 0) {
        const historyPanel = document.createElement("div");
        historyPanel.classList.add("checkout-history-panel");
        historyPanel.innerHTML = `<h3>History</h3>`;

        checkoutEngine.roundHistory.slice(0, 5).forEach(item => {
            const row = document.createElement("div");
            row.classList.add("checkout-history-row", item.result === "success" ? "success" : "failed");
            row.innerHTML = `
                <span>Round ${item.round} • ${item.target}</span>
                <strong>${item.result === "success" ? `Checked in ${item.dartsUsed}` : "Failed"}</strong>
            `;
            historyPanel.appendChild(row);
        });

        screen.appendChild(historyPanel);
    }

    gameBoard.appendChild(screen);
}

function renderDrinkMode(challenge, actions = {}) {
    if (!setupPanel || !gamePanel || !gameBoard) {
        return;
    }

    setupPanel.style.display = "none";
    gamePanel.classList.remove("hidden");

    if (chaosHeader) {
        chaosHeader.classList.add("hidden");
        chaosHeader.style.display = "none";
    }

    if (undoButton) {
        undoButton.disabled = true;
        undoButton.classList.add("hidden");
    }

    if (backToHomeButton) {
        backToHomeButton.textContent = "← Back";
        backToHomeButton.onclick = () => {
            if (typeof actions.onBack === "function") {
                actions.onBack();
            }
        };
    }

    gameBoard.innerHTML = "";

    const screen = document.createElement("section");
    screen.classList.add("drink-mode-screen");

    const card = document.createElement("article");
    card.classList.add("drink-challenge-card");

    const topLine = document.createElement("div");
    topLine.classList.add("drink-card-topline");

    const badge = document.createElement("span");
    badge.classList.add("drink-card-badge");
    badge.textContent = "Dart Drinking Challenge";

    const icon = document.createElement("span");
    icon.classList.add("drink-card-icon");
    icon.textContent = "🍻";

    topLine.appendChild(badge);
    topLine.appendChild(icon);

    const title = document.createElement("h2");
    title.classList.add("drink-card-title");
    title.textContent = challenge ? challenge.title : "No Challenge";

    const description = document.createElement("p");
    description.classList.add("drink-card-description");
    description.textContent = challenge ? challenge.description : "No drinking challenges found.";

    const resultGrid = document.createElement("div");
    resultGrid.classList.add("drink-result-grid");

    const successBox = document.createElement("div");
    successBox.classList.add("drink-result-card", "drink-result-card--success");

    const successLabel = document.createElement("span");
    successLabel.classList.add("drink-result-label");
    successLabel.textContent = "Success";

    const successText = document.createElement("p");
    successText.classList.add("drink-result-text");
    successText.textContent = challenge ? challenge.success : "";

    successBox.appendChild(successLabel);
    successBox.appendChild(successText);

    const failBox = document.createElement("div");
    failBox.classList.add("drink-result-card", "drink-result-card--fail");

    const failLabel = document.createElement("span");
    failLabel.classList.add("drink-result-label");
    failLabel.textContent = "Fail";

    const failText = document.createElement("p");
    failText.classList.add("drink-result-text");
    failText.textContent = challenge ? challenge.fail : "";

    failBox.appendChild(failLabel);
    failBox.appendChild(failText);

    resultGrid.appendChild(successBox);
    resultGrid.appendChild(failBox);

    const doneButton = document.createElement("button");
    doneButton.type = "button";
    doneButton.classList.add("drink-done-button");
    doneButton.textContent = "DONE";

    doneButton.addEventListener("click", () => {
        if (typeof actions.onDone === "function") {
            actions.onDone();
        }
    });

    const note = document.createElement("p");
    note.classList.add("drink-responsible-note");
    note.textContent = "Play responsibly. You can play with any drink.";

    card.appendChild(topLine);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(resultGrid);
    card.appendChild(doneButton);
    card.appendChild(note);

    screen.appendChild(card);
    gameBoard.appendChild(screen);
}

export {
    renderApp,
    renderDrinkMode,
    renderCheckoutMode,
    resetCheckoutDartPanel,
    playerNameInput,
    addPlayerButton,
    startGameButton,
    undoButton,
    backToHomeButton
};