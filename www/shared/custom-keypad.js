// www/shared/custom-keypad.js
// Reusable in-app numeric keypad.
// No native <input> → no iOS keyboard → no WKWebView viewport shift.
//
// Returns { el, setValue, getValue, clear, showError }.
//
// PERFORMANCE CONTRACT:
//   Digit taps / backspace / setValue  →  update ONLY the display div inside el.
//   onSubmit / onUndo callbacks        →  caller decides whether to rerender.
//   The keypad NEVER triggers a full-screen rerender on digit press.

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

    // ── Internal state (closure — never stored on DOM) ────────────────────────
    let _typed = "";
    let _submitting = false; // submit-lock: prevents double-fire on fast tap

    // ── Root element ──────────────────────────────────────────────────────────
    const el = document.createElement("div");
    el.className = "ck-keypad";

    // ── Display (pointer-events: none in CSS, never focusable) ───────────────
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
        const btn = _btn(d, "ck-btn");
        btn.addEventListener("click", () => _addDigit(d));
        grid.appendChild(btn);
    }
    el.appendChild(grid);

    // ── Bottom row: [Miss?] 0 ⌫ ──────────────────────────────────────────────
    const bottomRow = document.createElement("div");
    bottomRow.className = "ck-grid";

    if (showMiss) {
        const missBtn = _btn("Miss", "ck-btn ck-btn--miss");
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

    const zeroBtn = _btn("0", "ck-btn" + (showMiss ? "" : " ck-btn--zero-wide"));
    zeroBtn.addEventListener("click", () => _addDigit("0"));
    bottomRow.appendChild(zeroBtn);

    const backBtn = _btn("⌫", "ck-btn ck-btn--back");
    backBtn.addEventListener("click", () => {
        _typed = _typed.slice(0, -1);
        _refreshDisplay();
        _clearError();
    });
    bottomRow.appendChild(backBtn);
    el.appendChild(bottomRow);

    // ── Submit button ─────────────────────────────────────────────────────────
    const submitBtn = _btn(submitLabel, "ck-submit");
    submitBtn.addEventListener("click", _doSubmit);
    el.appendChild(submitBtn);

    // ── Optional Undo button ──────────────────────────────────────────────────
    if (typeof onUndo === "function") {
        const undoBtn = _btn("↶ Undo", "ck-undo");
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
        // Replace a lone "0" to prevent leading-zero strings like "01"
        const candidate = (_typed === "0") ? d : (_typed + d);
        if (candidate.length > maxDigits || parseInt(candidate, 10) > maxValue) return;
        _typed = candidate;
        _refreshDisplay(); // updates ONE div — zero rerender cost
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
        const snapshot = _typed;
        _typed = "";
        _refreshDisplay();
        try { onSubmit(n); } finally {
            // Release after one microtask so a synchronous double-tap from the
            // same event loop tick is swallowed, but normal fast tapping works.
            Promise.resolve().then(() => { _submitting = false; });
        }
        void snapshot; // silence linter
    }

    // Updates ONLY the display text — O(1), no DOM diffing, no rerender trigger
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

// ── Internal: create a button element ────────────────────────────────────────
function _btn(label, className) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = className;
    b.textContent = label;
    return b;
}
