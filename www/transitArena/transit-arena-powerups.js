// www/transitArena/transit-arena-powerups.js
// Central config for all Transit Arena power-ups.
// No imports. Pure config + helpers only.

export const TRANSIT_ARENA_POWERUPS = [
    {
        id: "quickRevive",
        name: "Quick Revive",
        symbol: "♻",
        effectText: "If eliminated this match, revive once with 3 HP."
    },
    {
        id: "juggernog",
        name: "Juggernog",
        symbol: "🛡",
        effectText: "Gain +5 HP and increase max HP by 2 (cap 20)."
    },
    {
        id: "doubleTap",
        name: "Double Tap",
        symbol: "⚡",
        effectText: "Next successful damage dart deals double damage. Consumed after use."
    },
    {
        id: "speedCola",
        name: "Speed Cola",
        symbol: "⏩",
        effectText: "Next turn gets 4 darts instead of 3. Consumed after that turn."
    },
    {
        id: "deadshot",
        name: "Deadshot Daiquiri",
        symbol: "🎯",
        effectText: "Next successful hit on your selected target deals +2 bonus damage. Consumed after use."
    },
    {
        id: "shield",
        name: "Shield",
        symbol: "🔰",
        effectText: "Gain +3 shield (max 5)."
    },
    {
        id: "carpenter",
        name: "Carpenter",
        symbol: "🔧",
        effectText: "Restore shield to maximum (5)."
    },
    {
        id: "widowWine",
        name: "Widow's Wine",
        symbol: "🍷",
        effectText: "Blocks the next full incoming attack. Consumed when triggered."
    },
    {
        id: "instaKill",
        name: "Insta-Kill",
        symbol: "💀",
        effectText: "Next successful damage dart deals +5 bonus damage. Consumed after use."
    },
    {
        id: "nuke",
        name: "Nuke",
        symbol: "☢",
        effectText: "All alive opponents immediately lose 2 HP. Applied on claim."
    },
    {
        id: "maxAmmo",
        name: "Max Ammo",
        symbol: "🔴",
        effectText: "Reset your remaining darts this turn back to full."
    }
];

export function getPowerUpById(id) {
    return TRANSIT_ARENA_POWERUPS.find(p => p.id === id) || null;
}

export function getRandomPowerUp() {
    return TRANSIT_ARENA_POWERUPS[Math.floor(Math.random() * TRANSIT_ARENA_POWERUPS.length)];
}

// occupiedNumbers: array of base numbers (1-20) assigned to players — never used for power-up segments
export function getRandomPowerUpSegment(occupiedNumbers = []) {
    const allNums = Array.from({ length: 20 }, (_, i) => i + 1);
    const validNums = allNums.filter(n => !occupiedNumbers.includes(n));
    if (validNums.length === 0) return null;
    const r = Math.random();
    const prefix = r < 0.20 ? "S" : r < 0.65 ? "D" : "T";
    const num = validNums[Math.floor(Math.random() * validNums.length)];
    return prefix + num;
}

export function matchesPowerUpSegment(hit, powerUpSegment) {
    if (!hit || !powerUpSegment) return false;
    if (hit === "B25" || hit === "B50" || hit === "MISS") return false;
    return hit === powerUpSegment;
}

export function getEligiblePowerUps(alivePlayers) {
    if (!alivePlayers || alivePlayers.length === 0) return [];
    return TRANSIT_ARENA_POWERUPS.filter(pu => {
        switch (pu.id) {
            case "quickRevive":  return alivePlayers.some(p => !p.quickRevive);
            case "juggernog":    return alivePlayers.some(p => p.maxHp < 20 || p.hp < p.maxHp);
            case "doubleTap":   return alivePlayers.some(p => !p.doubleTap);
            case "speedCola":   return alivePlayers.some(p => !p.speedCola);
            case "deadshot":    return alivePlayers.some(p => !p.deadshot);
            case "shield":      return alivePlayers.some(p => p.shield < 5);
            case "carpenter":   return alivePlayers.some(p => p.shield < 5);
            case "widowWine":   return alivePlayers.some(p => !p.widowWine);
            case "instaKill":   return alivePlayers.some(p => !p.instaKill);
            case "nuke":        return alivePlayers.length >= 2;
            case "maxAmmo":     return true;
            default:            return true;
        }
    });
}

export function getRandomEligiblePowerUp(alivePlayers) {
    const eligible = getEligiblePowerUps(alivePlayers);
    if (eligible.length === 0) return null;
    return eligible[Math.floor(Math.random() * eligible.length)];
}
