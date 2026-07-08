// www/shared/custom-keypad.js
// Reusable in-app numeric keypad.
// No native <input> → no iOS keyboard → no WKWebView viewport shift.
//
// Returns { el, setValue, getValue, clear, showError }.
//
// PERFORMANCE CONTRACT:
//   Digit / backspace / setValue  →  update ONLY display.textContent (O(1), no rerender).
//   onSubmit / onUndo             →  caller decides whether to rerender the game screen.
//   Submit lock                   →  blocks ONLY Submit/Miss/Undo, never digits or backspace.

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
    if (typeof onSubmit !== "function") {
        throw new Error("makeKeypad: onSubmit must be a function");
    }

    // ── Internal state ────────────────────────────────────────────────────────
    let _typed = "";
    let _submitting = false; // blocks Submit/Miss/Undo only — never digits

    // ── Root element ──────────────────────────────────────────────────────────
    const el = document.createElement("div");
    el.className = "ck-keypad";

    // ── Display (pointer-events: none, never focusable) ───────────────────────
    const display = document.createElement("div");
    display.className = "ck-display ck-display--empty";
    display.textContent = placeholder;
    el.appendChild(display);

    // ── Error line ────────────────────────────────────────────────────────────
    const errorEl = document.createElement("div");
    errorEl.className = "ck-error";
    el.appendChild(errorEl);

    // ── Digit grid: 1 2 3 / 4 5 6 / 7 8 9 ───────────────────────────────────
    const grid = document.createElement("div");
    grid.className = "ck-grid";
    for (const d of ["1","2","3","4","5","6","7","8","9"]) {
        const btn = _mkBtn(d, "ck-btn");
        // pointerdown: fires the instant the finger touches — no 300ms click delay
        _addFastHandler(btn, () => _addDigit(d));
        grid.appendChild(btn);
    }
    el.appendChild(grid);

    // ── Bottom row: [Miss?] 0 ⌫ ──────────────────────────────────────────────
    const bottomRow = document.createElement("div");
    bottomRow.className = "ck-grid";

    if (showMiss) {
        const missBtn = _mkBtn("Miss", "ck-btn ck-btn--miss");
        // Miss submits a game action → keep click (prevents accidental fire during scroll)
        missBtn.addEventListener("click", () => {
            if (_submitting) return;
            _submitting = true;
            _typed = "";
            _refreshDisplay();
            _clearError();
            try { onSubmit(0); } finally { _submitting = false; }
        });
        bottomRow.appendChild(missBtn);
    }

    const zeroBtn = _mkBtn("0", "ck-btn" + (showMiss ? "" : " ck-btn--zero-wide"));
    _addFastHandler(zeroBtn, () => _addDigit("0")); // digit — fast path
    bottomRow.appendChild(zeroBtn);

    const backBtn = _mkBtn("⌫", "ck-btn ck-btn--back");
    _addFastHandler(backBtn, () => {            // backspace — fast path
        _typed = _typed.slice(0, -1);
        _refreshDisplay();
        _clearError();
    });
    bottomRow.appendChild(backBtn);
    el.appendChild(bottomRow);

    // ── Submit button ─────────────────────────────────────────────────────────
    const submitBtn = _mkBtn(submitLabel, "ck-submit");
    submitBtn.addEventListener("click", _doSubmit);
    el.appendChild(submitBtn);

    // ── Optional Undo button ──────────────────────────────────────────────────
    if (typeof onUndo === "function") {
        const undoBtn = _mkBtn("↶ Undo", "ck-undo");
        undoBtn.disabled = undoDisabled;
        undoBtn.addEventListener("click", () => {
            if (_submitting) return;
            _submitting = true;
            _typed = "";
            _refreshDisplay();
            _clearError();
            try { onUndo(); } finally { _submitting = false; }
        });
        el.appendChild(undoBtn);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    function _addDigit(d) {
        _clearError();
        const candidate = (_typed === "0") ? d : (_typed + d);
        if (candidate.length > maxDigits || parseInt(candidate, 10) > maxValue) return;
        _typed = candidate;
        _refreshDisplay(); // single textContent write — no rerender
    }

    function _doSubmit() {
        if (_submitting) return;
        _clearError();
        const n = _typed === "" ? (emptyIsZero ? 0 : -1) : parseInt(_typed, 10);
        if (n < minValue) {
            errorEl.textContent = `Enter a number between ${minValue} and ${maxValue}.`;
            return;
        }
        _submitting = true;
        _typed = "";
        _refreshDisplay();
        // Release lock after one microtask — blocks same-tick double-fire only
        try { onSubmit(n); } finally {
            Promise.resolve().then(() => { _submitting = false; });
        }
    }

    function _refreshDisplay() {
        if (_typed) {
            display.textContent = _typed;
            display.className = "ck-display";
        } else {
            display.textContent = placeholder;
            display.className = "ck-display ck-display--empty";
        }
    }

    function _clearError() {
        if (errorEl.textContent) errorEl.textContent = "";
    }

    // ── Public API ────────────────────────────────────────────────────────────

    function setValue(n) {
        const clamped = Math.max(minValue, Math.min(maxValue, Math.round(Number(n))));
        _typed = String(clamped);
        _refreshDisplay();
        _clearError();
    }

    function getValue() { return _typed; }

    function clear() { _typed = ""; _refreshDisplay(); _clearError(); }

    function showError(msg) { errorEl.textContent = msg; }

    return { el, setValue, getValue, clear, showError };
}

// ── Internal: create a <button type="button"> ─────────────────────────────────
function _mkBtn(label, className) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = className;
    b.textContent = label;
    return b;
}

// ── Internal: fast-response handler for digit/backspace buttons ───────────────
//
// Strategy: pointerdown fires the instant the finger touches the screen.
// preventDefault() suppresses the 300ms tap-classification delay and prevents
// focus changes. A dedup flag prevents double-fire when both pointerdown
// and a subsequent click event both arrive (browser-dependent).
//
// For submit/miss/undo we keep plain click (avoids accidental fire during scroll).
function _addFastHandler(btn, handler) {
    let _handledByPointer = false;
    btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();          // instant response; kills tap delay + focus change
        _handledByPointer = true;
        handler();
    });
    // Fallback: click fires if pointerdown didn't (old browsers / non-pointer envs)
    // Also guards against browsers that fire click even after preventDefault on pointerdown.
    btn.addEventListener("click", () => {
        if (_handledByPointer) { _handledByPointer = false; return; }
        handler();
    });
}
