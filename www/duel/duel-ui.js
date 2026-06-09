// www/duel/duel-ui.js

const setupPanel = document.getElementById("setupPanel");
const gamePanel = document.getElementById("gamePanel");
const gameBoard = document.getElementById("gameBoard");
const undoButton = document.getElementById("undoButton");
const backToHomeButton = document.getElementById("backToHomeButton");

export function renderDuelMode(duelEngine, actions = {}) {
    if (!setupPanel || !gamePanel || !gameBoard || !duelEngine) return;

    setupPanel.style.display = "none";
    gamePanel.classList.remove("hidden");

    if (undoButton) undoButton.classList.add("hidden");

    if (backToHomeButton) {
        backToHomeButton.textContent = "← Back";
        backToHomeButton.onclick = () => {
            if (typeof actions.onBack === "function") actions.onBack();
        };
    }

    gameBoard.innerHTML = "";

    if (duelEngine.phase === "numberSelection") {
        _renderNumberSelection(duelEngine, actions);
    } else if (duelEngine.phase === "playing") {
        _renderPlaying(duelEngine, actions);
    } else if (duelEngine.phase === "finished") {
        _renderFinished(duelEngine, actions);
    }
}

function _renderNumberSelection(duelEngine, actions) {
    const player = duelEngine.players[duelEngine.numberSelectionIndex];
    if (!player) return;

    const screen = document.createElement("section");
    screen.classList.add("duel-screen");

    const card = document.createElement("article");
    card.classList.add("duel-card", "duel-number-selection-card");

    const badgeRow = document.createElement("div");
    badgeRow.classList.add("duel-badge-row");
    const badge = document.createElement("span");
    badge.classList.add("duel-mode-badge");
    badge.textContent = "Duel";
    badgeRow.appendChild(badge);

    const progress = document.createElement("div");
    progress.classList.add("duel-ns-progress");
    progress.textContent = `Player ${duelEngine.numberSelectionIndex + 1} of ${duelEngine.players.length}`;

    const heading = document.createElement("h2");
    heading.classList.add("duel-ns-name");
    heading.textContent = player.name;

    const help = document.createElement("p");
    help.classList.add("duel-ns-help");
    help.appendChild(document.createTextNode("Throw 1 dart with your non-dominant hand."));
    help.appendChild(document.createElement("br"));
    help.appendChild(document.createTextNode("Enter the number you hit."));

    const input = document.createElement("input");
    input.type = "number";
    input.min = 1;
    input.max = 20;
    input.placeholder = "1–20";
    input.classList.add("duel-number-input");

    const errorBox = document.createElement("div");
    errorBox.classList.add("duel-number-error", "hidden");

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.classList.add("duel-confirm-button");
    confirmBtn.textContent = "Confirm Number";

    const playerList = document.createElement("div");
    playerList.classList.add("duel-ns-list");
    duelEngine.players.forEach((p, i) => {
        const row = document.createElement("div");
        row.classList.add("duel-ns-player");
        if (i === duelEngine.numberSelectionIndex) row.classList.add("current");
        const nameSpan = document.createElement("span");
        nameSpan.textContent = p.name;
        const numSpan = document.createElement("strong");
        numSpan.textContent = p.number !== null ? String(p.number) : (i === duelEngine.numberSelectionIndex ? "Now" : "Waiting");
        row.appendChild(nameSpan);
        row.appendChild(numSpan);
        playerList.appendChild(row);
    });

    function doConfirm() {
        const result = duelEngine.confirmPlayerNumber(input.value);
        if (!result.success) {
            errorBox.textContent = result.message;
            errorBox.classList.remove("hidden");
            input.select();
            return;
        }
        if (typeof actions.onRender === "function") actions.onRender();
    }

    confirmBtn.addEventListener("click", doConfirm);
    input.addEventListener("keydown", e => { if (e.key === "Enter") doConfirm(); });

    card.appendChild(badgeRow);
    card.appendChild(progress);
    card.appendChild(heading);
    card.appendChild(help);
    card.appendChild(input);
    card.appendChild(errorBox);
    card.appendChild(confirmBtn);
    card.appendChild(playerList);

    screen.appendChild(card);
    gameBoard.appendChild(screen);

    input.focus();
}

function _renderPlaying(duelEngine, actions) {
    const screen = document.createElement("section");
    screen.classList.add("duel-screen");

    const currentPlayer = duelEngine.players[duelEngine.currentPlayerIndex];
    const opponentIndex = 1 - duelEngine.currentPlayerIndex;
    const opponent = duelEngine.players[opponentIndex];
    const dartsLeft = duelEngine.settings.dartsPerTurn - duelEngine.dartsThisTurn;

    // ── TOP CARD ─────────────────────────────────────────────
    const topCard = document.createElement("article");
    topCard.classList.add("duel-card", "duel-main-card");

    // Title row: [DUEL badge]  [↶ Undo]
    const titleRow = document.createElement("div");
    titleRow.classList.add("duel-title-row");

    const modeBadge = document.createElement("span");
    modeBadge.classList.add("duel-mode-badge");
    modeBadge.textContent = "Duel";

    const undoBtn = document.createElement("button");
    undoBtn.type = "button";
    undoBtn.classList.add("duel-undo-button");
    undoBtn.textContent = "↶ Undo";
    undoBtn.disabled = duelEngine.history.length === 0;
    undoBtn.addEventListener("click", () => {
        if (typeof actions.onUndo === "function") actions.onUndo();
    });

    titleRow.appendChild(modeBadge);
    titleRow.appendChild(undoBtn);
    topCard.appendChild(titleRow);

    // HP section — both players side by side with VS between
    const hpSection = document.createElement("div");
    hpSection.classList.add("duel-hp-section");

    duelEngine.players.forEach((player, i) => {
        const isActive = i === duelEngine.currentPlayerIndex;
        const pcard = document.createElement("div");
        pcard.classList.add("duel-player-hp-card");
        if (isActive) {
            pcard.classList.add("active");
        } else {
            pcard.classList.add("inactive");
        }

        const nameRow = document.createElement("div");
        nameRow.classList.add("duel-player-name-row");
        const nameSpan = document.createElement("span");
        nameSpan.classList.add("duel-player-name");
        nameSpan.textContent = player.name;
        nameRow.appendChild(nameSpan);
        if (isActive) {
            const yourTurnBadge = document.createElement("span");
            yourTurnBadge.classList.add("duel-your-turn-badge");
            yourTurnBadge.textContent = "YOUR TURN";
            nameRow.appendChild(yourTurnBadge);
        }
        const numBadge = document.createElement("span");
        numBadge.classList.add("duel-player-number");
        numBadge.textContent = `#${player.number}`;
        nameRow.appendChild(numBadge);

        const hpText = document.createElement("div");
        hpText.classList.add("duel-hp-text");
        if (player.hp <= 0) hpText.classList.add("danger");
        hpText.textContent = `${player.hp} / ${player.maxHp} HP`;

        const hpBarWrap = document.createElement("div");
        hpBarWrap.classList.add("duel-hp-bar-wrap");
        const hpBar = document.createElement("div");
        hpBar.classList.add("duel-hp-bar");
        const pct = Math.max(0, Math.round((player.hp / player.maxHp) * 100));
        hpBar.style.width = `${pct}%`;
        if (player.hp <= 0) {
            hpBar.classList.add("danger");
            hpBarWrap.classList.add("danger");
        } else if (pct <= 30) {
            hpBar.classList.add("low");
        } else if (pct <= 60) {
            hpBar.classList.add("mid");
        }
        hpBarWrap.appendChild(hpBar);

        pcard.appendChild(nameRow);
        pcard.appendChild(hpText);
        pcard.appendChild(hpBarWrap);
        hpSection.appendChild(pcard);
    });

    if (hpSection.children.length >= 2) {
        const vs = document.createElement("div");
        vs.classList.add("duel-vs");
        vs.textContent = "VS";
        hpSection.insertBefore(vs, hpSection.children[1]);
    }

    topCard.appendChild(hpSection);

    // Heal target banner
    if (duelEngine.activeHealTarget !== null) {
        const healCard = document.createElement("div");
        healCard.classList.add("duel-heal-card");
        const healBadge = document.createElement("span");
        healBadge.classList.add("duel-heal-badge");
        healBadge.textContent = "Heal Target Active";
        const healNum = document.createElement("strong");
        healNum.classList.add("duel-heal-number");
        healNum.textContent = duelEngine.activeHealTarget;
        const healDesc = document.createElement("small");
        healDesc.textContent = "S=+1 · D=+2 · T=+3 HP";
        healCard.appendChild(healBadge);
        healCard.appendChild(healNum);
        healCard.appendChild(healDesc);
        topCard.appendChild(healCard);
    }

    // Turn strip
    const turnCard = document.createElement("div");
    turnCard.classList.add("duel-turn-card");
    const turnName = document.createElement("span");
    turnName.textContent = `${currentPlayer.name}'s turn`;
    const turnDarts = document.createElement("strong");
    turnDarts.textContent = `${dartsLeft} dart${dartsLeft === 1 ? "" : "s"} left`;
    turnCard.appendChild(turnName);
    turnCard.appendChild(turnDarts);
    topCard.appendChild(turnCard);

    // Turn throws display
    if (duelEngine.turnThrows.length > 0) {
        const throwsRow = document.createElement("div");
        throwsRow.classList.add("duel-turn-throws");
        duelEngine.turnThrows.forEach(t => {
            const chip = document.createElement("span");
            chip.classList.add("duel-throw-chip");
            if (t.effect === "damage") chip.classList.add("damage");
            else if (t.effect === "heal") chip.classList.add("heal");
            chip.textContent = t.label;
            throwsRow.appendChild(chip);
        });
        topCard.appendChild(throwsRow);
    }

    screen.appendChild(topCard);

    // LAST CHANCE banner
    if (currentPlayer.hp <= 0) {
        const banner = document.createElement("div");
        banner.classList.add("duel-last-chance-banner");
        banner.textContent = "⚠ LAST CHANCE — heal above 0 before your turn ends!";
        screen.appendChild(banner);
    }

    // ── ATTACK SECTION ───────────────────────────────────────
    const attackSection = document.createElement("div");
    attackSection.classList.add("duel-action-section");

    const attackHeader = document.createElement("div");
    attackHeader.classList.add("duel-section-header", "duel-section-header-attack");
    attackHeader.textContent = `Attack ${opponent.name}  ·  #${opponent.number}`;
    attackSection.appendChild(attackHeader);

    const attackGrid = document.createElement("div");
    attackGrid.classList.add("duel-action-grid", "duel-action-grid-3");

    [
        { m: 1, label: `S${opponent.number}`, desc: "−1 HP" },
        { m: 2, label: `D${opponent.number}`, desc: "−2 HP" },
        { m: 3, label: `T${opponent.number}`, desc: "−3 HP" },
    ].forEach(({ m, label, desc }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.classList.add("duel-action-btn", "duel-action-attack");
        const labelSpan = document.createElement("span");
        labelSpan.classList.add("duel-action-label");
        labelSpan.textContent = label;
        const descSpan = document.createElement("span");
        descSpan.classList.add("duel-action-desc");
        descSpan.textContent = desc;
        btn.appendChild(labelSpan);
        btn.appendChild(descSpan);
        btn.addEventListener("click", () => {
            if (typeof actions.onThrowNumber === "function") {
                actions.onThrowNumber(opponent.number, m);
            }
        });
        attackGrid.appendChild(btn);
    });

    attackSection.appendChild(attackGrid);
    screen.appendChild(attackSection);

    // ── HEAL SECTION ─────────────────────────────────────────
    const healSection = document.createElement("div");
    healSection.classList.add("duel-action-section");

    const healHeader = document.createElement("div");
    healHeader.classList.add("duel-section-header", "duel-section-header-heal");
    healHeader.textContent = "Healing";
    healSection.appendChild(healHeader);

    // Outer Bull + Bull 50
    const bullGrid = document.createElement("div");
    bullGrid.classList.add("duel-action-grid", "duel-action-grid-2");

    const outerBullBtn = document.createElement("button");
    outerBullBtn.type = "button";
    outerBullBtn.classList.add("duel-action-btn", "duel-action-heal");
    const obLabel = document.createElement("span");
    obLabel.classList.add("duel-action-label");
    obLabel.textContent = "Outer Bull";
    const obDesc = document.createElement("span");
    obDesc.classList.add("duel-action-desc");
    obDesc.textContent = "+1 HP";
    outerBullBtn.appendChild(obLabel);
    outerBullBtn.appendChild(obDesc);
    outerBullBtn.addEventListener("click", () => {
        if (typeof actions.onOuterBull === "function") actions.onOuterBull();
    });
    bullGrid.appendChild(outerBullBtn);

    const bullBtn = document.createElement("button");
    bullBtn.type = "button";
    bullBtn.classList.add("duel-action-btn", "duel-action-heal");
    const bLabel = document.createElement("span");
    bLabel.classList.add("duel-action-label");
    bLabel.textContent = "Bull 50";
    const bDesc = document.createElement("span");
    bDesc.classList.add("duel-action-desc");
    bDesc.textContent = "+2 HP";
    bullBtn.appendChild(bLabel);
    bullBtn.appendChild(bDesc);
    bullBtn.addEventListener("click", () => {
        if (typeof actions.onBull === "function") actions.onBull();
    });
    bullGrid.appendChild(bullBtn);

    healSection.appendChild(bullGrid);

    // Heal target buttons (if active)
    if (duelEngine.activeHealTarget !== null) {
        const htGrid = document.createElement("div");
        htGrid.classList.add("duel-action-grid", "duel-action-grid-3");

        [
            { m: 1, label: `S${duelEngine.activeHealTarget}`, desc: "+1 HP" },
            { m: 2, label: `D${duelEngine.activeHealTarget}`, desc: "+2 HP" },
            { m: 3, label: `T${duelEngine.activeHealTarget}`, desc: "+3 HP" },
        ].forEach(({ m, label, desc }) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.classList.add("duel-action-btn", "duel-action-heal");
            const labelSpan = document.createElement("span");
            labelSpan.classList.add("duel-action-label");
            labelSpan.textContent = label;
            const descSpan = document.createElement("span");
            descSpan.classList.add("duel-action-desc");
            descSpan.textContent = desc;
            btn.appendChild(labelSpan);
            btn.appendChild(descSpan);
            btn.addEventListener("click", () => {
                if (typeof actions.onThrowNumber === "function") {
                    actions.onThrowNumber(duelEngine.activeHealTarget, m);
                }
            });
            htGrid.appendChild(btn);
        });

        healSection.appendChild(htGrid);
    }

    screen.appendChild(healSection);

    // ── UTILITY SECTION ──────────────────────────────────────
    const utilSection = document.createElement("div");
    utilSection.classList.add("duel-action-section");

    const utilGrid = document.createElement("div");
    utilGrid.classList.add("duel-action-grid", "duel-action-grid-2");

    const missBtn = document.createElement("button");
    missBtn.type = "button";
    missBtn.classList.add("duel-action-btn", "duel-action-miss");
    missBtn.textContent = "Miss";
    missBtn.addEventListener("click", () => {
        if (typeof actions.onMiss === "function") actions.onMiss();
    });
    utilGrid.appendChild(missBtn);

    const nextTurnBtn = document.createElement("button");
    nextTurnBtn.type = "button";
    nextTurnBtn.classList.add("duel-action-btn", "duel-action-next-turn");
    nextTurnBtn.textContent = "Next Turn →";
    nextTurnBtn.addEventListener("click", () => {
        if (typeof actions.onEndTurnEarly === "function") actions.onEndTurnEarly();
    });
    utilGrid.appendChild(nextTurnBtn);

    utilSection.appendChild(utilGrid);
    screen.appendChild(utilSection);

    gameBoard.appendChild(screen);
}

function _renderFinished(duelEngine, actions) {
    const winner = duelEngine.winnerPlayerIndex !== null
        ? duelEngine.players[duelEngine.winnerPlayerIndex]
        : null;

    const screen = document.createElement("section");
    screen.classList.add("duel-screen");

    const card = document.createElement("article");
    card.classList.add("duel-card", "duel-finished-card");

    const badgeRow = document.createElement("div");
    badgeRow.classList.add("duel-badge-row");
    const badge = document.createElement("span");
    badge.classList.add("duel-mode-badge");
    badge.textContent = "Duel";
    badgeRow.appendChild(badge);

    const winTitle = document.createElement("div");
    winTitle.classList.add("duel-winner-title");
    winTitle.textContent = "Winner!";

    const winName = document.createElement("div");
    winName.classList.add("duel-winner-name");
    winName.textContent = winner ? winner.name : "—";

    const summary = document.createElement("div");
    summary.classList.add("duel-finished-summary");
    duelEngine.players.forEach(p => {
        const row = document.createElement("div");
        row.classList.add("duel-finished-player-row");
        if (winner && p.name === winner.name) row.classList.add("winner");
        const nameSpan = document.createElement("span");
        nameSpan.textContent = p.name;
        const hpSpan = document.createElement("strong");
        hpSpan.textContent = `${p.hp} HP remaining`;
        row.appendChild(nameSpan);
        row.appendChild(hpSpan);
        summary.appendChild(row);
    });

    const actionsDiv = document.createElement("div");
    actionsDiv.classList.add("duel-finished-actions");

    const rematchBtn = document.createElement("button");
    rematchBtn.type = "button";
    rematchBtn.classList.add("duel-start-button");
    rematchBtn.textContent = "Rematch";
    rematchBtn.addEventListener("click", () => {
        if (typeof actions.onRematch === "function") actions.onRematch();
    });

    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.classList.add("winner-menu-button");
    menuBtn.textContent = "Back to main menu";
    menuBtn.addEventListener("click", () => {
        if (typeof actions.onBackToMenu === "function") actions.onBackToMenu();
    });

    actionsDiv.appendChild(rematchBtn);
    actionsDiv.appendChild(menuBtn);

    card.appendChild(badgeRow);
    card.appendChild(winTitle);
    card.appendChild(winName);
    card.appendChild(summary);
    card.appendChild(actionsDiv);

    screen.appendChild(card);
    gameBoard.appendChild(screen);
}
