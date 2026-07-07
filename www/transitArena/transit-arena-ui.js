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

    if (engine.status === "numberSelection") {
        _renderNumberSelection(engine, actions);
    } else if (engine.status === "playing") {
        _renderPlaying(engine, actions);
    } else if (engine.status === "finished") {
        _renderFinished(engine, actions);
    }
}

// ─── Number selection screen ──────────────────────────────────────────────────

function _renderNumberSelection(engine, actions) {
    const gameBoard = document.getElementById("gameBoard");
    gameBoard.innerHTML = "";

    const screen = _el("section", "ta-screen");
    const card = _el("article", "ta-card ta-numsel-card");

    const badge = _el("span", "ta-mode-badge");
    badge.textContent = "Transit Arena";
    card.appendChild(badge);

    const progress = _el("div", "ta-numsel-progress");
    progress.textContent = `Player ${engine.numberSelectionIndex + 1} of ${engine.players.length}`;
    card.appendChild(progress);

    const currentPlayer = engine.players[engine.numberSelectionIndex];
    const title = _el("h2", "ta-numsel-player-name");
    title.textContent = currentPlayer.name;
    card.appendChild(title);

    const help = _el("p", "ta-numsel-help");
    help.textContent = "Throw one dart with your weak hand. Enter the number you hit — this becomes your target number.";
    card.appendChild(help);

    const input = document.createElement("input");
    input.type = "tel";
    input.inputMode = "numeric";
    input.pattern = "[0-9]*";
    input.placeholder = "1 – 20";
    input.autocomplete = "off";
    input.classList.add("ta-numsel-input");
    input.setAttribute("data-numeric-gameplay", "");
    card.appendChild(input);

    const errorBox = _el("div", "ta-numsel-error");
    card.appendChild(errorBox);

    const confirmBtn = _el("button", "ta-numsel-confirm-btn");
    confirmBtn.type = "button";
    confirmBtn.textContent = "Confirm Number";

    function handleConfirm() {
        const value = input.value.trim();
        if (!value) {
            errorBox.textContent = "Enter a number between 1 and 20.";
            return;
        }
        const result = engine.confirmPlayerNumber(Number(value));
        if (!result.success) {
            errorBox.textContent = result.message;
            return;
        }
        errorBox.textContent = "";
        input.value = "";
        if (typeof actions.onNumberConfirmed === "function") actions.onNumberConfirmed();
    }

    confirmBtn.addEventListener("click", handleConfirm);
    input.addEventListener("keydown", e => { if (e.key === "Enter") handleConfirm(); });
    card.appendChild(confirmBtn);

    if (engine.history.length > 0) {
        const undoLink = _el("button", "ta-numsel-undo-btn");
        undoLink.type = "button";
        undoLink.textContent = "↶ Undo last";
        undoLink.addEventListener("click", () => {
            engine.undo();
            if (typeof actions.onNumberConfirmed === "function") actions.onNumberConfirmed();
        });
        card.appendChild(undoLink);
    }

    const playerList = _el("div", "ta-numsel-player-list");
    engine.players.forEach((p, i) => {
        const row = _el("div", "ta-numsel-player-row");
        if (i === engine.numberSelectionIndex) row.classList.add("current");
        else if (p.targetNumber !== null) row.classList.add("done");

        const nameSpan = _el("span", "ta-numsel-player-name-cell");
        nameSpan.textContent = p.name;

        const statusSpan = _el("strong", "ta-numsel-player-status");
        statusSpan.textContent = p.targetNumber !== null
            ? `#${p.targetNumber}`
            : i === engine.numberSelectionIndex ? "Now" : "Waiting";

        row.appendChild(nameSpan);
        row.appendChild(statusSpan);
        playerList.appendChild(row);
    });
    card.appendChild(playerList);

    screen.appendChild(card);
    gameBoard.appendChild(screen);
}

// ─── Playing screen ───────────────────────────────────────────────────────────

function _renderPlaying(engine, actions) {
    const gameBoard = document.getElementById("gameBoard");
    const screen = _el("section", "ta-screen");

    // 1. Top controls (title + undo)
    screen.appendChild(_makeTopCard(engine, actions));

    // 2. Special event card
    if (engine.activeSpecialEvent === "healers_round") {
        screen.appendChild(_makeHealerEventCard(engine));
    }

    // 3. Active power-up cards (0–2)
    if (engine.activePowerUps.length > 0) {
        const puArea = _el("div", "ta-powerup-cards");
        engine.activePowerUps.forEach(puEntry => puArea.appendChild(_makePowerUpCard(puEntry, actions)));
        screen.appendChild(puArea);
    }

    // 4. Player cards (active shows TURN badge + darts left)
    screen.appendChild(_makePlayersStrip(engine));

    // 5. Heal section (Healer's Round only)
    if (engine.activeSpecialEvent === "healers_round") {
        screen.appendChild(_makeHealSelfSection(engine, actions));
    }

    // 6. One attack section per alive opponent
    _makeAllOpponentAttackSections(engine, actions).forEach(s => screen.appendChild(s));

    // 7. Shield/bull utility + miss
    screen.appendChild(_makeActionRow(actions));

    // 9. Fixed-height result area — always reserves space so buttons never jump
    screen.appendChild(_makeResultArea(engine));

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
    if (engine.history.length > 0) undoBtn.classList.add("ta-undo-button--active");
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

// ─── Healer's Round event card ────────────────────────────────────────────────

function _makeHealerEventCard(engine) {
    const currentPlayer = engine.players[engine.currentPlayerIndex];
    const card = _el("div", "ta-card ta-event-card");

    const header = _el("div", "ta-event-header");
    const title = _el("span", "ta-event-title");
    title.textContent = "Healer's Round";
    const turns = _el("span", "ta-event-turns");
    turns.textContent = `${engine.healerTurnsRemaining} turn${engine.healerTurnsRemaining !== 1 ? "s" : ""} left`;
    header.appendChild(title);
    header.appendChild(turns);
    card.appendChild(header);

    const text = _el("p", "ta-event-text");
    text.textContent = `${currentPlayer.name}: hit #${currentPlayer.targetNumber} to heal — S=+1 HP · D=+2 HP · T=+3 HP`;
    card.appendChild(text);

    return card;
}

// ─── Players strip ────────────────────────────────────────────────────────────

function _makePlayersStrip(engine) {
    const strip = _el("div", "ta-players-strip");
    const dartsLeft = engine.maxDartsThisTurn - engine.dartsThisTurn;

    engine.players.forEach((player, i) => {
        const isActive = i === engine.currentPlayerIndex;

        const card = _el("div", "ta-player-card");
        if (isActive)          card.classList.add("active");
        if (!player.isAlive)   card.classList.add("dead");
        if (player.isAlive && !isActive && player.hp <= 3) card.classList.add("danger");

        // Name row
        const nameRow = _el("div", "ta-player-name-row");
        const nameSpan = _el("span", "ta-player-name");
        nameSpan.textContent = player.name;
        const numBadge = _el("span", "ta-player-num-badge");
        numBadge.textContent = `#${player.targetNumber}`;
        nameRow.appendChild(nameSpan);
        nameRow.appendChild(numBadge);
        if (isActive) {
            const turnBadge = _el("span", "ta-turn-badge");
            turnBadge.textContent = "TURN";
            nameRow.appendChild(turnBadge);
        }
        if (!player.isAlive) {
            const deadBadge = _el("span", "ta-dead-badge");
            deadBadge.textContent = "OUT";
            nameRow.appendChild(deadBadge);
        }

        // Darts left — only on active player card
        if (isActive) {
            const dartsLine = _el("div", "ta-player-darts-left");
            dartsLine.textContent = `${dartsLeft} dart${dartsLeft !== 1 ? "s" : ""} left`;
            card.appendChild(nameRow);
            card.appendChild(dartsLine);
        } else {
            card.appendChild(nameRow);
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

        // Shield row: pips + "X/5" text
        const shieldRow = _el("div", "ta-shield-row");
        const pipsRow = _el("div", "ta-shield-pips");
        for (let s = 0; s < 5; s++) {
            const pip = _el("span", "ta-shield-pip");
            if (s < player.shield) pip.classList.add("filled");
            pipsRow.appendChild(pip);
        }
        const shieldText = _el("span", "ta-shield-text");
        shieldText.textContent = `${player.shield}/5`;
        shieldRow.appendChild(pipsRow);
        shieldRow.appendChild(shieldText);

        // Active power-up icons
        const puIcons = _makePowerUpIcons(player);

        card.appendChild(hpBarWrap);
        card.appendChild(hpText);
        card.appendChild(shieldRow);
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

// ─── Active power-up card (one per entry) ─────────────────────────────────────

function _makePowerUpCard(puEntry, actions) {
    const pu = getPowerUpById(puEntry.id);

    const card = _el("div", "ta-card ta-powerup-card");

    const header = _el("div", "ta-powerup-header");
    const puNameEl = _el("span", "ta-powerup-name");
    puNameEl.textContent = pu ? pu.name : puEntry.id;

    const segLabel = _el("span", "ta-powerup-segment-label");
    segLabel.textContent = `Hit ${puEntry.segment}, then tap coin`;

    header.appendChild(puNameEl);
    header.appendChild(segLabel);
    card.appendChild(header);

    const effectP = _el("p", "ta-powerup-effect");
    effectP.textContent = pu ? pu.effectText : "";
    card.appendChild(effectP);

    const timerSpan = _el("span", "ta-powerup-timer");
    timerSpan.textContent = `${puEntry.turnsRemaining} turn${puEntry.turnsRemaining !== 1 ? "s" : ""} left`;
    card.appendChild(timerSpan);

    const coinWrap = _el("div", "ta-coin-wrap");
    const coin = _el("button", "ta-coin ta-coin--spinning");
    coin.type = "button";
    coin.setAttribute("aria-label", `Hit ${puEntry.segment} then tap to claim`);

    const coinSymbol = _el("span", "ta-coin-symbol");
    coinSymbol.textContent = pu ? pu.symbol : "?";
    coin.appendChild(coinSymbol);

    coin.addEventListener("click", () => {
        if (typeof actions.onClaimCoin === "function") actions.onClaimCoin(puEntry.uid);
    });

    coinWrap.appendChild(coin);

    const coinHint = _el("div", "ta-coin-hint");
    coinHint.textContent = "Claim if hit";
    coinWrap.appendChild(coinHint);
    card.appendChild(coinWrap);

    return card;
}

// ─── Heal self section (Healer's Round) ──────────────────────────────────────

function _makeHealSelfSection(engine, actions) {
    const currentPlayer = engine.players[engine.currentPlayerIndex];
    const n = currentPlayer.targetNumber;
    const section = _el("div", "ta-section ta-heal-section");

    const header = _el("div", "ta-section-header ta-section-header-heal");
    header.textContent = `Heal Yourself — #${n}`;
    section.appendChild(header);

    const grid = _el("div", "ta-attack-grid");

    [["S", "+1 HP"], ["D", "+2 HP"], ["T", "+3 HP"]].forEach(([prefix, desc]) => {
        const seg = `${prefix}${n}`;
        const btn = _el("button", "ta-action-btn ta-action-heal");
        btn.type = "button";

        const labelEl = _el("span", "ta-action-label");
        labelEl.textContent = seg;

        const descEl = _el("span", "ta-action-desc");
        descEl.textContent = desc;

        btn.appendChild(labelEl);
        btn.appendChild(descEl);
        btn.addEventListener("click", () => {
            if (typeof actions.onHealSelf === "function") actions.onHealSelf(prefix);
        });
        grid.appendChild(btn);
    });

    section.appendChild(grid);
    return section;
}

// ─── Target area (legacy helper, kept for reference) ─────────────────────────

function _makeTargetArea(engine, actions) {
    const opponents = engine.getAliveOpponentIndexes();
    const wrap = _el("div", "ta-target-area");

    if (opponents.length === 0) return wrap;

    const label = _el("span", "ta-target-label");
    label.textContent = "Target:";
    wrap.appendChild(label);

    if (opponents.length === 1) {
        const tPlayer = engine.players[opponents[0]];
        const autoSpan = _el("span", "ta-target-auto");
        autoSpan.textContent = `${tPlayer.name} #${tPlayer.targetNumber}`;
        wrap.appendChild(autoSpan);
    } else {
        opponents.forEach(idx => {
            const p = engine.players[idx];
            const btn = _el("button", "ta-target-btn");
            btn.type = "button";
            btn.textContent = `${p.name} #${p.targetNumber}`;
            if (idx === engine.selectedTargetIndex) btn.classList.add("active");
            btn.addEventListener("click", () => {
                if (typeof actions.onSelectTarget === "function") actions.onSelectTarget(idx);
            });
            wrap.appendChild(btn);
        });
    }

    return wrap;
}

// ─── Throws log ───────────────────────────────────────────────────────────────

function _makeThrowsLog(engine) {
    const row = _el("div", "ta-turn-throws");
    engine.turnThrows.forEach(t => {
        const chip = _el("span", "ta-throw-chip");
        const cls = t.effect === "damage"  ? "damage"
                  : t.effect === "blocked" ? "blocked"
                  : t.effect === "shield"  ? "shield"
                  : t.effect === "heal"    ? "heal"
                  : "none";
        chip.classList.add(cls);
        chip.textContent = t.label;
        row.appendChild(chip);
    });
    return row;
}

// ─── Result area (fixed height — keeps buttons stable) ────────────────────────

function _makeResultArea(engine) {
    const area = _el("div", "ta-result-area");
    if (engine.turnThrows.length > 0) area.appendChild(_makeThrowsLog(engine));
    if (engine.lastResult) area.appendChild(_makeResultMsg(engine));
    return area;
}

// ─── Result message ───────────────────────────────────────────────────────────

function _makeResultMsg(engine) {
    const msg = _el("div", "ta-result-msg");
    const lr = engine.lastResult;
    if (lr.type === "powerUpClaimed")  msg.classList.add("claimed");
    else if (lr.type === "hint")       msg.classList.add("hint");
    else if (lr.type === "shield")     msg.classList.add("shield");
    else if (lr.type === "heal")       msg.classList.add("heal");
    else if (lr.type === "event")      msg.classList.add("event");
    else if (lr.type === "powerUpExpired") msg.classList.add("expired");
    else if (lr.type === "powerUpSpawned") msg.classList.add("spawned");
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

        const isPuTarget = engine.activePowerUps.some(pu => pu.segment === segment);
        if (isPuTarget) btn.classList.add("power-up-target");

        btn.addEventListener("click", () => {
            if (typeof actions.onThrowSegment === "function") {
                actions.onThrowSegment(segment);
            }
        });
        grid.appendChild(btn);
    }
    return grid;
}

// ─── Attack sections (one per alive opponent) ─────────────────────────────────

function _makeAllOpponentAttackSections(engine, actions) {
    const opponents = engine.getAliveOpponentIndexes();

    if (opponents.length === 0) {
        const section = _el("div", "ta-section ta-attack-section");
        const msg = _el("p", "ta-no-target-msg");
        msg.textContent = "No alive opponents remaining.";
        section.appendChild(msg);
        return [section];
    }

    // Build segment→name map across all active power-ups for dual-button highlighting
    const puSegMap = {};
    engine.activePowerUps.forEach(pu => {
        puSegMap[pu.segment] = getPowerUpById(pu.id)?.name || pu.id;
    });

    return opponents.map(idx => {
        const opponent = engine.players[idx];
        const n = opponent.targetNumber;
        const section = _el("div", "ta-section ta-attack-section");

        const header = _el("div", "ta-section-header ta-section-header-attack");
        header.textContent = `Attack ${opponent.name} #${n}`;
        section.appendChild(header);

        const grid = _el("div", "ta-attack-grid");

        [["S", 1, "Single"], ["D", 2, "Double"], ["T", 3, "Triple"]].forEach(([prefix, multiplier, label]) => {
            const seg = `${prefix}${n}`;
            const btn = _el("button", "ta-action-btn ta-action-attack");
            btn.type = "button";

            const labelEl = _el("span", "ta-action-label");
            labelEl.textContent = seg;

            const descEl = _el("span", "ta-action-desc");
            let descText = `${label} · ${multiplier} dmg`;
            if (puSegMap[seg]) {
                descText += ` + ${puSegMap[seg]}`;
                btn.classList.add("ta-action-dual");
            }
            descEl.textContent = descText;

            btn.appendChild(labelEl);
            btn.appendChild(descEl);
            btn.addEventListener("click", () => {
                if (typeof actions.onThrowSegmentAtTarget === "function") {
                    actions.onThrowSegmentAtTarget(seg, idx);
                }
            });
            grid.appendChild(btn);
        });

        section.appendChild(grid);
        return section;
    });
}

// ─── Power-up objective sections (PUs whose segment # ≠ any opponent's target) ─

function _makePowerUpObjectiveSections(engine, actions) {
    if (engine.activePowerUps.length === 0) return [];

    const opponents = engine.getAliveOpponentIndexes();
    const opponentNumbers = opponents.map(idx => engine.players[idx].targetNumber);

    return engine.activePowerUps
        .filter(puEntry => {
            const puNumber = parseInt(puEntry.segment.slice(1), 10);
            return !opponentNumbers.includes(puNumber);
        })
        .map(puEntry => {
            const puName = getPowerUpById(puEntry.id)?.name || puEntry.id;
            const section = _el("div", "ta-section ta-powerup-objective-section");

            const header = _el("div", "ta-section-header ta-section-header-powerup");
            header.textContent = `Hit ${puEntry.segment} to claim ${puName}`;
            section.appendChild(header);

            const btn = _el("button", "ta-action-btn ta-action-powerup-obj");
            btn.type = "button";

            const labelEl = _el("span", "ta-action-label");
            labelEl.textContent = puEntry.segment;

            const descEl = _el("span", "ta-action-desc");
            descEl.textContent = `claim ${puName}`;

            btn.appendChild(labelEl);
            btn.appendChild(descEl);
            btn.addEventListener("click", () => {
                if (typeof actions.onThrowSegment === "function") actions.onThrowSegment(puEntry.segment);
            });

            section.appendChild(btn);
            return section;
        });
}

// ─── Action row (shield bulls + miss) ────────────────────────────────────────

function _makeBullBtn(topText, subText, onClick) {
    const btn = _el("button", "ta-bull-btn");
    btn.type = "button";
    const labelEl = _el("span", "ta-bull-label");
    labelEl.textContent = topText;
    const descEl = _el("span", "ta-bull-desc");
    descEl.textContent = subText;
    btn.appendChild(labelEl);
    btn.appendChild(descEl);
    btn.addEventListener("click", onClick);
    return btn;
}

function _makeActionRow(actions) {
    const wrap = _el("div", "ta-action-row-wrap");

    const bullMissRow = _el("div", "ta-action-row");

    bullMissRow.appendChild(_makeBullBtn("Outer Bull 25", "+1 Shield", () => {
        if (typeof actions.onOuterBull === "function") actions.onOuterBull();
    }));

    bullMissRow.appendChild(_makeBullBtn("Bull 50", "+3 Shield", () => {
        if (typeof actions.onBull === "function") actions.onBull();
    }));

    const missBtn = _el("button", "ta-miss-btn");
    missBtn.type = "button";
    missBtn.textContent = "Miss";
    missBtn.addEventListener("click", () => {
        if (typeof actions.onMiss === "function") actions.onMiss();
    });
    bullMissRow.appendChild(missBtn);

    const nextTurnBtn = _el("button", "ta-next-turn-btn");
    nextTurnBtn.type = "button";
    nextTurnBtn.textContent = "Next Turn →";
    nextTurnBtn.addEventListener("click", () => {
        if (typeof actions.onNextTurn === "function") actions.onNextTurn();
    });

    wrap.appendChild(bullMissRow);
    wrap.appendChild(nextTurnBtn);
    return wrap;
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
