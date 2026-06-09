# Duel Mode Improvements — Design Spec
**Date:** 2026-06-10
**Approach:** Engine + targeted UI patches (Approach A)

---

## Overview

Improve the existing Duel mode with clearer turn state, a rules info panel, negative-HP last-chance survival, updated heal-target timing, and green healing visuals. No DOM restructure. No changes to any other game mode.

---

## Files Changed

| File | Change type |
|---|---|
| `www/duel/duel-engine.js` | Logic changes (3 functions) |
| `www/duel/duel-ui.js` | Targeted patches to `_renderPlaying()` and title row |
| `www/css/duel.css` | CSS additions only (no deletions) |

**Not changed:** `main.js`, `ui.js`, `index.html`, `killer-game.js`, all other mode files.

---

## Section 1 — Engine (`duel-engine.js`)

### 1.1 Heal target interval: 3–6 rounds

`_randomHealInterval()` currently returns 5–10. Change to:

```js
return Math.floor(Math.random() * 4) + 3; // 3–6
```

### 1.2 Negative HP — allow damage below zero

In `throwNumber()`, remove the `Math.max(0, ...)` clamp on damage:

```js
// Before:
defender.hp = Math.max(0, defender.hp - m);

// After:
defender.hp = defender.hp - m;
```

Remove the immediate-win block that fires when `defender.hp <= 0`:

```js
// Remove entirely:
if (effect === "damage" && defender.hp <= 0) {
    defender.isAlive = false;
    this.winnerPlayerIndex = attackerIndex;
    this.phase = "finished";
    this.setLastResult("success", `${attacker.name} wins!`);
    return;
}
```

The defender is no longer eliminated during the attacker's throw. They survive with negative HP and get their own next turn to recover.

### 1.3 Last-chance elimination check in `_endTurn()`

At the very top of `_endTurn()`, before heal-target lifecycle or player switching:

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
    // ... existing heal-target and player-switch logic
}
```

**Rule:** If `currentPlayer.hp <= 0` at the end of their own turn → eliminated. If `hp >= 1` → survived.

### 1.4 Full normal turn during danger

When a player is at negative HP, they get a completely normal turn:
- Can attack (hit opponent's number)
- Can heal (Outer Bull +1, Bull 50 +2, Heal Target +1/+2/+3)
- Can miss
- No buttons disabled

The only difference is visual (LAST CHANCE banner) and the elimination check at end of turn.

### 1.5 Undo

No changes to `saveState()` needed. It already deep-clones `players` (including `hp`, `isAlive`), `phase`, `winnerPlayerIndex`, and `lastResult`. Negative HP values, danger state, and elimination all restore correctly via `undo()`.

---

## Section 2 — UI (`duel-ui.js`)

All changes are inside `_renderPlaying()`. No other render functions are modified.

### 2.1 Info button and info panel

In the title row, add an info button (`ℹ`) using the existing `info-btn` class for style consistency with the rest of the app. On click, toggle a `.duel-info-panel` element.

Info panel content (plain text, no DOM-heavy structure):

- **Attack:** Hit the highlighted red number to deal damage to your opponent.
- **Heal:** Outer Bull 25 = +1 HP · Bull 50 = +2 HP. These always heal you.
- **Heal Target:** Every 3–6 rounds a green number appears. Hit it to recover HP (S=+1, D=+2, T=+3).
- **Last Chance:** If your HP drops to 0 or below, you have one full turn to heal back above 0. Fail → eliminated.
- **Undo:** Tap Undo to reverse your last dart.

### 2.2 Active player — YOUR TURN badge

Inside the active player's `nameRow`, inject a small `YOUR TURN` badge element with class `duel-your-turn-badge`. The inactive player card gets class `.inactive` (dimmed via CSS).

### 2.3 Danger HP display

Show raw `player.hp` value in the HP text — including negative values (e.g. `-2 / 15 HP`).

When `player.hp <= 0`:
- HP text element gets class `.danger`
- HP bar element gets class `.danger` (shows as empty red strip)

### 2.4 LAST CHANCE warning banner

Condition: `currentPlayer.hp <= 0` at render time.

A banner is inserted between the top card and the multiplier row:

```
⚠  LAST CHANCE — heal above 0 before your turn ends!
```

Class: `.duel-last-chance-banner`. No buttons disabled. Full normal turn.

### 2.5 Number grid

Three visual states, all buttons remain clickable:

| State | Class | Style |
|---|---|---|
| Opponent's number | `duel-attack-target` | Red/orange, prominent (already exists) |
| Active heal target | `duel-heal-target` | Green, prominent (already exists) |
| All other numbers | `duel-irrelevant` | Muted (~30% opacity) |

Numbers 1–20 are all rendered and clickable. Only two are prominent at any time.

### 2.6 Bull buttons — green healing

Both Outer Bull 25 and Bull 50 buttons get class `duel-bull-heal` added. This overrides the neutral `.duel-bull-button` style with green background, border, and text.

---

## Section 3 — CSS (`duel.css`, additions only)

| Selector | Purpose |
|---|---|
| `.duel-player-hp-card.active` | Stronger red glow + border (increase specificity over existing) |
| `.duel-player-hp-card.inactive` | Opacity 0.45, no pointer events needed |
| `.duel-your-turn-badge` | Small uppercase red chip, inline in name row |
| `.duel-hp-text.danger` | Red text for ≤ 0 HP values |
| `.duel-hp-bar.danger` | Empty bar (width stays 0%), red tint background |
| `.duel-last-chance-banner` | Pulsing red warning strip with `duel-danger-pulse` animation |
| `.duel-number-grid button.duel-irrelevant` | opacity 0.28, color muted |
| `.duel-bull-button.duel-bull-heal` | Green background/border/text (same green as heal target) |
| `.duel-info-panel` | Hidden by default (`display: none`) |
| `.duel-info-panel.visible` | `display: block`, soft card style |
| `@keyframes duel-danger-pulse` | Subtle red box-shadow pulse, 1.2s loop |
| `@media (prefers-reduced-motion: reduce)` | Disable pulse animation |

---

## Behaviour Summary

| Scenario | Result |
|---|---|
| Attacker sends defender to -1 HP | Defender not eliminated. Gets their next turn. |
| Defender heals to +1 HP on survival turn | Survives. Game continues. |
| Defender still at ≤ 0 HP at end of survival turn | Eliminated. Opponent wins. |
| Player is in danger, attacks opponent | Allowed. Full normal turn. |
| Player is in danger, uses Outer Bull | +1 HP. Could save them. |
| Player is in danger, misses all 3 darts | Eliminated at end of turn. |
| Undo after going negative | HP restores to pre-throw value. Danger state clears. |
| Heal target appears | Every 3–6 full rounds. Green button in number grid. |

---

## Out of Scope

- No changes to Classic, Chaos, Halve It, Checkout, Drink, or Transit Arena.
- No DOM restructure of Duel screen.
- No player count changes (Duel remains 2-player only).
- No settings screen for Duel.
