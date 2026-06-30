// www/aroundTheClock/atc-ui.js

const setupPanel = document.getElementById("setupPanel");
const gamePanel = document.getElementById("gamePanel");
const gameBoard = document.getElementById("gameBoard");
const backToHomeButton = document.getElementById("backToHomeButton");

const TOTAL_TARGETS = 21;

function targetLabel(index) {
    if (index === 20) return "Bull";
    if (index < 20) return String(index + 1);
    return "—";
}

let _atcSetup = null;

function freshSetup() {
    return { players: [{ name: "Player 1" }] };
}

export function clearATCSetupState() {
    _atcSetup = null;
}

export function renderATCMode(engine, actions = {}) {
    if (!setupPanel || !gamePanel || !gameBoard) return;
    setupPanel.style.display = "none";
    gamePanel.classList.remove("hidden");

    if (backToHomeButton) {
        backToHomeButton.textContent = "← Back";
        backToHomeButton.onclick = () => {
            if (typeof actions.onBack === "function") actions.onBack();
        };
    }

    gameBoard.innerHTML = "";

    if (engine.status === "setup") {
        if (!_atcSetup) _atcSetup = freshSetup();
        _renderSetup(engine, actions);
    } else if (engine.status === "playing") {
        _renderPlaying(engine, actions);
    } else if (engine.status === "finished") {
        _renderFinished(engine, actions);
    }
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

function _renderSetup(engine, actions) {
    gameBoard.innerHTML = "";
    const s = _atcSetup;
    const reRender = () => renderATCMode(engine, actions);

    const screen = _screen();

    // Header
    const headerCard = _card();
    const badge = document.createElement("span");
    badge.className = "atc-mode-badge";
    badge.textContent = "Around the Clock";
    const desc = document.createElement("p");
    desc.className = "atc-setup-desc";
    desc.textContent = "Hit 1 to 20 in order, then Bull. Single +1, Double +2, Triple +3 targets.";
    headerCard.appendChild(badge);
    headerCard.appendChild(desc);
    screen.appendChild(headerCard);

    // Players card with reorder arrows
    const playersCard = _card();
    playersCard.appendChild(_sectionTitle(`Players (${s.players.length})`));

    const list = document.createElement("ul");
    list.className = "atc-player-list";

    // inputRefs lets us flush live DOM values to s.players before any mutation.
    // On mobile, blur (not input) fires when a button is tapped while an input has
    // focus, so the input event may not have committed the latest typed value yet.
    const inputRefs = [];

    s.players.forEach((p, i) => {
        const item = document.createElement("li");
        item.className = "atc-player-item";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "atc-player-name-input";
        input.placeholder = `Player ${i + 1}`;
        input.value = p.name;
        input.addEventListener("input", e => { s.players[i].name = e.target.value; });
        inputRefs.push(input);

        const rmBtn = document.createElement("button");
        rmBtn.type = "button";
        rmBtn.className = "atc-remove-btn";
        rmBtn.textContent = "✕";
        rmBtn.disabled = s.players.length <= 1;
        rmBtn.title = s.players.length <= 1 ? "Minimum 1 player" : "Remove";
        rmBtn.addEventListener("click", () => {
            inputRefs.forEach((inp, idx) => { if (s.players[idx]) s.players[idx].name = inp.value; });
            s.players.splice(i, 1);
            reRender();
        });

        const upBtn = document.createElement("button");
        upBtn.type = "button";
        upBtn.className = "atc-order-btn";
        upBtn.textContent = "↑";
        upBtn.disabled = i === 0;
        upBtn.title = "Move up";
        upBtn.addEventListener("click", () => {
            inputRefs.forEach((inp, idx) => { if (s.players[idx]) s.players[idx].name = inp.value; });
            [s.players[i - 1], s.players[i]] = [s.players[i], s.players[i - 1]];
            reRender();
        });

        const downBtn = document.createElement("button");
        downBtn.type = "button";
        downBtn.className = "atc-order-btn";
        downBtn.textContent = "↓";
        downBtn.disabled = i === s.players.length - 1;
        downBtn.title = "Move down";
        downBtn.addEventListener("click", () => {
            inputRefs.forEach((inp, idx) => { if (s.players[idx]) s.players[idx].name = inp.value; });
            [s.players[i], s.players[i + 1]] = [s.players[i + 1], s.players[i]];
            reRender();
        });

        item.appendChild(input);
        item.appendChild(rmBtn);
        item.appendChild(upBtn);
        item.appendChild(downBtn);
        list.appendChild(item);
    });
    playersCard.appendChild(list);

    if (s.players.length < 8) {
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "atc-add-btn";
        addBtn.textContent = "+ Add Player";
        addBtn.addEventListener("click", () => {
            inputRefs.forEach((inp, idx) => { if (s.players[idx]) s.players[idx].name = inp.value; });
            s.players.push({ name: `Player ${s.players.length + 1}` });
            reRender();
        });
        playersCard.appendChild(addBtn);
    }
    screen.appendChild(playersCard);

    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "atc-start-btn";
    startBtn.textContent = "▶ Start Game";
    startBtn.addEventListener("click", () => {
        inputRefs.forEach((inp, idx) => { if (s.players[idx]) s.players[idx].name = inp.value; });
        const names = s.players.map((p, idx) => p.name.trim() || `Player ${idx + 1}`);
        if (typeof actions.onStart === "function") actions.onStart(names);
    });
    screen.appendChild(startBtn);

    gameBoard.appendChild(screen);
}

// ─── PLAYING ──────────────────────────────────────────────────────────────────

function _renderPlaying(engine, actions) {
    const player = engine.getCurrentPlayer();
    if (!player) return;

    const curTarget = targetLabel(player.targetIndex);
    const screen = _screen();

    // Top row: undo
    const topRow = document.createElement("div");
    topRow.className = "atc-top-row";
    const undoBtn = document.createElement("button");
    undoBtn.type = "button";
    undoBtn.className = "atc-undo-btn";
    undoBtn.textContent = "↶ Undo";
    undoBtn.disabled = engine.history.length === 0;
    undoBtn.addEventListener("click", () => {
        engine.undo();
        if (typeof actions.onRender === "function") actions.onRender();
    });
    topRow.appendChild(undoBtn);
    screen.appendChild(topRow);

    // Current player card
    const playerCard = _card("atc-player-card");
    playerCard.appendChild(_sectionTitle("Current Player"));
    const pName = document.createElement("h2");
    pName.className = "atc-player-name";
    pName.textContent = player.name;

    const dartsRow = document.createElement("div");
    dartsRow.className = "atc-darts-row";
    for (let i = 0; i < 3; i++) {
        const pip = document.createElement("span");
        pip.className = "atc-dart-pip" + (i < engine.dartsThisTurn ? " used" : "");
        dartsRow.appendChild(pip);
    }
    playerCard.appendChild(pName);
    playerCard.appendChild(dartsRow);
    screen.appendChild(playerCard);

    // Target card
    const targetCard = _card("atc-target-card");
    targetCard.appendChild(_sectionTitle("Current Target"));
    const tBig = document.createElement("div");
    tBig.className = "atc-target-big";
    tBig.textContent = curTarget;
    const progText = document.createElement("p");
    progText.className = "atc-progress-text";
    progText.textContent = `${player.targetIndex} / ${TOTAL_TARGETS} completed`;
    const bar = document.createElement("div");
    bar.className = "atc-progress-bar";
    const fill = document.createElement("div");
    fill.className = "atc-progress-fill";
    fill.style.width = `${Math.round((player.targetIndex / TOTAL_TARGETS) * 100)}%`;
    bar.appendChild(fill);
    targetCard.appendChild(tBig);
    targetCard.appendChild(progText);
    targetCard.appendChild(bar);
    screen.appendChild(targetCard);

    // Input card — Single / Double / Triple / Miss
    const inputCard = _card("atc-input-card");
    inputCard.appendChild(_sectionTitle(`Dart ${engine.dartsThisTurn + 1} of 3 — target: ${curTarget}`));

    const btnRow = document.createElement("div");
    btnRow.className = "atc-hit-row";

    const hitTypes = [
        { label: "Single", multiplier: 1 },
        { label: "Double", multiplier: 2 },
        { label: "Triple", multiplier: 3 }
    ];

    hitTypes.forEach(({ label, multiplier }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "atc-hit-type-btn";
        btn.textContent = label;
        btn.addEventListener("click", () => {
            engine.throwDart(multiplier);
            if (typeof actions.onRender === "function") actions.onRender();
        });
        btnRow.appendChild(btn);
    });

    const missBtn = document.createElement("button");
    missBtn.type = "button";
    missBtn.className = "atc-miss-btn";
    missBtn.textContent = "✗ Miss";
    missBtn.addEventListener("click", () => {
        engine.throwDart(0);
        if (typeof actions.onRender === "function") actions.onRender();
    });

    inputCard.appendChild(btnRow);
    inputCard.appendChild(missBtn);

    const endTurnBtn = document.createElement("button");
    endTurnBtn.type = "button";
    endTurnBtn.className = "atc-end-turn-btn";
    endTurnBtn.textContent = "End Turn Early";
    endTurnBtn.addEventListener("click", () => {
        engine.endTurnEarly();
        if (typeof actions.onRender === "function") actions.onRender();
    });
    inputCard.appendChild(endTurnBtn);
    screen.appendChild(inputCard);

    // Standings
    const standCard = _card();
    standCard.appendChild(_sectionTitle("Players"));
    engine.players.forEach((p, i) => {
        const row = document.createElement("div");
        row.className = "atc-standing-row" + (i === engine.currentPlayerIndex ? " atc-standing-active" : "");

        const nameEl = document.createElement("span");
        nameEl.className = "atc-standing-name";
        nameEl.textContent = p.name;

        const targEl = document.createElement("span");
        targEl.className = "atc-standing-target";
        targEl.textContent = `→ ${targetLabel(p.targetIndex)} (${p.targetIndex}/${TOTAL_TARGETS})`;

        const dartsEl = document.createElement("span");
        dartsEl.className = "atc-standing-darts";
        dartsEl.textContent = `${p.dartsThrown}🎯`;

        row.appendChild(nameEl);
        row.appendChild(targEl);
        row.appendChild(dartsEl);
        standCard.appendChild(row);
    });
    screen.appendChild(standCard);

    gameBoard.appendChild(screen);
}

// ─── FINISHED ─────────────────────────────────────────────────────────────────

function _renderFinished(engine, actions) {
    const winner = engine.players[engine.winnerIndex];
    const screen = _screen();
    const card = _card("atc-winner-card");

    const badge = document.createElement("span");
    badge.className = "atc-mode-badge";
    badge.textContent = "Around the Clock";

    const emojiEl = document.createElement("div");
    emojiEl.className = "atc-winner-emoji";
    emojiEl.textContent = "🎯";

    const titleEl = document.createElement("h2");
    titleEl.className = "atc-winner-title";
    titleEl.textContent = winner ? `${winner.name} wins!` : "Game Over";

    const statsEl = document.createElement("p");
    statsEl.className = "atc-winner-stats";
    statsEl.textContent = winner ? `Completed in ${winner.dartsThrown} darts` : "";

    card.appendChild(badge);
    card.appendChild(emojiEl);
    card.appendChild(titleEl);
    card.appendChild(statsEl);

    if (engine.players.length > 1) {
        card.appendChild(_sectionTitle("Results"));
        const sorted = [...engine.players].sort((a, b) => {
            if (b.targetIndex !== a.targetIndex) return b.targetIndex - a.targetIndex;
            return a.dartsThrown - b.dartsThrown;
        });
        sorted.forEach((p, rank) => {
            const row = document.createElement("div");
            row.className = "atc-result-row";
            row.textContent = `${rank + 1}. ${p.name} — ${p.targetIndex}/${TOTAL_TARGETS} targets (${p.dartsThrown} darts)`;
            card.appendChild(row);
        });
    }

    const rematchBtn = document.createElement("button");
    rematchBtn.type = "button";
    rematchBtn.className = "atc-start-btn";
    rematchBtn.textContent = "Play Again";
    rematchBtn.addEventListener("click", () => {
        if (typeof actions.onRematch === "function") actions.onRematch();
    });

    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.className = "atc-end-turn-btn";
    menuBtn.textContent = "Back to Menu";
    menuBtn.addEventListener("click", () => {
        if (typeof actions.onBackToMenu === "function") actions.onBackToMenu();
    });

    card.appendChild(rematchBtn);
    card.appendChild(menuBtn);
    screen.appendChild(card);
    gameBoard.appendChild(screen);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function _screen() {
    const d = document.createElement("div");
    d.className = "atc-screen";
    return d;
}

function _card(extraClass) {
    const d = document.createElement("div");
    d.className = "atc-card" + (extraClass ? " " + extraClass : "");
    return d;
}

function _sectionTitle(text) {
    const p = document.createElement("p");
    p.className = "atc-section-title";
    p.textContent = text;
    return p;
}
