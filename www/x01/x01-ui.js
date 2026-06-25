// www/x01/x01-ui.js

const setupPanel = document.getElementById("setupPanel");
const gamePanel = document.getElementById("gamePanel");
const gameBoard = document.getElementById("gameBoard");
const backToHomeButton = document.getElementById("backToHomeButton");

// Setup state persists across re-renders within a single mode session.
// Cleared when a match starts or mode is exited.
let _setupState = null;

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

    if (engine.status === "setup") {
        if (!_setupState) _setupState = freshSetupState();
        _renderSetup(engine, actions);
    } else if (engine.status === "playing") {
        _renderGame(engine, actions);
    } else if (engine.status === "legWon") {
        _renderLegWon(engine, actions);
    } else if (engine.status === "matchWon") {
        _renderMatchWon(engine, actions);
    }
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

function _renderSetup(engine, actions) {
    const s = _setupState;
    const screen = document.createElement("section");
    screen.className = "x01-screen";

    const reRender = () => _renderSetup(engine, actions);

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
        removeBtn.disabled = s.players.length <= 2;
        removeBtn.title = s.players.length <= 2 ? "Minimum 2 players" : "Remove player";
        removeBtn.addEventListener("click", () => {
            s.players.splice(i, 1);
            reRender();
        });

        item.appendChild(input);
        item.appendChild(removeBtn);
        list.appendChild(item);
    });

    card.appendChild(list);

    if (s.players.length < 12) {
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "x01-add-player-btn";
        addBtn.textContent = `+ Add Player`;
        addBtn.addEventListener("click", () => {
            s.players.push({ name: "" });
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

        const teamNameInput = document.createElement("input");
        teamNameInput.type = "text";
        teamNameInput.className = "x01-team-name-input";
        teamNameInput.placeholder = `Team ${ti + 1}`;
        teamNameInput.value = team.name;
        teamNameInput.addEventListener("input", e => { s.teams[ti].name = e.target.value; });
        block.appendChild(teamNameInput);

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

            item.appendChild(input);
            item.appendChild(removeBtn);
            playerList.appendChild(item);
        });

        block.appendChild(playerList);

        if (team.players.length < 6) {
            const addPlayerBtn = document.createElement("button");
            addPlayerBtn.type = "button";
            addPlayerBtn.className = "x01-add-player-btn";
            addPlayerBtn.textContent = `+ Add Player`;
            addPlayerBtn.addEventListener("click", () => {
                s.teams[ti].players.push({ name: "" });
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

    // Legs to win
    const legsLabel = _makeSmallLabel("Legs to Win");
    card.appendChild(legsLabel);

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
        input.className = "x01-custom-score-input";
        input.value = s.customLegs;
        input.style.marginBottom = "0.7rem";
        input.addEventListener("input", e => { s.customLegs = e.target.value; });
        card.appendChild(input);
    }

    // Finish rule
    const finishLabel = _makeSmallLabel("Finish Rule");
    card.appendChild(finishLabel);

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

    // Checkout suggestions
    const checkoutLabel = _makeSmallLabel("Checkout Suggestions");
    card.appendChild(checkoutLabel);

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
        if (s.players.length < 2) {
            showError("Add at least 2 players.");
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
    const screen = document.createElement("section");
    screen.className = "x01-game-screen";

    screen.appendChild(_makeScorebar(engine));
    screen.appendChild(_makeActivePlayerCard(engine));
    screen.appendChild(_makeInputCard(engine, actions));
    screen.appendChild(_makeTurnLogCard(engine));

    gameBoard.appendChild(screen);

    // Auto-focus score input on mobile
    const input = gameBoard.querySelector(".x01-score-input");
    if (input) setTimeout(() => input.focus(), 60);
}

function _makeScorebar(engine) {
    const bar = document.createElement("div");
    bar.className = "x01-scorebar";

    const turn = engine.getCurrentTurn();

    if (engine.playType === "individual") {
        engine.players.forEach((p, i) => {
            const isActive = turn && turn.playerIndex === i;
            bar.appendChild(_makeScoreChip(p.name, engine.scores[i], engine.legsWon[i] || 0, isActive));
        });
    } else {
        engine.teams.forEach((t, i) => {
            const isActive = turn && turn.teamIndex === i;
            bar.appendChild(_makeScoreChip(t.name, engine.scores[i], engine.legsWon[i] || 0, isActive));
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

function _makeInputCard(engine, actions) {
    const card = document.createElement("div");
    card.className = "x01-input-card";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "180";
    input.placeholder = "Score (0–180)";
    input.className = "x01-score-input";
    input.inputMode = "numeric";
    input.pattern = "[0-9]*";

    function submit() {
        const raw = input.value.trim();
        if (raw === "") return;
        const val = parseInt(raw, 10);
        if (isNaN(val)) return;
        engine.submitScore(val);
        input.value = "";
        if (typeof actions.onRender === "function") actions.onRender();
    }

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") submit();
    });

    const row = document.createElement("div");
    row.className = "x01-action-row";

    const enterBtn = document.createElement("button");
    enterBtn.type = "button";
    enterBtn.className = "x01-btn-enter";
    enterBtn.textContent = "Enter Score";
    enterBtn.addEventListener("click", submit);

    const missBtn = document.createElement("button");
    missBtn.type = "button";
    missBtn.className = "x01-btn-miss";
    missBtn.textContent = "Miss (0)";
    missBtn.addEventListener("click", () => {
        engine.submitScore(0);
        input.value = "";
        if (typeof actions.onRender === "function") actions.onRender();
    });

    const undoBtn = document.createElement("button");
    undoBtn.type = "button";
    undoBtn.className = "x01-btn-undo";
    undoBtn.textContent = "↶ Undo";
    undoBtn.disabled = engine.history.length === 0;

    undoBtn.addEventListener("click", () => {
        engine.undo();
        input.value = "";
        if (typeof actions.onRender === "function") actions.onRender();
    });

    row.appendChild(enterBtn);
    row.appendChild(missBtn);
    row.appendChild(undoBtn);

    card.appendChild(input);
    card.appendChild(row);
    return card;
}

function _makeTurnLogCard(engine) {
    const card = document.createElement("div");
    card.className = "x01-section-card";

    const title = document.createElement("p");
    title.className = "x01-section-title";
    title.textContent = "Recent Turns";
    card.appendChild(title);

    if (engine.turnLog.length === 0) {
        const empty = document.createElement("p");
        empty.style.cssText = "font-size:0.78rem;color:var(--text-muted);margin:0";
        empty.textContent = "No turns yet.";
        card.appendChild(empty);
        return card;
    }

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
