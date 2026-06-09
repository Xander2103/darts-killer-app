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
    }
];

export function getPowerUpById(id) {
    return TRANSIT_ARENA_POWERUPS.find(p => p.id === id) || null;
}

export function getRandomPowerUp() {
    return TRANSIT_ARENA_POWERUPS[Math.floor(Math.random() * TRANSIT_ARENA_POWERUPS.length)];
}

export function getRandomPowerUpSegment() {
    const r = Math.random();
    const prefix = r < 0.20 ? "S" : r < 0.65 ? "D" : "T";
    const num = Math.floor(Math.random() * 20) + 1;
    return prefix + num;
}

export function matchesPowerUpSegment(hit, powerUpSegment) {
    if (!hit || !powerUpSegment) return false;
    if (hit === "B25" || hit === "B50" || hit === "MISS") return false;
    return hit === powerUpSegment;
}
