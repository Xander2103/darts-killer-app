// www/shared/custom-keypad.js
// Shared inline numeric keypad factory.
// Returns { el, setValue, getValue, clear, showError }.
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

    // Inline error — used for local validation AND engine-level errors via showError()
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

    // Undo button (optional — only rendered when onUndo is provided)
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
