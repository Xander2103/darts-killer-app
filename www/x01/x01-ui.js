// www/x01/x01-ui.js

const setupPanel = document.getElementById("setupPanel");
const gamePanel = document.getElementById("gamePanel");
const gameBoard = document.getElementById("gameBoard");
const backToHomeButton = document.getElementById("backToHomeButton");

let _setupState = null;
let _inputModeDropdownOpen = false;
let _addPlayerPendingTarget = null; // { type: "individual"|"team", teamIndex: number|null }
let _addPlayerPendingName = "";

function freshSetupState() {
    return {
        startScore: 501,
        customScore: "",
        playType: "individual",
        players: [{ name: "" }, { name: "" }],
        teams: [
            { name: "", players: [{ name: "" }, { name: "" }] },
            { name: "", players: [{ name: "" }, { name: "" }] }
        ],
        legsToWin: 1,
        customLegs: "",
        finishRule: "double",
        checkoutSuggestions: true
    };
}

export function clearX01SetupState() {
    _setupState = null;
    _addPlayerPendingTarget = null;
    _addPlayerPendingName = "";
    _inputModeDropdownOpen = false;
}

export function renderX01Mode(engine, actions = {}) {
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

    switch (engine.status) {
        case "setup":
            if (!_setupState) _setupState = freshSetupState();
            _renderSetup(engine, actions);
            break;
        case "playing":
            _renderGame(engine, actions);
            break;
        case "awaitingDoubleConfirm":
            _renderDoubleConfirm(engine, actions);
            break;
        case "legWon":
            _renderLegWon(engine, actions);
            break;
        case "matchWon":
            _renderMatchWon(engine, actions);
            break;
    }
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

function _renderSetup(engine, actions) {
    // ROOT FIX: always clear before appending so re-renders don't accumulate screens
    gameBoard.innerHTML = "";
    const s = _setupState;

    // reRender calls the top-level dispatcher which clears gameBoard first
    const reRender = () => renderX01Mode(engine, actions);

    const screen = document.createElement("section");
    screen.className = "x01-screen";

    screen.appendChild(_makeStartScoreCard(s, reRender));
    screen.appendChild(_makePlayTypeCard(s, reRender));

    if (s.playType === "individual") {
        screen.appendChild(_makeIndividualPlayersCard(s, reRender));
    } else {
        screen.appendChild(_makeTeamsCard(s, reRender));
    }

    screen.appendChild(_makeMatchSettingsCard(s, reRender));

    const errorDiv = document.createElement("div");
    errorDiv.className = "x01-error-msg";
    errorDiv.id = "x01SetupError";

    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "x01-start-btn";
    startBtn.textContent = "Start Match";
    startBtn.addEventListener("click", () => {
        const config = _buildConfig(s);
        if (!config) return;
        _setupState = null;
        if (typeof actions.onStartMatch === "function") actions.onStartMatch(config);
    });

    screen.appendChild(errorDiv);
    screen.appendChild(startBtn);
    gameBoard.appendChild(screen);

    if (_addPlayerPendingTarget) {
        gameBoard.appendChild(_makeAddPlayerModal(s, reRender));
    }

    // Auto-focus custom inputs after re-render
    if (s.startScore === "Custom") {
        const el = gameBoard.querySelector(".x01-custom-score-input");
        if (el) setTimeout(() => el.focus(), 40);
    } else if (s.legsToWin === "Custom") {
        const el = gameBoard.querySelector(".x01-custom-legs-input");
        if (el) setTimeout(() => el.focus(), 40);
    }
}

function _makeStartScoreCard(s, reRender) {
    const card = document.createElement("div");
    card.className = "x01-section-card";

    const title = document.createElement("p");
    title.className = "x01-section-title";
    title.textContent = "Start Score";
    card.appendChild(title);

    const row = document.createElement("div");
    row.className = "x01-pill-row";

    for (const val of [301, 501, 701, "Custom"]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "x01-pill" + (s.startScore === val ? " active" : "");
        btn.textContent = String(val);
        btn.addEventListener("click", () => {
            s.startScore = val;
            reRender();
        });
        row.appendChild(btn);
    }
    card.appendChild(row);

    if (s.startScore === "Custom") {
        const input = document.createElement("input");
        input.type = "number";
        input.min = "101";
        input.max = "9999";
        input.placeholder = "e.g. 401";
        input.className = "x01-custom-score-input";
        input.value = s.customScore;
        input.addEventListener("input", e => { s.customScore = e.target.value; });
        card.appendChild(input);
    }

    return card;
}

function _makePlayTypeCard(s, reRender) {
    const card = document.createElement("div");
    card.className = "x01-section-card";

    const title = document.createElement("p");
    title.className = "x01-section-title";
    title.textContent = "Play Type";
    card.appendChild(title);

    const row = document.createElement("div");
    row.className = "x01-toggle-row";

    for (const [val, label] of [["individual", "Individual"], ["teams", "Teams"]]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "x01-toggle-btn" + (s.playType === val ? " active" : "");
        btn.textContent = label;
        btn.addEventListener("click", () => {
            s.playType = val;
            reRender();
        });
        row.appendChild(btn);
    }

    card.appendChild(row);
    return card;
}

function _makeIndividualPlayersCard(s, reRender) {
    const card = document.createElement("div");
    card.className = "x01-section-card";

    const title = document.createElement("p");
    title.className = "x01-section-title";
    title.textContent = `Players (${s.players.length})`;
    card.appendChild(title);

    const list = document.createElement("ul");
    list.className = "x01-player-list";

    s.players.forEach((p, i) => {
        const item = document.createElement("li");
        item.className = "x01-player-item";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "x01-player-name-input";
        input.placeholder = `Player ${i + 1}`;
        input.value = p.name;
        input.addEventListener("input", e => { s.players[i].name = e.target.value; });

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "x01-player-remove-btn";
        removeBtn.textContent = "✕";
        removeBtn.disabled = s.players.length <= 1;
        removeBtn.title = s.players.length <= 1 ? "Minimum 1 player" : "Remove player";
        removeBtn.addEventListener("click", () => {
            s.players.splice(i, 1);
            reRender();
        });

        const upBtn = document.createElement("button");
        upBtn.type = "button";
        upBtn.className = "x01-order-btn";
        upBtn.textContent = "↑";
        upBtn.disabled = i === 0;
        upBtn.title = "Move up";
        upBtn.addEventListener("click", () => {
            const tmp = s.players[i - 1];
            s.players[i - 1] = s.players[i];
            s.players[i] = tmp;
            reRender();
        });

        const downBtn = document.createElement("button");
        downBtn.type = "button";
        downBtn.className = "x01-order-btn";
        downBtn.textContent = "↓";
        downBtn.disabled = i === s.players.length - 1;
        downBtn.title = "Move down";
        downBtn.addEventListener("click", () => {
            const tmp = s.players[i + 1];
            s.players[i + 1] = s.players[i];
            s.players[i] = tmp;
            reRender();
        });

        item.appendChild(input);
        item.appendChild(removeBtn);
        item.appendChild(upBtn);
        item.appendChild(downBtn);
        list.appendChild(item);
    });

    card.appendChild(list);

    if (s.players.length < 12) {
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "x01-add-player-btn";
        addBtn.textContent = "+ Add Player";
        addBtn.addEventListener("click", () => {
            _addPlayerPendingTarget = { type: "individual", teamIndex: null };
            _addPlayerPendingName = "";
            reRender();
        });
        card.appendChild(addBtn);
    }

    return card;
}

function _makeTeamsCard(s, reRender) {
    const card = document.createElement("div");
    card.className = "x01-section-card";

    const title = document.createElement("p");
    title.className = "x01-section-title";
    title.textContent = `Teams (${s.teams.length})`;
    card.appendChild(title);

    s.teams.forEach((team, ti) => {
        const block = document.createElement("div");
        block.className = "x01-team-block";

        const teamHeader = document.createElement("div");
        teamHeader.className = "x01-team-header";

        const teamNameInput = document.createElement("input");
        teamNameInput.type = "text";
        teamNameInput.className = "x01-team-name-input";
        teamNameInput.placeholder = `Team ${ti + 1}`;
        teamNameInput.value = team.name;
        teamNameInput.addEventListener("input", e => { s.teams[ti].name = e.target.value; });

        const teamUpBtn = document.createElement("button");
        teamUpBtn.type = "button";
        teamUpBtn.className = "x01-order-btn";
        teamUpBtn.textContent = "↑";
        teamUpBtn.disabled = ti === 0;
        teamUpBtn.title = "Move team up";
        teamUpBtn.addEventListener("click", () => {
            const tmp = s.teams[ti - 1];
            s.teams[ti - 1] = s.teams[ti];
            s.teams[ti] = tmp;
            reRender();
        });

        const teamDownBtn = document.createElement("button");
        teamDownBtn.type = "button";
        teamDownBtn.className = "x01-order-btn";
        teamDownBtn.textContent = "↓";
        teamDownBtn.disabled = ti === s.teams.length - 1;
        teamDownBtn.title = "Move team down";
        teamDownBtn.addEventListener("click", () => {
            const tmp = s.teams[ti + 1];
            s.teams[ti + 1] = s.teams[ti];
            s.teams[ti] = tmp;
            reRender();
        });

        teamHeader.appendChild(teamNameInput);
        teamHeader.appendChild(teamUpBtn);
        teamHeader.appendChild(teamDownBtn);
        block.appendChild(teamHeader);

        const playerList = document.createElement("ul");
        playerList.className = "x01-player-list";

        team.players.forEach((p, pi) => {
            const item = document.createElement("li");
            item.className = "x01-player-item";

            const input = document.createElement("input");
            input.type = "text";
            input.className = "x01-player-name-input";
            input.placeholder = `Player ${pi + 1}`;
            input.value = p.name;
            input.addEventListener("input", e => { s.teams[ti].players[pi].name = e.target.value; });

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "x01-player-remove-btn";
            removeBtn.textContent = "✕";
            removeBtn.disabled = team.players.length <= 1;
            removeBtn.title = team.players.length <= 1 ? "Minimum 1 player per team" : "Remove player";
            removeBtn.addEventListener("click", () => {
                s.teams[ti].players.splice(pi, 1);
                reRender();
            });

            const playerUpBtn = document.createElement("button");
            playerUpBtn.type = "button";
            playerUpBtn.className = "x01-order-btn";
            playerUpBtn.textContent = "↑";
            playerUpBtn.disabled = pi === 0;
            playerUpBtn.title = "Move player up";
            playerUpBtn.addEventListener("click", () => {
                const tmp = s.teams[ti].players[pi - 1];
                s.teams[ti].players[pi - 1] = s.teams[ti].players[pi];
                s.teams[ti].players[pi] = tmp;
                reRender();
            });

            const playerDownBtn = document.createElement("button");
            playerDownBtn.type = "button";
            playerDownBtn.className = "x01-order-btn";
            playerDownBtn.textContent = "↓";
            playerDownBtn.disabled = pi === team.players.length - 1;
            playerDownBtn.title = "Move player down";
            playerDownBtn.addEventListener("click", () => {
                const tmp = s.teams[ti].players[pi + 1];
                s.teams[ti].players[pi + 1] = s.teams[ti].players[pi];
                s.teams[ti].players[pi] = tmp;
                reRender();
            });

            item.appendChild(input);
            item.appendChild(removeBtn);
            item.appendChild(playerUpBtn);
            item.appendChild(playerDownBtn);
            playerList.appendChild(item);
        });

        block.appendChild(playerList);

        if (team.players.length < 6) {
            const addPlayerBtn = document.createElement("button");
            addPlayerBtn.type = "button";
            addPlayerBtn.className = "x01-add-player-btn";
            addPlayerBtn.textContent = "+ Add Player";
            addPlayerBtn.addEventListener("click", () => {
                _addPlayerPendingTarget = { type: "team", teamIndex: ti };
                _addPlayerPendingName = "";
                reRender();
            });
            block.appendChild(addPlayerBtn);
        }

        card.appendChild(block);
    });

    const teamActionsRow = document.createElement("div");
    teamActionsRow.className = "x01-toggle-row";
    teamActionsRow.style.marginTop = "0.5rem";

    if (s.teams.length < 4) {
        const addTeamBtn = document.createElement("button");
        addTeamBtn.type = "button";
        addTeamBtn.className = "x01-toggle-btn";
        addTeamBtn.textContent = "+ Add Team";
        addTeamBtn.addEventListener("click", () => {
            s.teams.push({ name: "", players: [{ name: "" }] });
            reRender();
        });
        teamActionsRow.appendChild(addTeamBtn);
    }

    if (s.teams.length > 2) {
        const removeTeamBtn = document.createElement("button");
        removeTeamBtn.type = "button";
        removeTeamBtn.className = "x01-toggle-btn";
        removeTeamBtn.textContent = "− Remove Last Team";
        removeTeamBtn.addEventListener("click", () => {
            s.teams.pop();
            reRender();
        });
        teamActionsRow.appendChild(removeTeamBtn);
    }

    if (teamActionsRow.children.length > 0) {
        card.appendChild(teamActionsRow);
    }

    return card;
}

function _makeMatchSettingsCard(s, reRender) {
    const card = document.createElement("div");
    card.className = "x01-section-card";

    const title = document.createElement("p");
    title.className = "x01-section-title";
    title.textContent = "Match Settings";
    card.appendChild(title);

    // Legs to Win
    card.appendChild(_makeSmallLabel("Legs to Win"));

    const legsRow = document.createElement("div");
    legsRow.className = "x01-pill-row";
    legsRow.style.marginBottom = "0.7rem";

    for (const val of [1, 2, 3, 5, "Custom"]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "x01-pill" + (s.legsToWin === val ? " active" : "");
        btn.textContent = String(val);
        btn.addEventListener("click", () => {
            s.legsToWin = val;
            reRender();
        });
        legsRow.appendChild(btn);
    }
    card.appendChild(legsRow);

    if (s.legsToWin === "Custom") {
        const input = document.createElement("input");
        input.type = "number";
        input.min = "1";
        input.max = "99";
        input.placeholder = "e.g. 7";
        input.className = "x01-custom-score-input x01-custom-legs-input";
        input.value = s.customLegs;
        input.style.marginBottom = "0.7rem";
        input.addEventListener("input", e => { s.customLegs = e.target.value; });
        card.appendChild(input);
    }

    // Finish Rule
    card.appendChild(_makeSmallLabel("Finish Rule"));

    const finishRow = document.createElement("div");
    finishRow.className = "x01-toggle-row";
    finishRow.style.marginBottom = "0.7rem";

    for (const [val, label] of [["double", "Double Out"], ["single", "Single Out"]]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "x01-toggle-btn" + (s.finishRule === val ? " active" : "");
        btn.textContent = label;
        btn.addEventListener("click", () => {
            s.finishRule = val;
            reRender();
        });
        finishRow.appendChild(btn);
    }
    card.appendChild(finishRow);

    // Checkout Suggestions
    card.appendChild(_makeSmallLabel("Checkout Suggestions"));

    const checkoutRow = document.createElement("div");
    checkoutRow.className = "x01-toggle-row";

    for (const [val, label] of [[true, "On"], [false, "Off"]]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "x01-toggle-btn" + (s.checkoutSuggestions === val ? " active" : "");
        btn.textContent = label;
        btn.addEventListener("click", () => {
            s.checkoutSuggestions = val;
            reRender();
        });
        checkoutRow.appendChild(btn);
    }
    card.appendChild(checkoutRow);

    return card;
}

function _makeSmallLabel(text) {
    const el = document.createElement("p");
    el.style.cssText = "font-size:.75rem;color:var(--text-muted);margin:0 0 0.3rem";
    el.textContent = text;
    return el;
}

function _buildConfig(s) {
    const errorEl = document.getElementById("x01SetupError");
    const showError = msg => { if (errorEl) errorEl.textContent = msg; };

    let startScore = s.startScore;
    if (startScore === "Custom") {
        startScore = parseInt(s.customScore, 10);
        if (!startScore || startScore < 101) {
            showError("Enter a valid custom start score (minimum 101).");
            return null;
        }
    }

    let legsToWin = s.legsToWin;
    if (legsToWin === "Custom") {
        legsToWin = parseInt(s.customLegs, 10);
        if (!legsToWin || legsToWin < 1) {
            showError("Enter a valid legs to win (minimum 1).");
            return null;
        }
    }

    if (s.playType === "individual") {
        if (s.players.length < 1) {
            showError("Add at least 1 player.");
            return null;
        }
    } else {
        if (s.teams.length < 2) {
            showError("Need at least 2 teams.");
            return null;
        }
        for (let i = 0; i < s.teams.length; i++) {
            if (s.teams[i].players.length < 1) {
                showError(`Team ${i + 1} needs at least 1 player.`);
                return null;
            }
        }
    }

    if (errorEl) errorEl.textContent = "";

    return {
        startScore,
        playType: s.playType,
        legsToWin,
        finishRule: s.finishRule,
        checkoutSuggestions: s.checkoutSuggestions,
        players: s.playType === "individual" ? s.players : [],
        teams: s.playType === "teams" ? s.teams : []
    };
}

// ─── GAME ─────────────────────────────────────────────────────────────────────

function _renderGame(engine, actions) {
    gameBoard.innerHTML = "";
    const screen = document.createElement("section");
    screen.className = "x01-game-screen";

    screen.appendChild(_makeScorebar(engine));
    screen.appendChild(_makeActivePlayerCard(engine));
    screen.appendChild(_makeInputModeWidget(engine, actions));

    if (engine.inputMode === "dartbydart") {
        screen.appendChild(_makeDartTracker(engine));
        screen.appendChild(_makeDartInputCard(engine, actions));
    } else {
        screen.appendChild(_makeScoreInputCard(engine, actions));
    }

    if (engine.turnLog.length > 0) {
        screen.appendChild(_makeTurnLogCard(engine));
    }

    gameBoard.appendChild(screen);
}

function _makeScorebar(engine) {
    const bar = document.createElement("div");
    bar.className = "x01-scorebar";

    const turn = engine.getCurrentTurn();
    const inFlight = engine.turnDarts.reduce((s, d) => s + d.value, 0);

    if (engine.playType === "individual") {
        engine.players.forEach((p, i) => {
            const isActive = turn && turn.playerIndex === i;
            const displayScore = (isActive && engine.inputMode === "dartbydart")
                ? engine.scores[i] - inFlight
                : engine.scores[i];
            bar.appendChild(_makeScoreChip(p.name, displayScore, engine.legsWon[i] || 0, isActive));
        });
    } else {
        engine.teams.forEach((t, i) => {
            const isActive = turn && turn.teamIndex === i;
            const displayScore = (isActive && engine.inputMode === "dartbydart")
                ? engine.scores[i] - inFlight
                : engine.scores[i];
            bar.appendChild(_makeScoreChip(t.name, displayScore, engine.legsWon[i] || 0, isActive));
        });
    }

    return bar;
}

function _makeScoreChip(name, score, legs, isActive) {
    const chip = document.createElement("div");
    chip.className = "x01-score-chip" + (isActive ? " active" : "");

    const nameEl = document.createElement("div");
    nameEl.className = "x01-score-chip-name";
    nameEl.title = name;
    nameEl.textContent = name;

    const scoreEl = document.createElement("div");
    scoreEl.className = "x01-score-chip-score";
    scoreEl.textContent = score;

    const legsEl = document.createElement("div");
    legsEl.className = "x01-score-chip-legs";
    legsEl.textContent = `${legs} leg${legs !== 1 ? "s" : ""}`;

    chip.appendChild(nameEl);
    chip.appendChild(scoreEl);
    chip.appendChild(legsEl);
    return chip;
}

function _makeActivePlayerCard(engine) {
    const card = document.createElement("div");
    card.className = "x01-active-card";

    const turn = engine.getCurrentTurn();
    const score = engine.getCurrentScore();
    const statsKey = engine._activeStatsKey();

    const activeLabel = document.createElement("div");
    activeLabel.className = "x01-active-label";
    activeLabel.textContent = "Now throwing";

    const nameEl = document.createElement("div");
    nameEl.className = "x01-active-name";
    nameEl.textContent = turn ? turn.label : "—";

    const scoreEl = document.createElement("div");
    scoreEl.className = "x01-remaining-score";
    scoreEl.textContent = score;

    card.appendChild(activeLabel);
    card.appendChild(nameEl);
    card.appendChild(scoreEl);

    const legAvg = engine.getLegAvg(statsKey);
    const matchAvg = engine.getMatchAvg(statsKey);
    if (legAvg !== null || matchAvg !== null) {
        const avgRow = document.createElement("div");
        avgRow.className = "x01-avg-row";
        if (legAvg !== null) {
            const legEl = document.createElement("span");
            legEl.className = "x01-avg-item";
            legEl.textContent = `Leg avg: ${legAvg.toFixed(1)}`;
            avgRow.appendChild(legEl);
        }
        if (matchAvg !== null) {
            const matchEl = document.createElement("span");
            matchEl.className = "x01-avg-item";
            matchEl.textContent = `Match avg: ${matchAvg.toFixed(1)}`;
            avgRow.appendChild(matchEl);
        }
        card.appendChild(avgRow);
    }

    const advice = engine.getCheckoutSuggestion();
    if (advice && advice.type !== "none") {
        const hint = document.createElement("div");
        hint.className = "x01-checkout-hint";

        const hintLabel = document.createElement("span");
        hintLabel.className = "x01-checkout-hint-label";
        hintLabel.textContent = advice.type === "checkout" ? "Checkout" : "Setup";

        const hintRoute = document.createElement("span");
        hintRoute.className = "x01-checkout-hint-route";
        hintRoute.textContent = advice.route;

        hint.appendChild(hintLabel);
        hint.appendChild(hintRoute);

        if (advice.helper) {
            const helperEl = document.createElement("span");
            helperEl.className = "x01-checkout-hint-helper";
            helperEl.textContent = advice.helper;
            hint.appendChild(helperEl);
        }

        card.appendChild(hint);
    }

    return card;
}

// ─── TOTAL MODE: NATIVE SCORE INPUT ──────────────────────────────────────────

function _makeScoreInputCard(engine, actions) {
    const card = document.createElement("div");
    card.className = "x01-input-card";

    const input = document.createElement("input");
    input.type = "tel";
    input.inputMode = "numeric";
    input.pattern = "[0-9]*";
    input.className = "x01-score-input";
    input.placeholder = "0 – 180";
    input.autocomplete = "off";
    input.setAttribute("data-numeric-gameplay", "");
    card.appendChild(input);

    const actionRow = document.createElement("div");
    actionRow.className = "x01-action-row";

    const missBtn = document.createElement("button");
    missBtn.type = "button";
    missBtn.className = "x01-btn-miss";
    missBtn.textContent = "Miss";
    missBtn.addEventListener("click", () => {
        input.value = "";
        engine.submitScore(0);
        if (typeof actions.onRender === "function") actions.onRender();
    });

    const enterBtn = document.createElement("button");
    enterBtn.type = "button";
    enterBtn.className = "x01-btn-enter";
    enterBtn.textContent = "Enter Score";

    function doSubmit() {
        const raw = input.value.trim();
        const val = raw === "" ? 0 : Math.max(0, Math.min(180, parseInt(raw, 10) || 0));
        input.value = "";
        engine.submitScore(val);
        if (typeof actions.onRender === "function") actions.onRender();
    }

    enterBtn.addEventListener("click", doSubmit);
    input.addEventListener("keydown", e => { if (e.key === "Enter") doSubmit(); });

    const undoBtn = document.createElement("button");
    undoBtn.type = "button";
    undoBtn.className = "x01-btn-undo";
    undoBtn.textContent = "↶ Undo";
    undoBtn.disabled = engine.history.length === 0;
    undoBtn.addEventListener("click", () => {
        input.value = "";
        engine.undo();
        if (typeof actions.onRender === "function") actions.onRender();
    });

    actionRow.appendChild(missBtn);
    actionRow.appendChild(enterBtn);
    actionRow.appendChild(undoBtn);
    card.appendChild(actionRow);

    return card;
}

// ─── INPUT MODE WIDGET ────────────────────────────────────────────────────────

function _makeInputModeWidget(engine, actions) {
    const wrap = document.createElement("div");
    wrap.className = "x01-input-mode-widget";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "x01-input-mode-toggle" + (_inputModeDropdownOpen ? " open" : "");
    const modeLabel = engine.inputMode === "total" ? "Turn Total" : "Dart by Dart";
    toggle.textContent = `Input: ${modeLabel} ▾`;
    toggle.addEventListener("click", () => {
        _inputModeDropdownOpen = !_inputModeDropdownOpen;
        if (typeof actions.onRender === "function") actions.onRender();
    });
    wrap.appendChild(toggle);

    if (_inputModeDropdownOpen) {
        const menu = document.createElement("div");
        menu.className = "x01-input-mode-menu";

        for (const [val, lbl] of [["total", "Turn Total"], ["dartbydart", "Dart by Dart"]]) {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "x01-input-mode-item" + (engine.inputMode === val ? " active" : "");
            item.textContent = lbl;
            item.addEventListener("click", () => {
                engine.switchInputMode(val);
                _inputModeDropdownOpen = false;
                if (typeof actions.onRender === "function") actions.onRender();
            });
            menu.appendChild(item);
        }

        wrap.appendChild(menu);
    }

    return wrap;
}

// ─── ADD PLAYER MODAL ─────────────────────────────────────────────────────────

function _makeAddPlayerModal(s, reRender) {
    const overlay = document.createElement("div");
    overlay.className = "x01-add-player-overlay";
    overlay.addEventListener("click", e => {
        if (e.target === overlay) {
            _addPlayerPendingTarget = null;
            _addPlayerPendingName = "";
            reRender();
        }
    });

    const sheet = document.createElement("div");
    sheet.className = "x01-add-player-sheet";

    const title = document.createElement("h3");
    title.className = "x01-add-player-title";
    title.textContent = "Add player";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "x01-add-player-input";
    nameInput.placeholder = "Player name (optional)";
    nameInput.value = _addPlayerPendingName;
    nameInput.maxLength = 30;
    nameInput.addEventListener("input", e => { _addPlayerPendingName = e.target.value; });
    nameInput.addEventListener("keydown", e => {
        if (e.key === "Enter") addWithName();
        if (e.key === "Escape") { _addPlayerPendingTarget = null; _addPlayerPendingName = ""; reRender(); }
    });

    function addPlayerToState(name) {
        const target = _addPlayerPendingTarget;
        if (!target) return;
        if (target.type === "individual") {
            const fallback = `Player ${s.players.length + 1}`;
            s.players.push({ name: name || fallback });
        } else {
            const team = s.teams[target.teamIndex];
            const fallback = `Player ${team.players.length + 1}`;
            team.players.push({ name: name || fallback });
        }
        _addPlayerPendingTarget = null;
        _addPlayerPendingName = "";
        reRender();
    }

    function addGuest() {
        const target = _addPlayerPendingTarget;
        if (!target) return;
        if (target.type === "individual") {
            addPlayerToState(`Guest ${s.players.length + 1}`);
        } else {
            const team = s.teams[target.teamIndex];
            addPlayerToState(`Guest ${team.players.length + 1}`);
        }
    }

    function addWithName() {
        addPlayerToState(_addPlayerPendingName.trim());
    }

    const btnRow = document.createElement("div");
    btnRow.className = "x01-add-player-btn-row";

    const guestBtn = document.createElement("button");
    guestBtn.type = "button";
    guestBtn.className = "x01-add-guest-btn";
    guestBtn.textContent = "Add Guest";
    guestBtn.addEventListener("click", addGuest);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "x01-add-named-btn";
    addBtn.textContent = "Add Player";
    addBtn.addEventListener("click", addWithName);

    btnRow.appendChild(guestBtn);
    btnRow.appendChild(addBtn);

    sheet.appendChild(title);
    sheet.appendChild(nameInput);
    sheet.appendChild(btnRow);
    overlay.appendChild(sheet);

    setTimeout(() => nameInput.focus(), 60);

    return overlay;
}

// ─── DART-BY-DART MODE ────────────────────────────────────────────────────────

function _makeDartTracker(engine) {
    const card = document.createElement("div");
    card.className = "x01-dart-tracker";

    const label = document.createElement("div");
    label.className = "x01-dart-tracker-label";
    const thrown = engine.turnDarts.length;
    label.textContent = thrown < 3 ? `Dart ${thrown + 1} of 3` : "3 darts thrown";
    card.appendChild(label);

    const slots = document.createElement("div");
    slots.className = "x01-dart-slots";

    for (let i = 0; i < 3; i++) {
        const slot = document.createElement("div");
        const d = engine.turnDarts[i];
        const isCurrent = (i === thrown && thrown < 3);
        slot.className = "x01-dart-slot"
            + (d ? " thrown" : "")
            + (isCurrent ? " current" : "");
        slot.textContent = d ? d.label : (isCurrent ? "?" : "—");
        slots.appendChild(slot);
    }

    card.appendChild(slots);
    return card;
}

function _makeDartInputCard(engine, actions) {
    const card = document.createElement("div");
    card.className = "x01-dart-input-card";

    // Multiplier row
    const multRow = document.createElement("div");
    multRow.className = "x01-multiplier-row";

    for (const [val, label] of [[1, "Single"], [2, "Double"], [3, "Triple"]]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "x01-mult-btn" + (engine.selectedMultiplier === val ? " active" : "");
        btn.textContent = label;
        btn.addEventListener("click", () => {
            engine.selectMultiplier(val);
            if (typeof actions.onRender === "function") actions.onRender();
        });
        multRow.appendChild(btn);
    }
    card.appendChild(multRow);

    // Number grid 1–20
    const grid = document.createElement("div");
    grid.className = "x01-dart-grid";

    for (let n = 1; n <= 20; n++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "x01-dart-num-btn";
        btn.textContent = String(n);
        btn.addEventListener("click", () => {
            engine.addDart(n);
            if (typeof actions.onRender === "function") actions.onRender();
        });
        grid.appendChild(btn);
    }
    card.appendChild(grid);

    // Special buttons: Miss + Bull
    const specRow = document.createElement("div");
    specRow.className = "x01-dart-special-row";

    const missBtn = document.createElement("button");
    missBtn.type = "button";
    missBtn.className = "x01-dart-special-btn x01-dart-miss-btn";
    missBtn.textContent = "Miss";
    missBtn.addEventListener("click", () => {
        engine.addDart(0);
        if (typeof actions.onRender === "function") actions.onRender();
    });

    const bullBtn = document.createElement("button");
    bullBtn.type = "button";
    bullBtn.className = "x01-dart-special-btn x01-dart-bull-btn";
    bullBtn.textContent = engine.selectedMultiplier === 2 ? "Bull (50)" : "Bull (25)";
    bullBtn.addEventListener("click", () => {
        engine.addDart(25); // engine applies selected multiplier
        if (typeof actions.onRender === "function") actions.onRender();
    });

    specRow.appendChild(missBtn);
    specRow.appendChild(bullBtn);
    card.appendChild(specRow);

    // End Turn + Undo
    const actionRow = document.createElement("div");
    actionRow.className = "x01-action-row";
    actionRow.style.marginTop = "0.4rem";

    const endTurnBtn = document.createElement("button");
    endTurnBtn.type = "button";
    endTurnBtn.className = "x01-btn-next-turn";
    endTurnBtn.textContent = "End Turn";
    endTurnBtn.addEventListener("click", () => {
        engine.endTurnEarly();
        if (typeof actions.onRender === "function") actions.onRender();
    });

    const undoBtn = document.createElement("button");
    undoBtn.type = "button";
    undoBtn.className = "x01-btn-undo";
    undoBtn.textContent = "↶ Undo";
    undoBtn.disabled = engine.history.length === 0;
    undoBtn.addEventListener("click", () => {
        engine.undo();
        if (typeof actions.onRender === "function") actions.onRender();
    });

    actionRow.appendChild(endTurnBtn);
    actionRow.appendChild(undoBtn);
    card.appendChild(actionRow);

    return card;
}

// ─── DOUBLE-OUT CONFIRMATION ──────────────────────────────────────────────────

function _renderDoubleConfirm(engine, actions) {
    gameBoard.innerHTML = "";
    const screen = document.createElement("section");
    screen.className = "x01-game-screen";

    screen.appendChild(_makeScorebar(engine));

    const card = document.createElement("div");
    card.className = "x01-confirm-card";

    const playerLabel = engine.pendingDoubleConfirm
        ? engine.pendingDoubleConfirm.turnLabel
        : "—";

    const playerEl = document.createElement("div");
    playerEl.className = "x01-confirm-player";
    playerEl.textContent = playerLabel;

    const question = document.createElement("div");
    question.className = "x01-confirm-question";
    question.textContent = "Finish on a double?";

    const info = document.createElement("div");
    info.className = "x01-confirm-info";
    info.textContent = "Did the finishing dart land on a double or the inner bull?";

    card.appendChild(playerEl);
    card.appendChild(question);
    card.appendChild(info);

    const btnRow = document.createElement("div");
    btnRow.className = "x01-confirm-actions";

    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "x01-confirm-yes-btn";
    yesBtn.textContent = "Yes — Leg Won!";
    yesBtn.addEventListener("click", () => {
        engine.confirmDoubleOut(true);
        if (typeof actions.onRender === "function") actions.onRender();
    });

    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "x01-confirm-no-btn";
    noBtn.textContent = "No — Bust";
    noBtn.addEventListener("click", () => {
        engine.confirmDoubleOut(false);
        if (typeof actions.onRender === "function") actions.onRender();
    });

    btnRow.appendChild(yesBtn);
    btnRow.appendChild(noBtn);
    card.appendChild(btnRow);

    screen.appendChild(card);
    gameBoard.appendChild(screen);
}

// ─── TURN LOG ─────────────────────────────────────────────────────────────────

function _makeTurnLogCard(engine) {
    const card = document.createElement("div");
    card.className = "x01-section-card";

    const title = document.createElement("p");
    title.className = "x01-section-title";
    title.textContent = "Recent Turns";
    card.appendChild(title);

    const list = document.createElement("ul");
    list.className = "x01-turn-log";

    engine.turnLog.slice(0, 5).forEach(entry => {
        const item = document.createElement("li");
        item.className = "x01-turn-log-item" + (entry.bust ? " bust" : "");

        const nameEl = document.createElement("span");
        nameEl.className = "x01-turn-log-name";
        nameEl.textContent = entry.label;
        nameEl.title = entry.label;

        const scoreEl = document.createElement("span");
        if (entry.bust) {
            scoreEl.className = "x01-turn-log-score x01-turn-log-bust";
            scoreEl.textContent = `${entry.scored} → BUST`;
        } else {
            scoreEl.className = "x01-turn-log-score";
            scoreEl.textContent = `${entry.scored} → ${entry.remaining}`;
        }

        item.appendChild(nameEl);
        item.appendChild(scoreEl);
        list.appendChild(item);
    });

    card.appendChild(list);
    return card;
}

// ─── LEG WON ──────────────────────────────────────────────────────────────────

function _renderLegWon(engine, actions) {
    gameBoard.innerHTML = "";
    const screen = document.createElement("section");
    screen.className = "x01-game-screen";

    screen.appendChild(_makeScorebar(engine));

    const card = document.createElement("div");
    card.className = "x01-result-card";

    const badge = document.createElement("div");
    badge.className = "x01-result-badge";
    badge.textContent = `LEG ${engine.currentLeg} WON`;

    const winner = document.createElement("div");
    winner.className = "x01-result-winner";
    winner.textContent = engine.legWinnerLabel;

    const sub = document.createElement("div");
    sub.className = "x01-result-sub";
    sub.textContent = `Wins leg ${engine.currentLeg}`;

    card.appendChild(badge);
    card.appendChild(winner);
    card.appendChild(sub);
    card.appendChild(_makeLegsSummary(engine));

    const btnRow = document.createElement("div");
    btnRow.className = "x01-result-actions";

    const continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.className = "x01-btn-continue";
    continueBtn.textContent = "Continue →";
    continueBtn.addEventListener("click", () => {
        engine.startNextLeg();
        if (typeof actions.onRender === "function") actions.onRender();
    });

    btnRow.appendChild(continueBtn);
    card.appendChild(btnRow);
    screen.appendChild(card);
    gameBoard.appendChild(screen);
}

// ─── MATCH WON ────────────────────────────────────────────────────────────────

function _renderMatchWon(engine, actions) {
    gameBoard.innerHTML = "";
    const screen = document.createElement("section");
    screen.className = "x01-game-screen";

    const card = document.createElement("div");
    card.className = "x01-result-card";

    const badge = document.createElement("div");
    badge.className = "x01-result-badge";
    badge.textContent = "MATCH WON";

    const winner = document.createElement("div");
    winner.className = "x01-result-winner";
    winner.textContent = engine.matchWinnerLabel;

    const sub = document.createElement("div");
    sub.className = "x01-result-sub";
    const l = engine.legsToWin;
    sub.textContent = `Won ${l} leg${l !== 1 ? "s" : ""}`;

    card.appendChild(badge);
    card.appendChild(winner);
    card.appendChild(sub);
    card.appendChild(_makeLegsSummary(engine));

    const btnRow = document.createElement("div");
    btnRow.className = "x01-result-actions";

    const rematchBtn = document.createElement("button");
    rematchBtn.type = "button";
    rematchBtn.className = "x01-btn-rematch";
    rematchBtn.textContent = "Rematch";
    rematchBtn.addEventListener("click", () => {
        if (typeof actions.onRematch === "function") actions.onRematch();
    });

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "x01-btn-back-menu";
    backBtn.textContent = "Menu";
    backBtn.addEventListener("click", () => {
        if (typeof actions.onBackToMenu === "function") actions.onBackToMenu();
    });

    btnRow.appendChild(rematchBtn);
    btnRow.appendChild(backBtn);
    card.appendChild(btnRow);
    screen.appendChild(card);
    gameBoard.appendChild(screen);
}

function _makeLegsSummary(engine) {
    const container = document.createElement("div");
    container.className = "x01-legs-summary";

    const entries = engine.playType === "individual"
        ? engine.players.map((p, i) => ({ name: p.name, legs: engine.legsWon[i] || 0 }))
        : engine.teams.map((t, i) => ({ name: t.name, legs: engine.legsWon[i] || 0 }));

    entries.forEach(e => {
        const chip = document.createElement("div");
        chip.className = "x01-legs-chip";

        const nameEl = document.createElement("div");
        nameEl.className = "x01-legs-chip-name";
        nameEl.textContent = e.name;

        const countEl = document.createElement("div");
        countEl.className = "x01-legs-chip-count";
        countEl.textContent = `${e.legs} leg${e.legs !== 1 ? "s" : ""}`;

        chip.appendChild(nameEl);
        chip.appendChild(countEl);
        container.appendChild(chip);
    });

    return container;
}
