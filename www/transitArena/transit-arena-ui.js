// www/transitArena/transit-arena-ui.js

import { getPowerUpById } from "./transit-arena-powerups.js";

// ─── Local audio helpers ──────────────────────────────────────────────────────

let _audioCtx = null;

function _getAudioCtx() {
    if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
}

function _tone(frequency, duration = 0.08, type = "sine", volume = 0.07) {
    try {
        const ctx = _getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (_) { /* audio not available */ }
}

export function playTransitPowerUpSpawnSound() {
    _tone(300, 0.09, "sine", 0.06);
    setTimeout(() => _tone(420, 0.09, "sine", 0.06), 90);
    setTimeout(() => _tone(560, 0.12, "triangle", 0.07), 180);
}

export function playTransitPowerUpUnlockSound() {
    _tone(660, 0.08, "triangle", 0.08);
    setTimeout(() => _tone(880, 0.08, "triangle", 0.08), 80);
    setTimeout(() => _tone(1100, 0.12, "triangle", 0.07), 160);
}

export function playTransitPowerUpClaimSound() {
    _tone(523, 0.10, "triangle", 0.08);
    setTimeout(() => _tone(659, 0.10, "triangle", 0.08), 100);
    setTimeout(() => _tone(784, 0.12, "triangle", 0.09), 200);
    setTimeout(() => _tone(1046, 0.18, "triangle", 0.08), 340);
}

export function playTransitPowerUpExpireSound() {
    _tone(280, 0.14, "sine", 0.06);
    setTimeout(() => _tone(220, 0.16, "sine", 0.05), 120);
    setTimeout(() => _tone(160, 0.18, "sawtooth", 0.04), 260);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export function renderTransitArenaMode(engine, actions = {}) {
    const setupPanel = document.getElementById("setupPanel");
    const gamePanel  = document.getElementById("gamePanel");
    const gameBoard  = document.getElementById("gameBoard");
    const undoButton = document.getElementById("undoButton");
    const backBtn    = document.getElementById("backToHomeButton");

    if (!gamePanel || !gameBoard) return;

    if (setupPanel) setupPanel.style.display = "none";
    gamePanel.classList.remove("hidden");
    if (undoButton) undoButton.classList.add("hidden");

    if (backBtn) {
        backBtn.textContent = "← Back";
        backBtn.onclick = () => { if (typeof actions.onBack === "function") actions.onBack(); };
    }

    gameBoard.innerHTML = "";

    if (engine.status === "playing") {
        _renderPlaying(engine, actions);
    } else if (engine.status === "finished") {
        _renderFinished(engine, actions);
    }
}

// ─── Playing screen ───────────────────────────────────────────────────────────

function _renderPlaying(engine, actions) {
    const gameBoard = document.getElementById("gameBoard");
    const screen = _el("section", "ta-screen");

    screen.appendChild(_makeTopCard(engine, actions));
    screen.appendChild(_makePlayersStrip(engine));
    screen.appendChild(_makeTargetArea(engine, actions));

    if (engine.activePowerUp !== null) {
        screen.appendChild(_makePowerUpCard(engine, actions));
    }

    screen.appendChild(_makeTurnCard(engine));

    if (engine.turnThrows.length > 0) {
        screen.appendChild(_makeThrowsLog(engine));
    }

    if (engine.lastResult) {
        screen.appendChild(_makeResultMsg(engine));
    }

    screen.appendChild(_makeMultiplierRow(engine, actions));
    screen.appendChild(_makeNumberGrid(engine, actions));
    screen.appendChild(_makeActionRow(actions));

    gameBoard.appendChild(screen);
}

// ─── Top card ─────────────────────────────────────────────────────────────────

function _makeTopCard(engine, actions) {
    const card = _el("div", "ta-card ta-top-card");

    const row = _el("div", "ta-title-row");
    const badge = _el("span", "ta-mode-badge");
    badge.textContent = "Transit Arena";

    const right = _el("div", "ta-title-row-right");

    const roundBadge = _el("span", "ta-round-badge");
    roundBadge.textContent = `Round ${engine.currentRound}`;

    const undoBtn = _el("button", "ta-undo-button");
    undoBtn.type = "button";
    undoBtn.textContent = "↶ Undo";
    undoBtn.disabled = engine.history.length === 0;
    undoBtn.addEventListener("click", () => {
        if (typeof actions.onUndo === "function") actions.onUndo();
    });

    right.appendChild(roundBadge);
    right.appendChild(undoBtn);
    row.appendChild(badge);
    row.appendChild(right);
    card.appendChild(row);
    return card;
}

// ─── Players strip ────────────────────────────────────────────────────────────

function _makePlayersStrip(engine) {
    const strip = _el("div", "ta-players-strip");

    engine.players.forEach((player, i) => {
        const isActive = i === engine.currentPlayerIndex;
        const isTarget = i === engine.selectedTargetIndex;

        const card = _el("div", "ta-player-card");
        if (isActive)          card.classList.add("active");
        if (!player.isAlive)   card.classList.add("dead");
        if (isTarget && !isActive && player.isAlive) card.classList.add("targeted");

        // Name row
        const nameRow = _el("div", "ta-player-name-row");
        const nameSpan = _el("span", "ta-player-name");
        nameSpan.textContent = player.name;
        if (!player.isAlive) {
            const deadBadge = _el("span", "ta-dead-badge");
            deadBadge.textContent = "OUT";
            nameRow.appendChild(nameSpan);
            nameRow.appendChild(deadBadge);
        } else {
            nameRow.appendChild(nameSpan);
        }

        // HP bar
        const hpPct = Math.max(0, Math.round((player.hp / player.maxHp) * 100));
        const hpBarWrap = _el("div", "ta-hp-bar-wrap");
        const hpBar = _el("div", "ta-hp-bar");
        hpBar.style.width = `${hpPct}%`;
        hpBar.classList.add(hpPct <= 30 ? "low" : hpPct <= 60 ? "mid" : "high");
        hpBarWrap.appendChild(hpBar);

        const hpText = _el("div", "ta-hp-text");
        hpText.textContent = `${player.hp}/${player.maxHp} HP`;

        // Shield pips
        const pipsRow = _el("div", "ta-shield-pips");
        for (let s = 0; s < 5; s++) {
            const pip = _el("span", "ta-shield-pip");
            if (s < player.shield) pip.classList.add("filled");
            pipsRow.appendChild(pip);
        }

        // Active power-up icons
        const puIcons = _makePowerUpIcons(player);

        card.appendChild(nameRow);
        card.appendChild(hpBarWrap);
        card.appendChild(hpText);
        card.appendChild(pipsRow);
        if (puIcons.childNodes.length > 0) card.appendChild(puIcons);

        strip.appendChild(card);
    });

    return strip;
}

function _makePowerUpIcons(player) {
    const row = _el("div", "ta-powerup-icons");
    const flags = [
        { key: "quickRevive", symbol: "♻" },
        { key: "doubleTap",   symbol: "⚡" },
        { key: "speedCola",   symbol: "⏩" },
        { key: "deadshot",    symbol: "🎯" },
        { key: "widowWine",   symbol: "🍷" },
        { key: "instaKill",   symbol: "💀" }
    ];
    flags.forEach(({ key, symbol }) => {
        if (player[key]) {
            const icon = _el("span", "ta-powerup-icon");
            icon.textContent = symbol;
            row.appendChild(icon);
        }
    });
    return row;
}

// ─── Target area ──────────────────────────────────────────────────────────────

function _makeTargetArea(engine, actions) {
    const opponents = engine.getAliveOpponentIndexes();
    const wrap = _el("div", "ta-target-area");

    if (opponents.length === 0) return wrap;

    const label = _el("span", "ta-target-label");
    label.textContent = "Target:";
    wrap.appendChild(label);

    if (opponents.length === 1) {
        // Auto-select — just show name
        const name = engine.players[opponents[0]].name;
        const autoSpan = _el("span", "ta-target-auto");
        autoSpan.textContent = name;
        wrap.appendChild(autoSpan);
    } else {
        // Show clickable buttons for 2+ alive opponents
        opponents.forEach(idx => {
            const btn = _el("button", "ta-target-btn");
            btn.type = "button";
            btn.textContent = engine.players[idx].name;
            if (idx === engine.selectedTargetIndex) btn.classList.add("active");
            btn.addEventListener("click", () => {
                if (typeof actions.onSelectTarget === "function") actions.onSelectTarget(idx);
            });
            wrap.appendChild(btn);
        });
    }

    return wrap;
}

// ─── Active power-up card ─────────────────────────────────────────────────────

function _makePowerUpCard(engine, actions) {
    const pu = getPowerUpById(engine.activePowerUp);
    const isPending = engine.pendingPowerUpClaim;
    const isMyTurn = engine.pendingPowerUpPlayerIndex === engine.currentPlayerIndex;

    const card = _el("div", "ta-card ta-powerup-card");

    // Header row: name + segment
    const header = _el("div", "ta-powerup-header");
    const puName = _el("span", "ta-powerup-name");
    puName.textContent = pu ? pu.name : engine.activePowerUp;

    const segLabel = _el("span", "ta-powerup-segment-label");
    segLabel.textContent = isPending ? "Tap coin to claim!" : `Hit ${engine.powerUpSegment} to claim`;
    if (isPending) segLabel.classList.add("unlocked");

    header.appendChild(puName);
    header.appendChild(segLabel);
    card.appendChild(header);

    // Effect text
    const effectP = _el("p", "ta-powerup-effect");
    effectP.textContent = pu ? pu.effectText : "";
    card.appendChild(effectP);

    // Timer
    if (!isPending) {
        const timerSpan = _el("span", "ta-powerup-timer");
        timerSpan.textContent = `${engine.powerUpTurnsRemaining} full round${engine.powerUpTurnsRemaining !== 1 ? "s" : ""} remaining`;
        card.appendChild(timerSpan);
    }

    // Coin
    const coinWrap = _el("div", "ta-coin-wrap");
    const coin = _el("button", "ta-coin");
    coin.type = "button";

    if (isPending) {
        coin.classList.add("ta-coin--unlocked");
        coin.setAttribute("aria-label", "Tap to claim power-up");
    } else {
        coin.classList.add("ta-coin--spinning");
        coin.setAttribute("aria-label", `Hit ${engine.powerUpSegment} to unlock`);
    }

    const coinSymbol = _el("span", "ta-coin-symbol");
    coinSymbol.textContent = pu ? pu.symbol : "?";
    coin.appendChild(coinSymbol);

    if (isPending && isMyTurn) {
        coin.addEventListener("click", () => {
            if (typeof actions.onClaimCoin === "function") actions.onClaimCoin();
        });
    } else {
        coin.addEventListener("click", () => {
            if (typeof actions.onCoinInfo === "function") actions.onCoinInfo();
        });
    }

    coinWrap.appendChild(coin);

    const coinHint = _el("div", "ta-coin-hint");
    if (isPending && isMyTurn) {
        coinHint.textContent = "Tap to claim!";
        coinHint.classList.add("unlocked");
    } else if (isPending && !isMyTurn) {
        coinHint.textContent = `${engine.players[engine.pendingPowerUpPlayerIndex]?.name || "?"} can claim`;
    } else {
        coinHint.textContent = `Hit ${engine.powerUpSegment}`;
    }

    coinWrap.appendChild(coinHint);
    card.appendChild(coinWrap);

    return card;
}

// ─── Turn info card ───────────────────────────────────────────────────────────

function _makeTurnCard(engine) {
    const currentPlayer = engine.players[engine.currentPlayerIndex];
    const dartsLeft = engine.maxDartsThisTurn - engine.dartsThisTurn;

    const card = _el("div", "ta-card ta-turn-card");
    const nameEl = _el("span", "ta-turn-name");
    nameEl.textContent = `${currentPlayer.name}'s turn`;

    const dartsEl = _el("strong", "ta-darts-left");
    dartsEl.textContent = `${dartsLeft} dart${dartsLeft !== 1 ? "s" : ""} left`;

    card.appendChild(nameEl);
    card.appendChild(dartsEl);

    return card;
}

// ─── Throws log ───────────────────────────────────────────────────────────────

function _makeThrowsLog(engine) {
    const row = _el("div", "ta-turn-throws");
    engine.turnThrows.forEach(t => {
        const chip = _el("span", "ta-throw-chip");
        chip.classList.add(t.effect === "damage" ? "damage" :
                           t.effect === "blocked" ? "blocked" : "none");
        chip.textContent = t.label;
        row.appendChild(chip);
    });
    return row;
}

// ─── Result message ───────────────────────────────────────────────────────────

function _makeResultMsg(engine) {
    const msg = _el("div", "ta-result-msg");
    const lr = engine.lastResult;
    if (lr.type === "powerUpClaimed") msg.classList.add("claimed");
    else if (lr.type === "hint") msg.classList.add("hint");
    msg.textContent = lr.message;
    return msg;
}

// ─── Multiplier row ───────────────────────────────────────────────────────────

function _makeMultiplierRow(engine, actions) {
    const row = _el("div", "ta-multiplier-row");
    [{ v: 1, label: "Single" }, { v: 2, label: "Double" }, { v: 3, label: "Triple" }].forEach(item => {
        const btn = _el("button", "ta-multiplier-btn");
        btn.type = "button";
        btn.textContent = item.label;
        if (engine.selectedMultiplier === item.v) btn.classList.add("active");
        btn.addEventListener("click", () => {
            if (typeof actions.onSelectMultiplier === "function") actions.onSelectMultiplier(item.v);
        });
        row.appendChild(btn);
    });
    return row;
}

// ─── Number grid ──────────────────────────────────────────────────────────────

function _makeNumberGrid(engine, actions) {
    const grid = _el("div", "ta-number-grid");
    const prefixMap = { 1: "S", 2: "D", 3: "T" };
    const prefix = prefixMap[engine.selectedMultiplier] || "S";

    for (let n = 1; n <= 20; n++) {
        const segment = `${prefix}${n}`;
        const btn = _el("button", "ta-number-btn");
        btn.type = "button";
        btn.textContent = n;

        if (segment === engine.powerUpSegment && engine.activePowerUp !== null) {
            btn.classList.add("power-up-target");
        }

        btn.addEventListener("click", () => {
            if (typeof actions.onThrowSegment === "function") {
                actions.onThrowSegment(segment);
            }
        });
        grid.appendChild(btn);
    }
    return grid;
}

// ─── Action row (bulls + miss) ────────────────────────────────────────────────

function _makeActionRow(actions) {
    const row = _el("div", "ta-action-row");

    const outerBullBtn = _el("button", "ta-bull-btn");
    outerBullBtn.type = "button";
    outerBullBtn.textContent = "Outer Bull 25";
    outerBullBtn.addEventListener("click", () => {
        if (typeof actions.onOuterBull === "function") actions.onOuterBull();
    });

    const bullBtn = _el("button", "ta-bull-btn");
    bullBtn.type = "button";
    bullBtn.textContent = "Bull 50";
    bullBtn.addEventListener("click", () => {
        if (typeof actions.onBull === "function") actions.onBull();
    });

    const missBtn = _el("button", "ta-miss-btn");
    missBtn.type = "button";
    missBtn.textContent = "Miss";
    missBtn.addEventListener("click", () => {
        if (typeof actions.onMiss === "function") actions.onMiss();
    });

    row.appendChild(outerBullBtn);
    row.appendChild(bullBtn);
    row.appendChild(missBtn);
    return row;
}

// ─── Finished screen ──────────────────────────────────────────────────────────

function _renderFinished(engine, actions) {
    const gameBoard = document.getElementById("gameBoard");
    const screen = _el("section", "ta-screen");
    const card = _el("article", "ta-card ta-finished-card");

    const badgeRow = _el("div", "ta-badge-row");
    const badge = _el("span", "ta-mode-badge");
    badge.textContent = "Transit Arena";
    badgeRow.appendChild(badge);

    const winTitle = _el("div", "ta-winner-title");
    winTitle.textContent = "Winner!";

    const winName = _el("div", "ta-winner-name");
    winName.textContent = engine.winner || "—";

    const summary = _el("div", "ta-finished-summary");
    engine.players.forEach(p => {
        const row = _el("div", "ta-finished-player-row");
        if (engine.winner && p.name === engine.winner) row.classList.add("winner");
        if (!p.isAlive) row.classList.add("eliminated");

        const nameSpan = _el("span");
        nameSpan.textContent = p.name;
        const hpSpan = _el("strong");
        hpSpan.textContent = p.isAlive ? `${p.hp} HP remaining` : "Eliminated";

        row.appendChild(nameSpan);
        row.appendChild(hpSpan);
        summary.appendChild(row);
    });

    const actionsDiv = _el("div", "ta-finished-actions");

    const rematchBtn = _el("button", "ta-rematch-btn");
    rematchBtn.type = "button";
    rematchBtn.textContent = "Play Again";
    rematchBtn.addEventListener("click", () => {
        if (typeof actions.onRematch === "function") actions.onRematch();
    });

    const menuBtn = _el("button", "ta-menu-btn");
    menuBtn.type = "button";
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

// ─── Utility ──────────────────────────────────────────────────────────────────

function _el(tag, classes = "") {
    const el = document.createElement(tag);
    if (classes) {
        classes.split(" ").forEach(c => { if (c) el.classList.add(c); });
    }
    return el;
}
