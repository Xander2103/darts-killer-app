# Custom Numeric Keypad — Shared Component Design
**Date:** 2026-07-07  
**Status:** Approved

## Problem
Native `<input type="number">` and `inputmode="numeric"` fields cause WKWebView on iOS to open the system keyboard, which shifts the viewport and makes the app layout jump. This affects every game mode that takes a numeric score or target number during gameplay.

## Goal
One reusable `makeKeypad(config)` factory used across all affected modes. No native keyboard opens, no viewport shifts, no page scroll during score/target entry.

## Approach
**Shared inline factory.** `www/shared/custom-keypad.js` exports `makeKeypad(config)` which returns `{ el, setValue, getValue, clear }`. Callers append `el` where the old `<input>` was. State lives inside the closure — no global variables, one fresh instance per render cycle.

## API

```js
makeKeypad({
  maxValue    = 180,         // reject digits that exceed this
  maxDigits   = 3,           // reject once digit string exceeds this length
  minValue    = 0,           // validate on submit; show inline error if below
  showMiss    = false,       // show Miss button — immediately submits 0
  emptyIsZero = true,        // Enter on empty display → submit 0
  placeholder = "0",
  submitLabel = "Enter Score",
  onSubmit(n) {},            // required — called with a valid number
  onUndo() {},               // optional — shows Undo button if provided
})
// → { el, setValue(n), getValue(), clear() }
```

## Keypad Layout
```
[display: typed value or placeholder]
[ 1 ] [ 2 ] [ 3 ]
[ 4 ] [ 5 ] [ 6 ]
[ 7 ] [ 8 ] [ 9 ]
[Miss*] [ 0 ] [ ← ]
[      Enter Score      ]
[       ↶ Undo**        ]
```
`*` Miss: only when `showMiss: true`. When false, `0` and `←` span full width (2+1 cols).  
`**` Undo: only when `onUndo` is provided.

## Digit Logic
```js
addDigit(d):
  candidate = (_typed === "0") ? d : (_typed + d)
  if candidate.length > maxDigits OR parseInt(candidate) > maxValue → reject
  _typed = candidate; refresh()

doSubmit():
  n = _typed === "" ? (emptyIsZero ? 0 : -1) : parseInt(_typed)
  if n < minValue → showError(); return
  _typed = ""; refresh()
  onSubmit(n)
```

## Per-Mode Config

| Mode | showMiss | emptyIsZero | minValue | maxValue | maxDigits | submitLabel | onUndo |
|------|----------|-------------|----------|----------|-----------|-------------|--------|
| Classic x01 | true | true | 0 | 180 | 3 | "Enter Score" | actions.undo |
| 121 Checkout | false | true | 0 | 180 | 3 | "Submit" | — |
| Halve It | false | true | 0 | 180 | 3 | "Next" | — |
| Killer number-sel | false | false | 1 | 20 | 2 | "Confirm Number" | — |
| Duel number-sel | false | false | 1 | 20 | 2 | "Confirm Number" | — |
| Transit Arena number-sel | false | false | 1 | 20 | 2 | "Confirm Number" | — |

## 121 Checkout Quick-Score Buttons
Quick buttons (0, 26, 41, 60, 100) call `setValue(n)` to pre-fill the keypad display. User must still tap Submit to confirm. No direct-submit.

## CSS
`www/css/custom-keypad.css` — class prefix `.ck-*`. Extracted and renamed from the working `.x01-keypad*` styles in `x01.css`. Loaded globally via `index.html`.

## Files Changed

**New:**
- `www/shared/custom-keypad.js`
- `www/css/custom-keypad.css`

**Modified:**
- `www/index.html` — add `<link>` for custom-keypad.css
- `www/x01/x01-ui.js` — remove local `_makeKeypad()` + `_typedScore`, use shared
- `www/halveIt/halveItUi.js` — replace form/input with makeKeypad
- `www/ui.js` — replace Checkout score input, Checkout quick-btn focus, Killer number-selection
- `www/duel/duel-ui.js` — replace number-selection input
- `www/transitArena/transit-arena-ui.js` — replace number-selection input
- `ios/App/App/public/` — mirror all changed files

## Left Native (intentional)
- `#checkoutCustomStart` / `#checkoutCustomRounds` — pre-game config, rarely touched
- ATC / Cricket player name inputs — `type="text"`, no numeric keyboard issue
