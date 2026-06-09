---
name: transit-arena-design
description: Full approved design spec for the Transit Arena game mode in Killer Darts
metadata:
  type: project
---

# Transit Arena — Design Spec
**Date:** 2026-06-09  
**Status:** Implemented

## Overview
Transit Arena is a party battle mode for Killer Darts. 2+ players. Each starts with 10 HP (max 15, cap 20). Last alive player wins. Power-ups spawn on exact board segments every 3–6 full rounds; players hit the segment to unlock and tap the spinning coin to claim.

## Files
- `www/transitArena/transit-arena-engine.js` — TransitArenaEngine class
- `www/transitArena/transit-arena-ui.js` — renderTransitArenaMode() + local audio helpers
- `www/transitArena/transit-arena-powerups.js` — TRANSIT_ARENA_POWERUPS config, helpers
- `www/css/transit-arena.css` — all Transit Arena styles
- Modified: `www/index.html`, `www/main.js`

## Architecture
- Approach A: class-based engine matching DuelEngine style
- Local audio helpers in transit-arena-ui.js (no shared audio module)
- Engine imports only from transit-arena-powerups.js
- UI receives engine instance + action callbacks (renderDuelMode pattern)
- main.js wires everything; no changes to ui.js, style.css, existing modes

## Core Rules
- 2 players = 1v1, 3+ = free-for-all
- Start HP=10, maxHp=15, absolute cap=20, shield max=5
- 3 darts/turn (Speed Cola gives 4)
- Single=1dmg, Double=2, Triple=3, OuterBull=2, Bull=5, Miss=0
- Shield absorbs first, remainder to HP
- Widow's Wine blocks next full incoming attack
- Quick Revive revives once at 3 HP on death

## Power-Up System
- 10 power-ups defined in TRANSIT_ARENA_POWERUPS (id, name, symbol, effectText)
- Segment probabilities: 20% Single, 45% Double, 35% Triple
- Exact match only (S14 ≠ D14 ≠ T14)
- Bulls and Miss never unlock power-ups
- Spawn every 3–6 full rounds; active for 1 full round
- Hit segment → pending claim (coin unlocks); tap coin → apply effect
- Pending claim reserves power-up (no expiry while pending)

## Undo
- saveState() before every gameplay-changing action including claimPendingPowerUp()
- Deep-clone via JSON.parse(JSON.stringify(...))
- Restores all HP, shield, power-up state, turn/round state, winner/status

## Power-Ups
1. Quick Revive — revive once at 3 HP on elimination
2. Juggernog — +5 HP, +2 maxHp (cap 20)
3. Double Tap — next damage dart ×2
4. Speed Cola — next turn gets 4 darts
5. Deadshot Daiquiri — next hit on selected target +2 bonus
6. Shield — +3 shield (cap 5)
7. Carpenter — restore shield to 5
8. Widow's Wine — block next incoming attack
9. Insta-Kill — next damage dart +5 bonus
10. Nuke — all alive opponents lose 2 HP immediately on claim
