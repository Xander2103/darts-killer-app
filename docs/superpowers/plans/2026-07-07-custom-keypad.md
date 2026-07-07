# Custom Numeric Keypad — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every native `<input type="number">` used for gameplay score / target-number entry with a shared inline custom keypad that never opens the iOS system keyboard.

**Architecture:** `makeKeypad(config)` in `www/shared/custom-keypad.js` returns `{ el, setValue, getValue, clear, showError }`. Callers append `el` where the old input was. State (the typed digit string) is closure-local — no globals. CSS lives in `www/css/custom-keypad.css` under the `.ck-*` namespace.

**Tech Stack:** Vanilla ES-module JavaScript, vanilla CSS custom properties, Capacitor iOS WKWebView.

## Global Constraints

- No `<input type="number">`, `inputMode="numeric"`, or `.focus()` on any numeric input during gameplay.
- All JS files are ES modules (loaded transitively from `main.js` via `<script type="module">`).
- Import path from `www/`: `"./shared/custom-keypad.js"`. From `www/x01/`, `www/halveIt/`, `www/duel/`, `www/transitArena/`: `"../shared/custom-keypad.js"`.
- CSS class prefix: `.ck-keypad*`. Never add `.x01-keypad*` classes.
- Keypad layout (top-to-bottom): display → error → 1 2 3 → 4 5 6 → 7 8 9 → (Miss?) 0 ← → Submit → (Undo?).
- `showMiss: true` only for Classic x01.
- `emptyIsZero: false` + `minValue: 1` for all 1–20 number-selection screens.
- `emptyIsZero: true` + `minValue: 0` for all score-entry screens (Halve It, Checkout, Classic).
- Keep `#checkoutCustomStart` and `#checkoutCustomRounds` as native inputs (pre-game config).
- Keep all player-name text inputs native.
- After every `www/` edit, the matching file in `ios/App/App/public/` must be updated (Task 9).

---

### Task 1: Shared CSS

**Files:**
- Create: `www/css/custom-keypad.css`
- Modify: `www/index.html` — add `<link>` before existing CSS links
- Modify: `www/css/x01.css` — remove the `.x01-keypad` block (lines ~1112–1211)

**Interfaces:**
- Produces: `.ck-keypad`, `.ck-keypad-display`, `.ck-keypad-display-empty`, `.ck-keypad-error`, `.ck-keypad-grid`, `.ck-keypad-btn`, `.ck-keypad-miss-btn`, `.ck-keypad-backspace-btn`, `.ck-keypad-zero-wide`, `.ck-keypad-submit`, `.ck-keypad-undo`

- [ ] **Step 1: Create `www/css/custom-keypad.css`**

```css
/* www/css/custom-keypad.css
   Shared inline numeric keypad. No native input — no iOS keyboard.
   Used by Classic, Halve It, 121 Checkout, Killer/Duel/Transit number selection.
*/

.ck-keypad {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: 14px;
    padding: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.ck-keypad-display {
    width: 100%;
    min-height: 68px;
    padding: 0.6rem 0.75rem;
    font-size: 2.6rem;
    font-weight: 800;
    text-align: center;
    background: transparent;
    border: 1px solid var(--border-card);
    border-radius: 10px;
    color: var(--text-main);
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    box-sizing: border-box;
    letter-spacing: -0.02em;
    transition: color 0.1s;
}

.ck-keypad-display-empty {
    color: var(--text-muted);
    font-size: 1.8rem;
    font-weight: 400;
}

.ck-keypad-error {
    color: #f87171;
    font-size: 0.8rem;
    min-height: 1.1em;
    text-align: center;
    padding: 0 0.2rem;
}

.ck-keypad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
}

.ck-keypad-btn {
    min-height: 54px;
    padding: 0.55rem 0.3rem;
    font-size: 1.3rem;
    font-weight: 700;
    border: 1px solid var(--border-card);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-main);
    cursor: pointer;
    font-family: inherit;
    text-align: center;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.1s;
    touch-action: manipulation;
    user-select: none;
}

.ck-keypad-btn:hover {
    background: rgba(255, 255, 255, 0.10);
}

.ck-keypad-btn:active {
    background: rgba(34, 197, 94, 0.22);
    transform: scale(0.95);
}

.ck-keypad-miss-btn {
    border-color: rgba(248, 113, 113, 0.35);
    background: rgba(248, 113, 113, 0.08);
    color: #f87171;
    font-size: 1rem;
}

.ck-keypad-miss-btn:hover { background: rgba(248, 113, 113, 0.16); }
.ck-keypad-miss-btn:active { background: rgba(248, 113, 113, 0.28); transform: scale(0.95); }

.ck-keypad-backspace-btn {
    border-color: rgba(251, 191, 36, 0.3);
    background: rgba(251, 191, 36, 0.07);
    color: #fbbf24;
}

.ck-keypad-backspace-btn:hover { background: rgba(251, 191, 36, 0.15); }
.ck-keypad-backspace-btn:active { background: rgba(251, 191, 36, 0.25); transform: scale(0.95); }

/* When Miss is hidden: 0 spans 2 of the 3 grid columns */
.ck-keypad-zero-wide {
    grid-column: span 2;
}

.ck-keypad-submit {
    width: 100%;
    padding: 0.8rem;
    font-size: 1rem;
    font-weight: 800;
    border: none;
    border-radius: 10px;
    background: rgba(34, 197, 94, 0.85);
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
}

.ck-keypad-submit:hover  { background: rgba(34, 197, 94, 1); }
.ck-keypad-submit:active { background: rgba(34, 197, 94, 1); }

.ck-keypad-undo {
    width: 100%;
    padding: 0.7rem;
    font-size: 0.85rem;
    font-weight: 700;
    border: 1px solid var(--border-card);
    border-radius: 10px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, color 0.15s;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
}

.ck-keypad-undo:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-main);
}

.ck-keypad-undo:disabled {
    opacity: 0.3;
    cursor: default;
}
```

- [ ] **Step 2: Add link in `www/index.html`**

In the `<head>`, add the new line immediately before the existing `<link rel="stylesheet" href="style.css">`:

```html
    <link rel="stylesheet" href="css/custom-keypad.css">
    <link rel="stylesheet" href="style.css">
```

- [ ] **Step 3: Remove `.x01-keypad*` block from `www/css/x01.css`**

Delete the entire block from the comment `/* ─── Custom keypad — Turn Total mode ...` through the last rule `.x01-keypad-backspace-btn:active { ... }` (approximately lines 1112–1211). These rules are fully replaced by the `.ck-keypad*` rules in `custom-keypad.css`.

- [ ] **Step 4: Verify in browser**

Open `www/index.html` in a browser. Open DevTools → Elements. Confirm `custom-keypad.css` loads (check Network tab: HTTP 200). Confirm no console errors about missing stylesheets.

---

### Task 2: Shared Factory

**Files:**
- Create: `www/shared/custom-keypad.js`

**Interfaces:**
- Produces: `export function makeKeypad(config)` → `{ el: HTMLDivElement, setValue(n: number): void, getValue(): string, clear(): void, showError(msg: string): void }`

- [ ] **Step 1: Create `www/shared/custom-keypad.js`**

```js
// www/shared/custom-keypad.js
// Shared inline numeric keypad. Returns { el, setValue, getValue, clear, showError }.
// No native <input> — no iOS keyboard, no WKWebView viewport shift.

export function makeKeypad({
    maxValue     = 180,
    maxDigits    = 3,
    minValue     = 0,
    showMiss     = false,
    emptyIsZero  = true,
    placeholder  = "–",
    submitLabel  = "Enter Score",
    onSubmit,
    onUndo,
    undoDisabled = false,
} = {}) {
    if (typeof onSubmit !== "function") throw new Error("makeKeypad: onSubmit is required");

    let _typed = "";

    // Root element
    const el = document.createElement("div");
    el.className = "ck-keypad";

    // Display (never focused — never triggers iOS keyboard)
    const display = document.createElement("div");
    el.appendChild(display);
    _refresh();

    // Inline error (used for both local validation and engine-level errors via showError)
    const errorEl = document.createElement("div");
    errorEl.className = "ck-keypad-error";
    el.appendChild(errorEl);

    // Digit grid: 1 2 3 / 4 5 6 / 7 8 9
    const grid = document.createElement("div");
    grid.className = "ck-keypad-grid";
    for (const d of ["1","2","3","4","5","6","7","8","9"]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ck-keypad-btn";
        btn.textContent = d;
        btn.addEventListener("click", () => _addDigit(d));
        grid.appendChild(btn);
    }
    el.appendChild(grid);

    // Bottom row: Miss? | 0 | ⌫
    const bottomRow = document.createElement("div");
    bottomRow.className = "ck-keypad-grid";

    if (showMiss) {
        const missBtn = document.createElement("button");
        missBtn.type = "button";
        missBtn.className = "ck-keypad-btn ck-keypad-miss-btn";
        missBtn.textContent = "Miss";
        missBtn.addEventListener("click", () => {
            _typed = "";
            _refresh();
            _clearError();
            onSubmit(0);
        });
        bottomRow.appendChild(missBtn);
    }

    const zeroBtn = document.createElement("button");
    zeroBtn.type = "button";
    zeroBtn.className = "ck-keypad-btn" + (showMiss ? "" : " ck-keypad-zero-wide");
    zeroBtn.textContent = "0";
    zeroBtn.addEventListener("click", () => _addDigit("0"));
    bottomRow.appendChild(zeroBtn);

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "ck-keypad-btn ck-keypad-backspace-btn";
    backBtn.textContent = "⌫";
    backBtn.addEventListener("click", () => {
        _typed = _typed.slice(0, -1);
        _refresh();
    });
    bottomRow.appendChild(backBtn);
    el.appendChild(bottomRow);

    // Submit button
    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "ck-keypad-submit";
    submitBtn.textContent = submitLabel;
    submitBtn.addEventListener("click", _doSubmit);
    el.appendChild(submitBtn);

    // Undo button (optional)
    if (typeof onUndo === "function") {
        const undoBtn = document.createElement("button");
        undoBtn.type = "button";
        undoBtn.className = "ck-keypad-undo";
        undoBtn.textContent = "↶ Undo";
        undoBtn.disabled = undoDisabled;
        undoBtn.addEventListener("click", onUndo);
        el.appendChild(undoBtn);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    function _refresh() {
        display.textContent = _typed || placeholder;
        display.className = "ck-keypad-display" + (_typed ? "" : " ck-keypad-display-empty");
    }

    function _clearError() {
        errorEl.textContent = "";
    }

    function _addDigit(d) {
        _clearError();
        // Replace a lone "0" to prevent leading zeros (e.g. "01")
        const candidate = (_typed === "0") ? d : (_typed + d);
        if (candidate.length > maxDigits || parseInt(candidate, 10) > maxValue) return;
        _typed = candidate;
        _refresh();
    }

    function _doSubmit() {
        _clearError();
        const n = _typed === "" ? (emptyIsZero ? 0 : -1) : parseInt(_typed, 10);
        if (n < minValue) {
            errorEl.textContent = `Enter a number between ${minValue} and ${maxValue}.`;
            return;
        }
        _typed = "";
        _refresh();
        onSubmit(n);
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    function setValue(n) {
        _typed = String(Math.max(minValue, Math.min(maxValue, Math.round(Number(n)))));
        _refresh();
        _clearError();
    }

    function getValue() { return _typed; }

    function clear() { _typed = ""; _refresh(); _clearError(); }

    function showError(msg) { errorEl.textContent = msg; }

    return { el, setValue, getValue, clear, showError };
}
```

- [ ] **Step 2: Smoke test in browser console**

Open `www/index.html`, open DevTools console, run:
```js
import("./shared/custom-keypad.js").then(m => {
  const kp = m.makeKeypad({ onSubmit: n => console.log("submitted:", n) });
  document.body.appendChild(kp.el);
  console.log("keypad appended");
});
```
Expected: a `.ck-keypad` element appears at the bottom of the page, no console errors.

---

### Task 3: Refactor Classic x01

**Files:**
- Modify: `www/x01/x01-ui.js`

**Interfaces:**
- Consumes: `makeKeypad` from `../shared/custom-keypad.js`
- Removes: `let _typedScore`, `_typedScore = ""` in `clearX01SetupState`, entire `_makeKeypad()` function (lines 744–858)

- [ ] **Step 1: Add import at the top of `www/x01/x01-ui.js`**

After the comment `// www/x01/x01-ui.js`, add:
```js
import { makeKeypad } from "../shared/custom-keypad.js";
```

- [ ] **Step 2: Remove `_typedScore` module variable**

Delete line 12:
```js
let _typedScore = ""; // custom keypad state — no native input needed
```

- [ ] **Step 3: Remove `_typedScore = ""` from `clearX01SetupState`**

In `clearX01SetupState()`, delete:
```js
    _typedScore = "";
```

- [ ] **Step 4: Replace `_makeKeypad()` call in `_renderGame()`**

Find (around line 608):
```js
        screen.appendChild(_makeKeypad(engine, actions));
```

Replace with:
```js
        const kp = makeKeypad({
            maxValue: 180,
            maxDigits: 3,
            minValue: 0,
            showMiss: true,
            emptyIsZero: true,
            placeholder: "–",
            submitLabel: "Enter Score",
            onSubmit: (val) => {
                engine.submitScore(val);
                if (typeof actions.onRender === "function") actions.onRender();
            },
            onUndo: () => {
                engine.undo();
                if (typeof actions.onRender === "function") actions.onRender();
            },
            undoDisabled: engine.history.length === 0,
        });
        screen.appendChild(kp.el);
```

- [ ] **Step 5: Delete the entire local `_makeKeypad()` function**

Delete from `// ─── TOTAL MODE: CUSTOM KEYPAD ...` comment through the closing `}` of `_makeKeypad` (lines ~742–858 inclusive).

- [ ] **Step 6: Verify Classic mode in browser**

Open `www/index.html` → Classic → start a 2-player game. Confirm:
- Keypad appears (display showing "–", digit grid 1–9, 0, ⌫, Miss, Enter Score, ↶ Undo)
- Tapping digits updates the display
- Enter Score submits and re-renders
- Miss submits 0 and re-renders
- ⌫ removes the last digit
- ↶ Undo is disabled at game start (first turn), enabled after first score
- No `✓ CUSTOM KEYPAD ACTIVE` debug div (it was inside the deleted `_makeKeypad`)
- No native iOS keyboard opens

---

### Task 4: Halve It

**Files:**
- Modify: `www/halveIt/halveItUi.js`

**Interfaces:**
- Consumes: `makeKeypad` from `../shared/custom-keypad.js`
- Removes: `<form id="halveItScoreForm">`, `<input id="halveItScoreInput">`, `form.addEventListener("submit", ...)`, `scoreInput.focus()` call

- [ ] **Step 1: Add import at the top of `www/halveIt/halveItUi.js`**

After `// www/halveIt/halveItUi.js` (if present) or at the very top, add:
```js
import { makeKeypad } from "../shared/custom-keypad.js";
```

- [ ] **Step 2: Remove form from `card.innerHTML` in `createPlayerContractCard`**

Find `card.innerHTML = \`...\`` (around line 80). Remove the `<form id="halveItScoreForm">...</form>` block from the template and also remove the `<div class="halve-it-last-result">` line (keep it). The template should end after the last-result div:

```js
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
```

- [ ] **Step 3: Replace form event listener with keypad append**

Delete the block:
```js
    const form = card.querySelector("#halveItScoreForm");
    form.addEventListener("submit", event => {
        event.preventDefault();
        const input = card.querySelector("#halveItScoreInput");
        const score = Number(input.value) || 0;
        if (typeof actions.onSubmitScore === "function") {
            actions.onSubmitScore(score);
        }
    });
```

Replace with:
```js
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
```

(Remove the old `return card;` line since it's now at the end of the replacement.)

- [ ] **Step 4: Remove `scoreInput.focus()` from `renderHalveItMode`**

Delete:
```js
    const scoreInput = document.getElementById("halveItScoreInput");
    if (scoreInput) {
        scoreInput.focus();
    }
```

- [ ] **Step 5: Verify Halve It in browser**

Open Classic → Halve It → start game with 2 players. Confirm:
- Score input is a keypad (not a native input)
- "Next" button appears (not "Enter Score")
- Tapping Next without entering a score submits 0
- Score above 0 registers as contract success
- Score 0 halves the player's total

---

### Task 5: 121 Checkout Score Input

**Files:**
- Modify: `www/ui.js`

**Interfaces:**
- Consumes: `makeKeypad` from `./shared/custom-keypad.js`
- Removes: `totalInput` (native `<input type="number">`), `submitBtn`, `handleSubmit`, `totalInput.addEventListener`, `totalInput.value = val; totalInput.focus()` in quick-btn handlers

- [ ] **Step 1: Add import at the top of `www/ui.js`**

After the first comment block (`// =====================================================`), add:
```js
import { makeKeypad } from "./shared/custom-keypad.js";
```

- [ ] **Step 2: Replace the native input block in `renderCheckoutMode`**

Find the `// Total score input area` block (around line 1478–1532). Replace the entire block from `const totalArea = ...` through `topCard.appendChild(totalArea);` with:

```js
        // Total score input area
        const totalArea = document.createElement("div");
        totalArea.classList.add("checkout-total-area");

        const kp = makeKeypad({
            maxValue: 180,
            maxDigits: 3,
            minValue: 0,
            showMiss: false,
            emptyIsZero: true,
            placeholder: "–",
            submitLabel: "Submit",
            onSubmit: (score) => {
                checkoutEngine.submitTotalScore(score);
                renderCheckoutMode(checkoutEngine, actions);
                scrollCheckoutToTop();
            },
        });
        totalArea.appendChild(kp.el);

        // Quick score shortcuts — setValue pre-fills the keypad; user still confirms
        const quickBtns = document.createElement("div");
        quickBtns.classList.add("checkout-quick-btns");
        [0, 26, 41, 60, 100].forEach(val => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.classList.add("checkout-quick-btn");
            btn.textContent = val;
            btn.addEventListener("click", () => kp.setValue(val));
            quickBtns.appendChild(btn);
        });
        totalArea.appendChild(quickBtns);
        topCard.appendChild(totalArea);
```

- [ ] **Step 3: Verify 121 Checkout in browser**

Open 121 Checkout → start a game. Confirm:
- Keypad appears (display "–", digits, Submit)
- Tapping a quick button (e.g. 26) pre-fills the display with 26
- Tapping Submit submits the displayed value
- Tapping Submit with empty display submits 0
- No native keyboard opens
- Quick buttons no longer call `.focus()` on any input

---

### Task 6: Killer Number Selection

**Files:**
- Modify: `www/ui.js` — `renderNumberSelection` function only

**Interfaces:**
- Consumes: `makeKeypad` (already imported in Task 5)
- Removes: `<input id="numberSelectionInput">`, `<button id="confirmNumberBtn">`, `<div id="numberSelectionError">` from the innerHTML template; `input.focus()`, `confirmNumber` function, `confirmButton.addEventListener`, `input.addEventListener`

- [ ] **Step 1: Rewrite `renderNumberSelection` in `www/ui.js`**

Replace the entire `renderNumberSelection` function (starting at `function renderNumberSelection(game, actions = {}) {` through its closing `}`) with:

```js
function renderNumberSelection(game, actions = {}) {
    if (!gameBoard) { return; }
    const player = game.players[game.numberSelectionIndex];
    if (!player) { return; }

    gameBoard.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.classList.add("number-selection-card");

    wrapper.innerHTML = `
        <div class="number-selection-progress">
            Player ${game.numberSelectionIndex + 1} of ${game.players.length}
        </div>

        <h2>${player.name}</h2>

        <p class="number-selection-help">
            Throw 1 dart with your non-dominant hand.<br>
            Enter the number you hit.
        </p>

        <div class="number-selection-list">
            ${game.players.map((listedPlayer, index) => {
                const isCurrent = index === game.numberSelectionIndex;
                const hasNumber = listedPlayer.number !== null;
                return `
                    <div class="number-selection-player ${isCurrent ? "current" : ""}">
                        <span>${index + 1}. ${listedPlayer.name}</span>
                        <strong>${hasNumber ? listedPlayer.number : isCurrent ? "Now" : "Waiting"}</strong>
                    </div>
                `;
            }).join("")}
        </div>
    `;

    const kp = makeKeypad({
        maxValue: 20,
        maxDigits: 2,
        minValue: 1,
        showMiss: false,
        emptyIsZero: false,
        placeholder: "–",
        submitLabel: "Confirm Number",
        onSubmit: (number) => {
            const result = game.confirmPlayerNumber(number);
            if (!result.success) {
                kp.showError(result.message);
                return;
            }
            renderApp(game, actions);
        },
    });

    const list = wrapper.querySelector(".number-selection-list");
    wrapper.insertBefore(kp.el, list);
    gameBoard.appendChild(wrapper);
}
```

- [ ] **Step 2: Verify Killer number selection in browser**

Open Killer → add 2 players → Start. Confirm:
- Keypad appears for each player (not native input)
- Typing "5" shows 5 in the display
- Typing "21" is rejected (> 20)
- Pressing Confirm with empty display shows error "Enter a number between 1 and 20."
- Pressing Confirm with "0" shows error
- Valid number (1–20) advances to next player or starts gameplay

---

### Task 7: Duel Number Selection

**Files:**
- Modify: `www/duel/duel-ui.js`

**Interfaces:**
- Consumes: `makeKeypad` from `../shared/custom-keypad.js`
- Removes: `const input = document.createElement("input")` block, `errorBox.classList.remove("hidden")` pattern, `confirmBtn`, `doConfirm`, `input.addEventListener`, `confirmBtn.addEventListener`, `input.focus()`

- [ ] **Step 1: Add import at the top of `www/duel/duel-ui.js`**

At the very top of the file, add:
```js
import { makeKeypad } from "../shared/custom-keypad.js";
```

- [ ] **Step 2: Replace number-selection input in `_renderNumberSelection`**

Find `_renderNumberSelection(duelEngine, actions)`. Replace everything from `const input = document.createElement("input");` through `input.focus();` (the last line of the function before `}`) with:

```js
    const kp = makeKeypad({
        maxValue: 20,
        maxDigits: 2,
        minValue: 1,
        showMiss: false,
        emptyIsZero: false,
        placeholder: "–",
        submitLabel: "Confirm Number",
        onSubmit: (number) => {
            const result = duelEngine.confirmPlayerNumber(number);
            if (!result.success) {
                kp.showError(result.message);
                return;
            }
            if (typeof actions.onRender === "function") actions.onRender();
        },
    });

    card.appendChild(badgeRow);
    card.appendChild(progress);
    card.appendChild(heading);
    card.appendChild(help);
    card.appendChild(kp.el);
    card.appendChild(playerList);

    screen.appendChild(card);
    gameBoard.appendChild(screen);
```

(Remove the separate `card.appendChild(input)`, `card.appendChild(errorBox)`, `card.appendChild(confirmBtn)` lines — they are replaced by `card.appendChild(kp.el)`. Remove the `errorBox` declaration too since errors now go to `kp.showError()`.)

- [ ] **Step 3: Verify Duel number selection in browser**

Open Duel → add 2 players → Start → Number Selection phase. Confirm:
- Keypad appears (not native input)
- Valid 1–20 advances to next player
- Invalid (e.g. number already taken) shows engine error message inside the keypad error area
- Typing "21" is rejected inline (not shown in display)

---

### Task 8: Transit Arena Number Selection

**Files:**
- Modify: `www/transitArena/transit-arena-ui.js`

**Interfaces:**
- Consumes: `makeKeypad` from `../shared/custom-keypad.js`
- Removes: `const input = document.createElement("input")` block, `const errorBox`, `const confirmBtn`, `handleConfirm`, `confirmBtn.addEventListener`, `input.addEventListener`, `input.focus()`
- Keeps: conditional undoLink button (separate from the keypad)

- [ ] **Step 1: Add import at the top of `www/transitArena/transit-arena-ui.js`**

At the very top of the file, add:
```js
import { makeKeypad } from "../shared/custom-keypad.js";
```

- [ ] **Step 2: Replace number-selection input in `_renderNumberSelection`**

Find `_renderNumberSelection(engine, actions)`. Replace the block from `const input = document.createElement("input");` through `input.focus();` (end of function body) with:

```js
    const kp = makeKeypad({
        maxValue: 20,
        maxDigits: 2,
        minValue: 1,
        showMiss: false,
        emptyIsZero: false,
        placeholder: "–",
        submitLabel: "Confirm Number",
        onSubmit: (number) => {
            const result = engine.confirmPlayerNumber(number);
            if (!result.success) {
                kp.showError(result.message);
                return;
            }
            if (typeof actions.onNumberConfirmed === "function") actions.onNumberConfirmed();
        },
    });
    card.appendChild(kp.el);

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

    card.appendChild(playerList);

    screen.appendChild(card);
    gameBoard.appendChild(screen);
```

- [ ] **Step 3: Verify Transit Arena number selection in browser**

Open Transit Arena → add 2 players → Start → Number Selection phase. Confirm:
- Keypad appears (not native input)
- Valid 1–20 advances to next player
- "↶ Undo last" button appears only after at least one player has confirmed
- Invalid entries show error inside the keypad error area

---

### Task 9: Mirror to iOS + Remove Debug Markers

**Files:**
- Modify: `ios/App/App/public/css/custom-keypad.css` (new)
- Modify: `ios/App/App/public/shared/custom-keypad.js` (new directory + file)
- Mirror: `ios/App/App/public/index.html`
- Mirror: `ios/App/App/public/css/x01.css`
- Mirror: `ios/App/App/public/x01/x01-ui.js`
- Mirror: `ios/App/App/public/halveIt/halveItUi.js`
- Mirror: `ios/App/App/public/ui.js`
- Mirror: `ios/App/App/public/duel/duel-ui.js`
- Mirror: `ios/App/App/public/transitArena/transit-arena-ui.js`

- [ ] **Step 1: Remove debug banners from `www/index.html`**

Delete:
```html
    <!-- DEBUG BANNER — remove after iOS confirmation -->
    <div id="build-check-banner" style="position:fixed;top:0;left:0;right:0;z-index:999999;background:#dc2626;color:#fff;text-align:center;font-weight:900;font-size:0.72rem;padding:5px 0 4px;letter-spacing:0.08em;font-family:monospace;">BUILD CHECK: CUSTOM KEYPAD VERSION</div>
```

- [ ] **Step 2: Copy all changed files to iOS public folder**

Run in PowerShell from the project root (`C:\Users\duisb\Documents\Darts-Killer app\darts-killer`):

```powershell
$src = "www"
$dst = "ios\App\App\public"

# New files / new directory
New-Item -ItemType Directory -Force "$dst\shared" | Out-Null
Copy-Item "$src\css\custom-keypad.css"          "$dst\css\custom-keypad.css"   -Force
Copy-Item "$src\shared\custom-keypad.js"        "$dst\shared\custom-keypad.js" -Force

# Updated files
Copy-Item "$src\index.html"                      "$dst\index.html"              -Force
Copy-Item "$src\css\x01.css"                     "$dst\css\x01.css"             -Force
Copy-Item "$src\x01\x01-ui.js"                   "$dst\x01\x01-ui.js"           -Force
Copy-Item "$src\halveIt\halveItUi.js"            "$dst\halveIt\halveItUi.js"    -Force
Copy-Item "$src\ui.js"                           "$dst\ui.js"                   -Force
Copy-Item "$src\duel\duel-ui.js"                 "$dst\duel\duel-ui.js"         -Force
Copy-Item "$src\transitArena\transit-arena-ui.js" "$dst\transitArena\transit-arena-ui.js" -Force
```

- [ ] **Step 3: Confirm copy succeeded**

Run:
```powershell
Get-ChildItem "ios\App\App\public\shared\"
Get-ChildItem "ios\App\App\public\css\" | Where-Object { $_.Name -like "custom-keypad*" }
Select-String "BUILD CHECK" "ios\App\App\public\index.html"
Select-String "ck-keypad" "ios\App\App\public\shared\custom-keypad.js" | Select-Object -First 1
Select-String "makeKeypad" "ios\App\App\public\x01\x01-ui.js" | Select-Object -First 1
```

Expected output:
- `ios\App\App\public\shared\custom-keypad.js` listed
- `ios\App\App\public\css\custom-keypad.css` listed
- No match for `BUILD CHECK` (banner removed)
- Match for `ck-keypad` in `custom-keypad.js`
- Match for `makeKeypad` in `x01-ui.js`

- [ ] **Step 4: In Xcode — clean and run**

On Mac:
1. Open `ios/App/App.xcworkspace` in Xcode
2. **Product → Clean Build Folder** (`Shift ⌘ K`)
3. **Product → Run** (`⌘ R`)

Confirm:
- No red debug banner at the top of the app
- Home screen loads normally
- Classic → score entry → custom keypad appears, no iOS keyboard opens
- Halve It → score entry → custom keypad appears
- 121 Checkout → score entry → custom keypad appears; quick buttons (0, 26, etc.) pre-fill the display
- Killer, Duel, Transit Arena → number selection → custom keypad appears (1–20)
- App layout does not scroll or jump when entering scores
- Backspace works in all modes
- Empty submit submits 0 in Classic / Halve It / Checkout
- Empty submit in number-selection modes shows error "Enter a number between 1 and 20."

---

## Self-Review

**Spec coverage:**
- ✅ `www/shared/custom-keypad.js` created (Task 2)
- ✅ `makeKeypad` returns `{ el, setValue, getValue, clear, showError }` (Task 2)
- ✅ CSS at `www/css/custom-keypad.css` (Task 1)
- ✅ Keypad layout: 1 2 3 / 4 5 6 / 7 8 9 / Miss-0-⌫ / Submit / Undo (Task 2)
- ✅ Classic refactored to shared (Task 3)
- ✅ Halve It migrated (Task 4)
- ✅ 121 Checkout migrated with setValue for quick buttons (Task 5)
- ✅ Killer number selection migrated (Task 6)
- ✅ Duel number selection migrated (Task 7)
- ✅ Transit Arena number selection migrated (Task 8)
- ✅ Debug banners removed (Task 9)
- ✅ iOS files mirrored (Task 9)
- ✅ `#checkoutCustomStart` / `#checkoutCustomRounds` left native (not in any task — intentional)
- ✅ Player name text inputs left native (not in any task — intentional)

**Placeholder scan:** None found.

**Type consistency:** `makeKeypad` returns `{ el, setValue, getValue, clear, showError }` — all five names used consistently across Tasks 3–8.
