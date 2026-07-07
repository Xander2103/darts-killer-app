// www/halveIt/halveItUi.js

import { makeKeypad } from "../shared/custom-keypad.js";

const setupPanel = document.getElementById("setupPanel");
const gamePanel = document.getElementById("gamePanel");
const gameBoard = document.getElementById("gameBoard");
const undoButton = document.getElementById("undoButton");
const backToHomeButton = document.getElementById("backToHomeButton");

export function renderHalveItMode(halveItGame, actions = {}) {
    if (!setupPanel || !gamePanel || !gameBoard) {
        return;
    }

    setupPanel.style.display = "none";
    gamePanel.classList.remove("hidden");

    if (undoButton) {
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

    const round = actions.getCurrentHalveItRound(halveItGame);
    const player = actions.getCurrentHalveItPlayer(halveItGame);

    const screen = document.createElement("section");
    screen.classList.add("halve-it-screen");

    if (halveItGame.isFinished) {
        screen.appendChild(createFinishedPanel(halveItGame, actions));
        gameBoard.appendChild(screen);
        return;
    }

    if (actions.canUndo) {
        const undoRow = document.createElement("div");
        undoRow.classList.add("halve-it-undo-row");
        const undoBtn = document.createElement("button");
        undoBtn.type = "button";
        undoBtn.classList.add("halve-it-undo-score-btn");
        undoBtn.textContent = "↶ Undo";
        undoBtn.addEventListener("click", () => {
            if (typeof actions.onUndoScore === "function") actions.onUndoScore();
        });
        undoRow.appendChild(undoBtn);
        screen.appendChild(undoRow);
    }

    screen.appendChild(createPlayerContractCard(halveItGame, round, player, actions));
    screen.appendChild(createMiniScoreboard(halveItGame));

    gameBoard.appendChild(screen);
}

function createPlayerContractCard(halveItGame, round, player, actions) {
    const card = document.createElement("article");
    card.classList.add("halve-it-main-card");

    const lastRound = player?.roundScores?.[player.roundScores.length - 1] ?? null;
    const lastResultText = lastRound
        ? lastRound.success
            ? `Last round: +${lastRound.turnScore}`
            : "Last round: failed, score halved"
        : "First turn";

    card.innerHTML = `
        <div class="halve-it-card-top">
            <div>
                <span class="halve-it-mode-label">Halve It</span>
                <h2>${player?.name ?? "Player"}</h2>
            </div>

            <div class="halve-it-round-pill">
                <span>Round</span>
                <strong>${halveItGame.currentRoundIndex + 1}/${halveItGame.rounds.length}</strong>
            </div>
        </div>

        <div class="halve-it-total-score">
            <span>Total score</span>
            <strong>${player?.score ?? 0}</strong>
        </div>

        <div class="halve-it-contract-box">
            <span>Contract</span>
            <h3>${round?.label ?? "Unknown contract"}</h3>
            <p>${round?.description ?? ""}</p>
        </div>

        <div class="halve-it-last-result">
            ${lastResultText}
        </div>

        <p class="halve-it-score-help">Leave empty or enter 0 if the contract failed. Any score above 0 counts as completed.</p>
    `;

    const kp = makeKeypad({
        maxValue: 180,
        maxDigits: 3,
        minValue: 0,
        showMiss: false,
        emptyIsZero: true,
        placeholder: "–",
        submitLabel: "Next",
        onSubmit: (score) => {
            if (typeof actions.onSubmitScore === "function") {
                actions.onSubmitScore(score);
            }
        },
    });
    card.appendChild(kp.el);

    return card;
}

function createMiniScoreboard(halveItGame) {
    const panel = document.createElement("section");
    panel.classList.add("halve-it-mini-scoreboard");

    panel.innerHTML = `<h3>Scoreboard</h3>`;

    halveItGame.players.forEach((player, index) => {
        const row = document.createElement("div");
        row.classList.add("halve-it-score-row");

        if (index === halveItGame.currentPlayerIndex) {
            row.classList.add("active");
        }

        row.innerHTML = `
            <span>${player.name}</span>
            <strong>${player.score}</strong>
        `;

        panel.appendChild(row);
    });

    return panel;
}

function createFinishedPanel(halveItGame, actions) {
    const winner = halveItGame.players[halveItGame.winnerIndex];

    const panel = document.createElement("section");
    panel.classList.add("halve-it-finished-panel");

    panel.innerHTML = `
        <div class="winner-title">🎉 Winner!</div>
        <div class="winner-name">${winner?.name ?? "Unknown"}</div>
        <p>Final score: <strong>${winner?.score ?? 0}</strong></p>
    `;

    const finalScores = document.createElement("div");
    finalScores.classList.add("halve-it-final-scores");

    [...halveItGame.players]
        .sort((a, b) => b.score - a.score)
        .forEach((player, index) => {
            const row = document.createElement("div");
            row.classList.add("halve-it-score-row");

            if (player.isWinner) {
                row.classList.add("winner");
            }

            row.innerHTML = `
                <span>${index + 1}. ${player.name}</span>
                <strong>${player.score}</strong>
            `;

            finalScores.appendChild(row);
        });

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.classList.add("winner-menu-button");
    menuButton.textContent = "Back to main menu";
    menuButton.addEventListener("click", () => {
        if (typeof actions.onBack === "function") {
            actions.onBack();
        }
    });

    panel.appendChild(finalScores);

    if (actions.canUndo) {
        const undoBtn = document.createElement("button");
        undoBtn.type = "button";
        undoBtn.classList.add("halve-it-undo-score-btn");
        undoBtn.textContent = "↶ Undo last round";
        undoBtn.addEventListener("click", () => {
            if (typeof actions.onUndoScore === "function") actions.onUndoScore();
        });
        panel.appendChild(undoBtn);
    }

    panel.appendChild(menuButton);

    return panel;
}