// DOM elementen selecteren
const setupPanel = document.getElementById("setupPanel");
const gamePanel = document.getElementById("gamePanel");
const playerNameInput = document.getElementById("playerName");
const addPlayerButton = document.getElementById("addPlayerBtn");
const startGameButton = document.getElementById("startGameBtn");
const gameBoard = document.getElementById("gameBoard");
const playerList = document.getElementById("playerList");

const undoButton = document.getElementById("undoButton");
const backToHomeButton = document.getElementById("backToHomeButton");

// Kleine sticky chaos header
const chaosHeader = document.getElementById("chaosHeader");
const chaosHeaderTitle = document.getElementById("chaosHeaderTitle");
const chaosInfoButton = document.getElementById("chaosInfoButton");

// Grote chaos intro modal
const chaosIntroModal = document.getElementById("chaosIntroModal");
const chaosIntroTitle = document.getElementById("chaosIntroTitle");
const chaosIntroDescription = document.getElementById("chaosIntroDescription");
const chaosIntroConfirm = document.getElementById("chaosIntroConfirm");
const chaosIntroBackdrop = document.getElementById("chaosIntroBackdrop");

// Kleine info modal
const chaosInfoModal = document.getElementById("chaosInfoModal");
const chaosInfoTitle = document.getElementById("chaosInfoTitle");
const chaosInfoDescription = document.getElementById("chaosInfoDescription");
const chaosInfoClose = document.getElementById("chaosInfoClose");
const chaosInfoBackdrop = document.getElementById("chaosInfoBackdrop");

// 1 centrale render functie
function renderApp(game, actions = {}) {
    renderSetupPanel(game);
    renderGamePanel(game);
    renderSetupPlayers(game, actions);
    renderChaosHeader(game);
    renderGameBoard(game, actions);
    updateUndoButton(game);
    updateBackButton();
    bindChaosInfoButton(game);
    maybeShowChaosIntro(game);
}

// Setup-paneel verbergen zodra het spel gestart is
function renderSetupPanel(game) {
    if (!setupPanel) {
        return;
    }

    if (game.isStarted) {
        setupPanel.style.display = "none";
        return;
    }

    setupPanel.style.display = "block";
}

// Hele spelbord-panel tonen/verbergen
function renderGamePanel(game) {
    if (!gamePanel) {
        return;
    }

    if (game.isStarted) {
        gamePanel.classList.remove("hidden");
    } else {
        gamePanel.classList.add("hidden");
    }
}

// Kleine sticky chaos header tonen
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

// Grote intro popup tonen bij begin van nieuwe chaos beurt
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

// Info knop bovenaan koppelen
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
        chaosInfoModal.classList.remove("hidden");
    };
}

// Kleine info popup sluiten
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

// Voor de lijst van toegevoegde spelers vóór de start
function renderSetupPlayers(game, actions = {}) {
    if (!playerList) {
        return;
    }

    playerList.innerHTML = "";

    game.players.forEach((player, index) => {
        const li = document.createElement("li");
        li.classList.add("player-list-item");

        if (game.numberAssignmentMode === "manual") {
            const card = document.createElement("div");
            card.classList.add("manual-player-card");

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

            const rightSide = document.createElement("div");
            rightSide.classList.add("manual-player-right");

            const numberWrapper = document.createElement("div");
            numberWrapper.classList.add("manual-number-wrapper");

            const label = document.createElement("span");
            label.classList.add("manual-number-label");
            label.textContent = "Nr";

            const manualInput = document.createElement("input");
            manualInput.type = "number";
            manualInput.min = "1";
            manualInput.max = "20";
            manualInput.classList.add("manual-number-input");
            manualInput.placeholder = "1-20";
            manualInput.value = player.manualNumber;

            manualInput.addEventListener("input", event => {
                game.setPlayerManualNumber(index, event.target.value);
            });

            numberWrapper.appendChild(label);
            numberWrapper.appendChild(manualInput);

            const actionButtons = document.createElement("div");
            actionButtons.classList.add("manual-player-actions");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.classList.add("manual-icon-button");
            editButton.textContent = "✎";
            editButton.title = "Naam aanpassen";
            editButton.addEventListener("click", () => {
                const newName = prompt("Nieuwe naam:", player.name);

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
            removeButton.title = "Speler verwijderen";
            removeButton.addEventListener("click", () => {
                game.players.splice(index, 1);
                renderApp(game, actions);
            });

            actionButtons.appendChild(editButton);
            actionButtons.appendChild(removeButton);

            rightSide.appendChild(numberWrapper);
            rightSide.appendChild(actionButtons);

            card.appendChild(leftSide);
            card.appendChild(rightSide);
            li.appendChild(card);
        } else {
            const row = document.createElement("div");
            row.classList.add("manual-player-card");

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

            const actionsWrapper = document.createElement("div");
            actionsWrapper.classList.add("manual-player-actions");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.classList.add("manual-icon-button");
            editButton.textContent = "✎";
            editButton.title = "Naam aanpassen";
            editButton.addEventListener("click", () => {
                const newName = prompt("Nieuwe naam:", player.name);

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
            removeButton.title = "Speler verwijderen";
            removeButton.addEventListener("click", () => {
                game.players.splice(index, 1);
                renderApp(game, actions);
            });

            actionsWrapper.appendChild(editButton);
            actionsWrapper.appendChild(removeButton);

            row.appendChild(leftSide);
            row.appendChild(actionsWrapper);
            li.appendChild(row);
        }

        playerList.appendChild(li);
    });
}

// Undo knop enkel actief maken als er history is
function updateUndoButton(game) {
    if (!undoButton) {
        return;
    }

    undoButton.disabled = game.history.length === 0;
}

function updateBackButton() {
    if (!backToHomeButton) {
        return;
    }

    backToHomeButton.textContent = "← Back";
}

// Scoreblokjes maken met 1 kleur per totale score
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

// Statusbadge maken
function createStatusBadge(player, game) {
    const statusBadge = document.createElement("div");
    statusBadge.classList.add("status-badge");

    if (!player.isAlive) {
        statusBadge.textContent = "Uit";
        statusBadge.classList.add("badge-out");
    } else if (game.winner === player) {
        statusBadge.textContent = "WINNAAR";
        statusBadge.classList.add("badge-winner");
    } else if (player.pendingElimination) {
        statusBadge.textContent = "⚠ Pending";
        statusBadge.classList.add("badge-pending");
    } else if (player.isKiller) {
        statusBadge.textContent = "🎯 Killer";
        statusBadge.classList.add("badge-killer");
    } else if (player.isImmune && game.settings.immunityEnabled && !player.tempIgnoreImmunity) {
        statusBadge.textContent = "Immuun";
        statusBadge.classList.add("badge-immune");
    } else {
        statusBadge.textContent = "Actief";
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

    // Double Trouble: alleen doubles tellen
    if (activeModifier.name === "Double Trouble") {
        return multiplier !== 2;
    }

    return false;
}

// Volledig spelbord renderen
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
        gameBoard.innerHTML = "<p>Nog geen spelers toegevoegd.</p>";
        return;
    }

    game.players.forEach((player, index) => {
        const row = document.createElement("div");
        row.classList.add("game-row");

        const isActivePlayer = game.isStarted && index === game.currentPlayerIndex && player.isAlive && !game.winner;

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
        leftSide.appendChild(createScoreBlocks(player));

        const rightSide = document.createElement("div");
        rightSide.classList.add("game-row-right");

        const statusBadge = createStatusBadge(player, game);
        rightSide.appendChild(statusBadge);

        const extraInfo = document.createElement("div");
        extraInfo.classList.add("extra-info");

        if (isActivePlayer) {
            extraInfo.classList.add("throw-info");

            const throwsText = game.currentTurnThrows.length === 0
                ? "Nog geen worp"
                : game.currentTurnThrows.join(" • ");

            if (player.pendingElimination) {
                extraInfo.textContent = `Score: ${player.score} • ${throwsText}`;
            } else {
                extraInfo.textContent = throwsText;
            }
        } else {
            extraInfo.textContent = `Score: ${player.score}`;
        }

        rightSide.appendChild(extraInfo);

        topRow.appendChild(leftSide);
        topRow.appendChild(rightSide);

        const buttonRow = document.createElement("div");
        buttonRow.classList.add("game-row-buttons");

        if (game.isStarted && !game.winner) {
            const singleButton = document.createElement("button");
            singleButton.textContent = `S ${player.number}`;
            singleButton.disabled = isThrowButtonDisabled(game, 1);
            singleButton.addEventListener("click", () => {
                if (singleButton.disabled) {
                    return;
                }

                game.handleThrow(player.number, 1);
                renderApp(game, actions);
            });

            const doubleButton = document.createElement("button");
            doubleButton.textContent = `D ${player.number}`;
            doubleButton.disabled = isThrowButtonDisabled(game, 2);
            doubleButton.addEventListener("click", () => {
                if (doubleButton.disabled) {
                    return;
                }

                game.handleThrow(player.number, 2);
                renderApp(game, actions);
            });

            const tripleButton = document.createElement("button");
            tripleButton.textContent = `T ${player.number}`;
            tripleButton.disabled = isThrowButtonDisabled(game, 3);
            tripleButton.addEventListener("click", () => {
                if (tripleButton.disabled) {
                    return;
                }

                game.handleThrow(player.number, 3);
                renderApp(game, actions);
            });

            const missButton = document.createElement("button");
            missButton.textContent = "Mis";
            missButton.addEventListener("click", () => {
                game.handleMiss();
                renderApp(game, actions);
            });

            buttonRow.appendChild(singleButton);
            buttonRow.appendChild(doubleButton);
            buttonRow.appendChild(tripleButton);
            buttonRow.appendChild(missButton);
        }

        row.appendChild(topRow);
        row.appendChild(buttonRow);

        gameBoard.appendChild(row);
    });

    if (game.winner) {
        const winnerActions = document.createElement("div");
        winnerActions.classList.add("winner-actions");

        const backToMenuButton = document.createElement("button");
        backToMenuButton.type = "button";
        backToMenuButton.classList.add("winner-menu-button");
        backToMenuButton.textContent = "Back to menu";
        backToMenuButton.addEventListener("click", () => {
            if (typeof resetGameCompletely === "function") {
                resetGameCompletely();
            }

            if (typeof showHomeScreen === "function") {
                showHomeScreen();
            }

            renderApp(game, actions);
        });

        winnerActions.appendChild(backToMenuButton);
        gameBoard.appendChild(winnerActions);
    }
}

export {
    renderApp,
    playerNameInput,
    addPlayerButton,
    startGameButton,
    undoButton,
    backToHomeButton
};