// www/cricket/cricket-ui.js

const setupPanel = document.getElementById("setupPanel");
const gamePanel = document.getElementById("gamePanel");
const gameBoard = document.getElementById("gameBoard");
const backToHomeButton = document.getElementById("backToHomeButton");

const TARGET_LABEL_SHORT = {
    20: "20", 19: "19", 18: "18", 17: "17", 16: "16", 15: "15",
    14: "14", 13: "13", 12: "12", 11: "11", 10: "10",
    "bull": "Bull"
};

function marksSymbol(marks) {
    if (marks <= 0) return "";
    if (marks === 1) return "/";
    if (marks === 2) return "×";
    return "⊙"; // closed (3+)
}

let _cricketSetup = null;
// Persistent multiplier selection — resets to 1 after each dart
let _selectedMultiplier = 1;

function freshSetup() {
    return { players: [{ name: "Player 1" }, { name: "Player 2" }], variant: "standard" };
}

export function clearCricketSetupState() {
    _cricketSetup = null;
    _selectedMultiplier = 1;
}

export function renderCricketMode(engine, actions = {}) {
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
        if (!_cricketSetup) _cricketSetup = freshSetup();
        _selectedMultiplier = 1;
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
    const s = _cricketSetup;
    const reRender = () => renderCricketMode(engine, actions);

    const screen = _screen();

    const headerCard = _card();
    const badge = document.createElement("span");
    badge.className = "cricket-mode-badge";
    badge.textContent = "Cricket";
    const desc = document.createElement("p");
    desc.className = "cricket-setup-desc";
    desc.textContent = "Close targets from 20 down to 15 (Standard) or 10 (Extended), plus Bull. O.Bull = 1 mark, I.Bull = 2 marks.";
    headerCard.appendChild(badge);
    headerCard.appendChild(desc);
    screen.appendChild(headerCard);

    // Variant selector card
    const variantCard = _card();
    variantCard.appendChild(_sectionTitle("Cricket Version"));
    const variantRow = document.createElement("div");
    variantRow.className = "cricket-variant-row";
    [
        { value: "standard", label: "Standard", sub: "20 → 15, Bull" },
        { value: "extended", label: "Extended", sub: "20 → 10, Bull" }
    ].forEach(({ value, label, sub }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cricket-variant-btn" + (s.variant === value ? " cricket-variant-active" : "");
        const nameEl = document.createElement("span");
        nameEl.className = "cricket-variant-label";
        nameEl.textContent = label;
        const subEl = document.createElement("span");
        subEl.className = "cricket-variant-sub";
        subEl.textContent = sub;
        btn.appendChild(nameEl);
        btn.appendChild(subEl);
        btn.addEventListener("click", () => { s.variant = value; reRender(); });
        variantRow.appendChild(btn);
    });
    variantCard.appendChild(variantRow);
    screen.appendChild(variantCard);

    // Players card
    const playersCard = _card();
    playersCard.appendChild(_sectionTitle(`Players (${s.players.length})`));

    const list = document.createElement("ul");
    list.className = "cricket-player-list";

    // inputRefs: flush live DOM values to s.players before any mutation so typed names
    // are not lost when a button tap blurs the input without firing an input event.
    const inputRefs = [];

    s.players.forEach((p, i) => {
        const item = document.createElement("li");
        item.className = "cricket-player-item";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "cricket-player-name-input";
        input.placeholder = `Player ${i + 1}`;
        input.value = p.name;
        input.addEventListener("input", e => { s.players[i].name = e.target.value; });
        inputRefs.push(input);

        const rmBtn = document.createElement("button");
        rmBtn.type = "button";
        rmBtn.className = "cricket-remove-btn";
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
        upBtn.className = "cricket-order-btn";
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
        downBtn.className = "cricket-order-btn";
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

    if (s.players.length < 6) {
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "cricket-add-btn";
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
    startBtn.className = "cricket-start-btn";
    startBtn.textContent = "▶ Start Game";
    startBtn.addEventListener("click", () => {
        inputRefs.forEach((inp, idx) => { if (s.players[idx]) s.players[idx].name = inp.value; });
        const names = s.players.map((p, i) => p.name.trim() || `Player ${i + 1}`);
        if (typeof actions.onStart === "function") actions.onStart(names, s.variant);
    });
    screen.appendChild(startBtn);

    gameBoard.appendChild(screen);
}

// ─── PLAYING ──────────────────────────────────────────────────────────────────

function _renderPlaying(engine, actions) {
    const player = engine.getCurrentPlayer();
    if (!player) return;

    const targets = engine.targets();
    const regularTargets = targets.filter(t => t !== "bull");
    const hasBull = targets.includes("bull");
    const screen = _screen();

    // Top row: undo
    const topRow = document.createElement("div");
    topRow.className = "cricket-top-row";
    const undoBtn = document.createElement("button");
    undoBtn.type = "button";
    undoBtn.className = "cricket-undo-btn";
    undoBtn.textContent = "↶ Undo";
    undoBtn.disabled = engine.history.length === 0;
    undoBtn.addEventListener("click", () => {
        _selectedMultiplier = 1;
        engine.undo();
        if (typeof actions.onRender === "function") actions.onRender();
    });
    topRow.appendChild(undoBtn);
    screen.appendChild(topRow);

    // Current player banner: name + score (left), dart pips + count (right)
    const banner = document.createElement("div");
    banner.className = "cricket-player-banner";

    const bannerLeft = document.createElement("div");
    bannerLeft.className = "cricket-banner-left";
    const bannerName = document.createElement("span");
    bannerName.className = "cricket-banner-name";
    bannerName.textContent = player.name;
    bannerLeft.appendChild(bannerName);
    if (engine.players.length > 1) {
        const bannerScore = document.createElement("span");
        bannerScore.className = "cricket-banner-score";
        bannerScore.textContent = `${player.points} pts`;
        bannerLeft.appendChild(bannerScore);
    }

    const bannerRight = document.createElement("div");
    bannerRight.className = "cricket-banner-right";
    const dartPips = document.createElement("span");
    dartPips.className = "cricket-dart-pips";
    for (let i = 0; i < 3; i++) {
        const pip = document.createElement("span");
        pip.className = "cricket-dart-pip" + (i < engine.dartsThisTurn ? " used" : "");
        dartPips.appendChild(pip);
    }
    const dartsLeft = 3 - engine.dartsThisTurn;
    const bannerDarts = document.createElement("span");
    bannerDarts.className = "cricket-banner-darts";
    bannerDarts.textContent = `${dartsLeft} dart${dartsLeft !== 1 ? "s" : ""} left`;
    bannerRight.appendChild(dartPips);
    bannerRight.appendChild(bannerDarts);

    banner.appendChild(bannerLeft);
    banner.appendChild(bannerRight);
    screen.appendChild(banner);

    // Scoreboard
    const sbCard = _card("cricket-scoreboard-card");
    sbCard.appendChild(_sectionTitle("Scoreboard"));
    sbCard.appendChild(_buildScoreboard(engine, targets));
    screen.appendChild(sbCard);

    // Input card
    const inputCard = _card("cricket-input-card");

    // Multiplier selector
    inputCard.appendChild(_sectionTitle("Multiplier"));
    const multRow = document.createElement("div");
    multRow.className = "cricket-mult-selector";
    [
        { label: "Single", value: 1 },
        { label: "Double", value: 2 },
        { label: "Triple", value: 3 }
    ].forEach(({ label, value }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cricket-mult-sel-btn" + (_selectedMultiplier === value ? " active" : "");
        btn.textContent = label;
        btn.addEventListener("click", () => {
            _selectedMultiplier = value;
            if (typeof actions.onRender === "function") actions.onRender();
        });
        multRow.appendChild(btn);
    });
    inputCard.appendChild(multRow);

    // Regular target buttons (numbers only, no bull)
    inputCard.appendChild(_sectionTitle("Target"));
    const targetGrid = document.createElement("div");
    targetGrid.className = "cricket-target-grid";
    regularTargets.forEach(t => {
        const allClosed = engine.isTargetClosedByAll(t);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cricket-target-btn";
        if (allClosed) btn.classList.add("all-closed");
        btn.textContent = TARGET_LABEL_SHORT[t] ?? String(t);
        if (allClosed) {
            btn.disabled = true;
        } else {
            btn.addEventListener("click", () => {
                const mult = _selectedMultiplier;
                _selectedMultiplier = 1;
                engine.throwDart(t, mult);
                if (typeof actions.onRender === "function") actions.onRender();
            });
        }
        targetGrid.appendChild(btn);
    });
    inputCard.appendChild(targetGrid);

    // Bull buttons: O.Bull = 1 mark, I.Bull = 2 marks (both target "bull" at 25 pts/mark)
    if (hasBull) {
        const bullClosed = engine.isTargetClosedByAll("bull");
        const bullRow = document.createElement("div");
        bullRow.className = "cricket-bull-row";
        [{ label: "O.Bull", bullMarks: 1 }, { label: "I.Bull", bullMarks: 2 }].forEach(({ label, bullMarks }) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "cricket-target-btn cricket-target-btn-bull";
            if (bullClosed) btn.classList.add("all-closed");
            btn.textContent = label;
            if (bullClosed) {
                btn.disabled = true;
            } else {
                btn.addEventListener("click", () => {
                    _selectedMultiplier = 1;
                    engine.throwDart("bull", bullMarks);
                    if (typeof actions.onRender === "function") actions.onRender();
                });
            }
            bullRow.appendChild(btn);
        });
        inputCard.appendChild(bullRow);
    }

    // Miss button
    const missBtn = document.createElement("button");
    missBtn.type = "button";
    missBtn.className = "cricket-miss-btn";
    missBtn.textContent = "✗ Miss";
    missBtn.addEventListener("click", () => {
        _selectedMultiplier = 1;
        engine.miss();
        if (typeof actions.onRender === "function") actions.onRender();
    });
    inputCard.appendChild(missBtn);

    // End Turn button
    const endTurnBtn = document.createElement("button");
    endTurnBtn.type = "button";
    endTurnBtn.className = "cricket-end-turn-btn";
    endTurnBtn.textContent = "End Turn";
    endTurnBtn.addEventListener("click", () => {
        _selectedMultiplier = 1;
        engine.endTurnEarly();
        if (typeof actions.onRender === "function") actions.onRender();
    });
    inputCard.appendChild(endTurnBtn);

    screen.appendChild(inputCard);
    gameBoard.appendChild(screen);

    // Auto-scroll: center active player column in scoreboard, then keep input visible
    requestAnimationFrame(() => {
        const activeTh = gameBoard.querySelector("th.cricket-active-player");
        if (activeTh) activeTh.scrollIntoView({ inline: "center", block: "nearest" });
        inputCard.scrollIntoView({ block: "nearest" });
    });
}

function _buildScoreboard(engine, targets) {
    const table = document.createElement("table");
    table.className = "cricket-table";

    // Header: target col + player cols
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const emptyTh = document.createElement("th");
    emptyTh.className = "cricket-th-target";
    headerRow.appendChild(emptyTh);
    engine.players.forEach((p, i) => {
        const th = document.createElement("th");
        th.className = "cricket-th-player" + (i === engine.currentPlayerIndex ? " cricket-active-player" : "");
        th.textContent = p.name;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Target rows
    const tbody = document.createElement("tbody");
    targets.forEach(t => {
        const allClosed = engine.isTargetClosedByAll(t);
        const tr = document.createElement("tr");
        if (allClosed) tr.classList.add("cricket-row-all-closed");

        const tdTarget = document.createElement("td");
        tdTarget.className = "cricket-td-target";
        tdTarget.textContent = TARGET_LABEL_SHORT[t] ?? String(t);
        tr.appendChild(tdTarget);

        engine.players.forEach((p, i) => {
            const td = document.createElement("td");
            td.className = "cricket-td-marks" + (i === engine.currentPlayerIndex ? " cricket-active-player" : "");
            const marks = p.marks[t] ?? 0;
            const sym = document.createElement("span");
            sym.className = "cricket-marks-sym cricket-marks-" + Math.min(marks, 3);
            sym.textContent = marksSymbol(marks);
            td.appendChild(sym);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Points row (solo mode: no points row)
    if (engine.players.length > 1) {
        const tfoot = document.createElement("tfoot");
        const pointsRow = document.createElement("tr");
        const ptLabel = document.createElement("td");
        ptLabel.className = "cricket-td-target cricket-points-label";
        ptLabel.textContent = "Pts";
        pointsRow.appendChild(ptLabel);
        engine.players.forEach((p, i) => {
            const td = document.createElement("td");
            td.className = "cricket-td-points" + (i === engine.currentPlayerIndex ? " cricket-active-player" : "");
            td.textContent = String(p.points);
            pointsRow.appendChild(td);
        });
        tfoot.appendChild(pointsRow);
        table.appendChild(tfoot);
    }

    return table;
}

// ─── FINISHED ─────────────────────────────────────────────────────────────────

function _renderFinished(engine, actions) {
    const winner = engine.players[engine.winnerIndex];
    const solo = engine.players.length === 1;
    const targets = engine.targets();
    const screen = _screen();
    const card = _card("cricket-winner-card");

    const badge = document.createElement("span");
    badge.className = "cricket-mode-badge";
    badge.textContent = "Cricket";

    const emojiEl = document.createElement("div");
    emojiEl.className = "cricket-winner-emoji";
    emojiEl.textContent = solo ? "✅" : "🏆";

    const titleEl = document.createElement("h2");
    titleEl.className = "cricket-winner-title";
    if (solo) {
        titleEl.textContent = "All targets closed!";
    } else {
        titleEl.textContent = winner ? `${winner.name} wins!` : "Game Over";
    }

    const statsEl = document.createElement("p");
    statsEl.className = "cricket-winner-stats";
    if (solo && winner) {
        statsEl.textContent = `${targets.length} targets closed`;
    } else if (winner && !solo) {
        statsEl.textContent = `${winner.points} points`;
    }

    card.appendChild(badge);
    card.appendChild(emojiEl);
    card.appendChild(titleEl);
    card.appendChild(statsEl);

    if (!solo) {
        card.appendChild(_sectionTitle("Final Scores"));
        const sorted = [...engine.players].sort((a, b) => b.points - a.points);
        sorted.forEach((p, rank) => {
            const row = document.createElement("div");
            row.className = "cricket-result-row";
            const closedCount = targets.filter(t => (p.marks[t] ?? 0) >= 3).length;
            row.textContent = `${rank + 1}. ${p.name} — ${p.points} pts (${closedCount}/${targets.length} closed)`;
            card.appendChild(row);
        });
    }

    const rematchBtn = document.createElement("button");
    rematchBtn.type = "button";
    rematchBtn.className = "cricket-start-btn";
    rematchBtn.textContent = "Play Again";
    rematchBtn.addEventListener("click", () => {
        if (typeof actions.onRematch === "function") actions.onRematch();
    });

    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.className = "cricket-end-turn-btn";
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
    d.className = "cricket-screen";
    return d;
}

function _card(extraClass) {
    const d = document.createElement("div");
    d.className = "cricket-card" + (extraClass ? " " + extraClass : "");
    return d;
}

function _sectionTitle(text) {
    const p = document.createElement("p");
    p.className = "cricket-section-title";
    p.textContent = text;
    return p;
}
