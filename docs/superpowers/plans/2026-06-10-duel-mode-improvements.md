# Duel Mode Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Duel mode with negative-HP last-chance survival, faster heal-target timing, clearer active-player UI, LAST CHANCE banner, muted irrelevant numbers, green bull buttons, and an info panel.

**Architecture:** Three focused file changes — engine logic in `duel-engine.js`, visual additions in `duel.css`, UI patches inside `_renderPlaying()` in `duel-ui.js`. No other files touched.

**Tech Stack:** Vanilla ES modules, DOM API (no innerHTML — security hook blocks it), CSS custom properties from dark neon theme.

---

## File Map

| File | Change type | What changes |
|---|---|---|
| `www/duel/duel-engine.js` | Logic patches | `_randomHealInterval`, `throwNumber`, `_endTurn` |
| `www/css/duel.css` | Additions only | 12 new selectors + keyframe + media query |
| `www/duel/duel-ui.js` | Patches inside `_renderPlaying()` | Title row, player cards, banner, grid, bull buttons |

---

## Task 1 — Engine: heal interval, remove HP clamp, last-chance check

**Files:**
- Modify: `www/duel/duel-engine.js:90` (remove clamp)
- Modify: `www/duel/duel-engine.js:101-107` (remove immediate-win block)
- Modify: `www/duel/duel-engine.js:159-191` (add last-chance check at top of `_endTurn`)
- Modify: `www/duel/duel-engine.js:193-195` (heal interval 5-10 → 3-6)

- [ ] **Step 1: Change `_randomHealInterval` to return 3–6 (was 5–10)**

In `www/duel/duel-engine.js` line 194, replace:
```js
_randomHealInterval() {
    return Math.floor(Math.random() * 6) + 5; // 5–10
}
```
With:
```js
_randomHealInterval() {
    return Math.floor(Math.random() * 4) + 3; // 3–6
}
```

- [ ] **Step 2: Remove HP clamp in `throwNumber` (line 90)**

Replace:
```js
        defender.hp = Math.max(0, defender.hp - m);
```
With:
```js
        defender.hp = defender.hp - m;
```

- [ ] **Step 3: Remove immediate-win block from `throwNumber` (lines 101–107)**

Remove this entire block (it sits just after `this.turnThrows.push(...)`):
```js
        if (effect === "damage" && defender.hp <= 0) {
            defender.isAlive = false;
            this.winnerPlayerIndex = attackerIndex;
            this.phase = "finished";
            this.setLastResult("success", `${attacker.name} wins!`);
            return;
        }
```

- [ ] **Step 4: Add last-chance elimination check at top of `_endTurn`**

Replace the opening of `_endTurn`:
```js
    _endTurn() {
        if (this.activeHealTarget !== null) {
```
With:
```js
    _endTurn() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.hp <= 0) {
            currentPlayer.isAlive = false;
            const opponentIndex = 1 - this.currentPlayerIndex;
            this.winnerPlayerIndex = opponentIndex;
            this.phase = "finished";
            this.setLastResult(
                "success",
                `${this.players[opponentIndex].name} wins! ${currentPlayer.name} could not recover.`
            );
            return;
        }

        if (this.activeHealTarget !== null) {
```

- [ ] **Step 5: Manual smoke test**

Open the app in browser. Start a Duel game. During play:
- Attack opponent 3 times to get their HP to 0 or below → they should NOT be eliminated yet; the game continues to their turn.
- On the danger player's turn, miss all 3 darts → game should end with the other player winning.
- Repeat but have the danger player hit Outer Bull → they should heal and survive.

- [ ] **Step 6: Commit engine changes**

```bash
git add www/duel/duel-engine.js
git commit -m "feat(duel): negative HP last-chance survival + 3-6 heal interval"
```

---

## Task 2 — CSS: all new visual states

**Files:**
- Modify: `www/css/duel.css` (append new rules at end of file)

- [ ] **Step 1: Append new CSS to end of `www/css/duel.css`**

Add this entire block at the very end of the file:

```css
/* =====================================================
   IMPROVEMENTS — active/inactive player cards
   ===================================================== */

.duel-player-hp-card.active {
    border-color: rgba(220, 38, 38, 0.65);
    background: rgba(220, 38, 38, 0.13);
    box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.22);
}

.duel-player-hp-card.inactive {
    opacity: 0.45;
}

/* YOUR TURN badge */

.duel-your-turn-badge {
    display: inline-block;
    font-size: 0.58rem;
    font-weight: 900;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #fff;
    background: #dc2626;
    border-radius: 4px;
    padding: 0.1rem 0.35rem;
    white-space: nowrap;
}

/* Danger HP state */

.duel-hp-text.danger {
    color: #f87171;
    font-weight: 800;
}

.duel-hp-bar.danger {
    background: rgba(220, 38, 38, 0.5);
}

.duel-hp-bar-wrap.danger {
    background: rgba(220, 38, 38, 0.2);
}

/* LAST CHANCE banner */

@keyframes duel-danger-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
    50%       { box-shadow: 0 0 0 7px rgba(220, 38, 38, 0); }
}

.duel-last-chance-banner {
    padding: 0.65rem 0.9rem;
    border-radius: 10px;
    background: rgba(220, 38, 38, 0.2);
    border: 1px solid rgba(220, 38, 38, 0.55);
    color: #fca5a5;
    font-size: 0.84rem;
    font-weight: 800;
    text-align: center;
    animation: duel-danger-pulse 1.2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
    .duel-last-chance-banner {
        animation: none;
    }
}

/* Muted irrelevant numbers */

.duel-number-grid button.duel-irrelevant {
    opacity: 0.28;
    color: var(--text-muted);
}

/* Bull buttons — healing green */

.duel-bull-button.duel-bull-heal {
    background: rgba(46, 213, 115, 0.15);
    border-color: rgba(46, 213, 115, 0.4);
    color: #6ee7b7;
}

/* Info button */

.duel-info-button {
    padding: 0.38rem 0.6rem;
    min-height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(96, 165, 250, 0.45);
    background: rgba(96, 165, 250, 0.1);
    color: #93c5fd;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
}

/* Title actions group (info + undo grouped right) */

.duel-title-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

/* Info panel */

.duel-info-panel {
    display: none;
    padding: 0.65rem 0.75rem;
    border-radius: 9px;
    background: rgba(96, 165, 250, 0.08);
    border: 1px solid rgba(96, 165, 250, 0.22);
    font-size: 0.78rem;
    color: var(--text-muted);
    line-height: 1.6;
}

.duel-info-panel.visible {
    display: block;
}

.duel-info-panel p {
    margin: 0.2rem 0;
}

.duel-info-panel p strong {
    color: var(--text-main);
}
```

- [ ] **Step 2: Verify CSS loads without error**

Open browser dev tools → Console. Reload the app. No CSS parse errors should appear.

- [ ] **Step 3: Commit CSS**

```bash
git add www/css/duel.css
git commit -m "feat(duel): add CSS for inactive/danger/banner/irrelevant/info-panel states"
```

---

## Task 3 — UI: patch `_renderPlaying()` in `duel-ui.js`

All changes are inside `_renderPlaying()`. The function spans lines 125–320.

**Files:**
- Modify: `www/duel/duel-ui.js:134-149` (title row — add info button + panel)
- Modify: `www/duel/duel-ui.js:155-189` (player cards — inactive class, YOUR TURN badge, danger HP)
- Modify: `www/duel/duel-ui.js:247` (after topCard append — insert LAST CHANCE banner)
- Modify: `www/duel/duel-ui.js:269-281` (number grid — add duel-irrelevant class)
- Modify: `www/duel/duel-ui.js:287-302` (bull buttons — add duel-bull-heal class)

- [ ] **Step 1: Rebuild the title row with info button and panel**

Replace the existing title row block (lines 134–149):
```js
    // Title row with mode badge + undo
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
```
With:
```js
    // Title row: [DUEL badge]  [ℹ info] [↶ undo]
    const titleRow = document.createElement("div");
    titleRow.classList.add("duel-title-row");

    const modeBadge = document.createElement("span");
    modeBadge.classList.add("duel-mode-badge");
    modeBadge.textContent = "Duel";

    const titleActions = document.createElement("div");
    titleActions.classList.add("duel-title-actions");

    const infoBtn = document.createElement("button");
    infoBtn.type = "button";
    infoBtn.classList.add("duel-info-button");
    infoBtn.textContent = "ℹ";
    infoBtn.setAttribute("aria-label", "How to play");

    const undoBtn = document.createElement("button");
    undoBtn.type = "button";
    undoBtn.classList.add("duel-undo-button");
    undoBtn.textContent = "↶ Undo";
    undoBtn.disabled = duelEngine.history.length === 0;
    undoBtn.addEventListener("click", () => {
        if (typeof actions.onUndo === "function") actions.onUndo();
    });

    // Info panel (hidden by default, toggled by infoBtn)
    const infoPanel = document.createElement("div");
    infoPanel.classList.add("duel-info-panel");
    infoBtn.addEventListener("click", () => {
        infoPanel.classList.toggle("visible");
    });
    const infoPanelItems = [
        ["Attack", "Hit the red number to deal damage (S=1, D=2, T=3 HP)."],
        ["Heal", "Outer Bull 25 = +1 HP · Bull 50 = +2 HP. Always heal you."],
        ["Heal Target", "Every 3–6 rounds a green number appears. Hit it to recover HP (S=+1, D=+2, T=+3 HP)."],
        ["Last Chance", "If your HP drops to 0 or below, you get one full turn to heal back above 0. Fail → eliminated."],
        ["Undo", "Tap ↶ Undo to reverse your last dart."],
    ];
    infoPanelItems.forEach(([title, desc]) => {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = title + ": ";
        p.appendChild(strong);
        p.appendChild(document.createTextNode(desc));
        infoPanel.appendChild(p);
    });

    titleActions.appendChild(infoBtn);
    titleActions.appendChild(undoBtn);
    titleRow.appendChild(modeBadge);
    titleRow.appendChild(titleActions);
    topCard.appendChild(titleRow);
    topCard.appendChild(infoPanel);
```

- [ ] **Step 2: Add inactive class, YOUR TURN badge, danger HP state to player cards**

Replace the player card loop (lines 155–198, from `duelEngine.players.forEach` through the closing `}`):
```js
    duelEngine.players.forEach((player, i) => {
        const isActive = i === duelEngine.currentPlayerIndex;
        const pcard = document.createElement("div");
        pcard.classList.add("duel-player-hp-card");
        if (isActive) pcard.classList.add("active");

        const nameRow = document.createElement("div");
        nameRow.classList.add("duel-player-name-row");
        const nameSpan = document.createElement("span");
        nameSpan.classList.add("duel-player-name");
        nameSpan.textContent = player.name;
        const numBadge = document.createElement("span");
        numBadge.classList.add("duel-player-number");
        numBadge.textContent = `#${player.number}`;
        nameRow.appendChild(nameSpan);
        nameRow.appendChild(numBadge);

        const hpText = document.createElement("div");
        hpText.classList.add("duel-hp-text");
        hpText.textContent = `${player.hp} / ${player.maxHp} HP`;

        const hpBarWrap = document.createElement("div");
        hpBarWrap.classList.add("duel-hp-bar-wrap");
        const hpBar = document.createElement("div");
        hpBar.classList.add("duel-hp-bar");
        const pct = Math.max(0, Math.round((player.hp / player.maxHp) * 100));
        hpBar.style.width = `${pct}%`;
        if (pct <= 30) hpBar.classList.add("low");
        else if (pct <= 60) hpBar.classList.add("mid");
        hpBarWrap.appendChild(hpBar);

        pcard.appendChild(nameRow);
        pcard.appendChild(hpText);
        pcard.appendChild(hpBarWrap);
        hpSection.appendChild(pcard);
    });
```
With:
```js
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
        if (isActive) {
            const yourTurnBadge = document.createElement("span");
            yourTurnBadge.classList.add("duel-your-turn-badge");
            yourTurnBadge.textContent = "YOUR TURN";
            nameRow.appendChild(nameSpan);
            nameRow.appendChild(yourTurnBadge);
        } else {
            nameRow.appendChild(nameSpan);
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
```

- [ ] **Step 3: Insert LAST CHANCE banner after topCard is appended**

Replace:
```js
    screen.appendChild(topCard);

    // Multiplier row
```
With:
```js
    screen.appendChild(topCard);

    // LAST CHANCE banner — shown when current player's HP is <= 0
    if (currentPlayer.hp <= 0) {
        const banner = document.createElement("div");
        banner.classList.add("duel-last-chance-banner");
        banner.textContent = "⚠ LAST CHANCE — heal above 0 before your turn ends!";
        screen.appendChild(banner);
    }

    // Multiplier row
```

- [ ] **Step 4: Add `duel-irrelevant` class to non-target numbers in the grid**

Replace:
```js
        if (n === opponentNumber) btn.classList.add("duel-attack-target");
        if (n === duelEngine.activeHealTarget) btn.classList.add("duel-heal-target");
```
With:
```js
        if (n === opponentNumber) {
            btn.classList.add("duel-attack-target");
        } else if (n === duelEngine.activeHealTarget) {
            btn.classList.add("duel-heal-target");
        } else {
            btn.classList.add("duel-irrelevant");
        }
```

- [ ] **Step 5: Add `duel-bull-heal` class to both bull buttons**

Replace:
```js
    outerBullBtn.classList.add("duel-bull-button");
```
With:
```js
    outerBullBtn.classList.add("duel-bull-button", "duel-bull-heal");
```

And replace:
```js
    bullBtn.classList.add("duel-bull-button");
```
With:
```js
    bullBtn.classList.add("duel-bull-button", "duel-bull-heal");
```

- [ ] **Step 6: Manual verification checklist**

Open the app in browser, start a Duel game, and verify:

1. **Info button** — tapping ℹ shows/hides the blue info panel with all 5 rule items.
2. **YOUR TURN badge** — active player's card shows a red "YOUR TURN" chip; inactive player is dimmed (~45% opacity).
3. **Active card glow** — active player's HP card has a stronger red border + glow vs the old faint border.
4. **Number grid** — only the opponent's number (red) and heal target (green, if active) are fully bright; all other numbers are muted (~30% opacity).
5. **Bull buttons** — Outer Bull 25 and Bull 50 both appear green.
6. **Last chance** — reduce a player to ≤ 0 HP. On their next turn, verify: red "⚠ LAST CHANCE" banner is visible and pulsing; HP text is red; HP bar track is red-tinted; attack buttons are NOT disabled; all normal actions work.
7. **Survival** — in the last-chance scenario, hit Outer Bull → HP goes to 1 → banner disappears → player survives.
8. **Undo in danger state** — hit undo after going negative → HP restores to pre-throw value → banner disappears.
9. **Elimination** — miss 3 darts while in last chance → game ends with the opponent winning.

- [ ] **Step 7: Commit UI changes**

```bash
git add www/duel/duel-ui.js
git commit -m "feat(duel): info panel, YOUR TURN badge, LAST CHANCE banner, muted grid, green bulls"
```
