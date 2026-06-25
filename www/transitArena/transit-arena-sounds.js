// www/transitArena/transit-arena-sounds.js
// Centralized audio for Transit Arena power-up spawn sounds.
// Paths are relative to the document (www/index.html), not this module.

const POWER_UP_SOUND_MAP = {
    quickRevive: "./assets/sounds/quickrevive.m4a",
    juggernog:   "./assets/sounds/juggernog.m4a",
    doubleTap:   "./assets/sounds/doubleTap.m4a",
    speedCola:   "./assets/sounds/speedCola.m4a",
    deadshot:    "./assets/sounds/deadshotDaiquiri.m4a",
    shield:      "./assets/sounds/shield.m4a",
    carpenter:   "./assets/sounds/carpenter.m4a",
    widowWine:   "./assets/sounds/widowWine.m4a",
    instaKill:   "./assets/sounds/instakill.m4a",
    nuke:        "./assets/sounds/nuke.m4a",
    // Space in filename — encoded for safety; suggest renaming to maxAmmo.m4a
    maxAmmo:     "./assets/sounds/max%20ammo.m4a"
};

let currentPowerUpAudio = null;

export function playTransitPowerUpSpawnSound(powerUpId) {
    const src = POWER_UP_SOUND_MAP[powerUpId];
    if (!src) return;

    try {
        if (currentPowerUpAudio) {
            currentPowerUpAudio.pause();
            currentPowerUpAudio.currentTime = 0;
        }

        const audio = new Audio(src);
        audio.loop = false;
        audio.volume = 0.7;
        currentPowerUpAudio = audio;

        audio.play().catch(() => { /* autoplay blocked — fail silently */ });
    } catch (_) { /* unsupported format or missing file — fail silently */ }
}

export function stopCurrentTransitPowerUpSound() {
    if (currentPowerUpAudio) {
        currentPowerUpAudio.pause();
        currentPowerUpAudio.currentTime = 0;
        currentPowerUpAudio = null;
    }
}
