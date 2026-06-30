const gameInfoBtn = document.getElementById("gameInfoBtn");
const setupGameInfoBtn = document.getElementById("setupGameInfoBtn");
const boardGameInfoBtn = document.getElementById("boardGameInfoBtn");

const gameInfoModal = document.getElementById("gameInfoModal");
const closeGameInfoTop = document.getElementById("closeGameInfoTop");
const closeGameInfoBottom = document.getElementById("closeGameInfoBottom");
const gameInfoBackdrop = document.getElementById("gameInfoBackdrop");
const gameInfoTitle = document.querySelector("#gameInfoModal .info-modal-top h2");
const gameInfoBody = document.querySelector("#gameInfoModal .info-modal-body");

const infoContentByMode = {
    home: {
        title: "Game Modes",
        body: `
            <section class="info-section">
                <h3>Classic</h3>
                <p>Play 301, 501 or 701 solo, with friends or in teams. Includes legs, checkout suggestions and averages.</p>
            </section>
            <section class="info-section">
                <h3>Cricket</h3>
                <p>Close 20, 19, 18, 17, 16, 15 and Bull. Score points on targets you have closed while opponents still have them open.</p>
            </section>
            <section class="info-section">
                <h3>Around the Clock</h3>
                <p>Hit every number from 1 to 20 and finish with Bull. Great for practice and warm-up.</p>
            </section>
            <section class="info-section">
                <h3>Classic Killer</h3>
                <p>Standard Killer darts with player numbers, killers and elimination.</p>
            </section>
            <section class="info-section">
                <h3>Chaos Mode</h3>
                <p>Killer darts with random modifiers and party effects.</p>
            </section>
            <section class="info-section">
                <h3>121 Checkout</h3>
                <p>Checkout training. Bring the target to exactly 0 within the dart limit.</p>
            </section>
            <section class="info-section">
                <h3>Halve It</h3>
                <p>Round-based scoring. Miss a round and your score is halved.</p>
            </section>
            <section class="info-section">
                <h3>Duel</h3>
                <p>Head-to-head 1v1 HP battle. Hit your opponent's number to deal damage.</p>
            </section>
            <section class="info-section">
                <h3>Transit Arena</h3>
                <p>Arena-style HP battle with shields, heals and power-ups. Beta.</p>
            </section>
            <section class="info-section">
                <h3>Drink Mode</h3>
                <p>Party challenge cards for darts and drinks. Play responsibly.</p>
            </section>
        `
    },
    aroundTheClock: {
        title: "Around the Clock — How to Play",
        body: `
            <section class="info-section">
                <h3>Goal</h3>
                <p>Hit every number from 1 to 20 in order, then finish with Bull. First to complete all 21 targets wins.</p>
            </section>
            <section class="info-section">
                <h3>Single / Double / Triple</h3>
                <p>Choose how you hit the target before throwing. Single advances you 1 target, Double advances 2, Triple advances 3. This lets you skip ahead when you hit a double or triple. Reaching or passing Bull with a double or triple still wins.</p>
            </section>
            <section class="info-section">
                <h3>Turns</h3>
                <p>Each player has up to 3 darts per turn. If you advance your target mid-turn, remaining darts aim at the new target.</p>
            </section>
            <section class="info-section">
                <h3>Miss</h3>
                <p>A miss does not advance your target. Your next dart still aims at the same number.</p>
            </section>
            <section class="info-section">
                <h3>Bull Finish</h3>
                <p>After hitting 20, your final target is Bull. Hitting Bull (or reaching it via Double/Triple) wins the game.</p>
            </section>
            <section class="info-section">
                <h3>Solo Play</h3>
                <p>Play alone to practice and track how many darts you need to complete the full clock.</p>
            </section>
        `
    },
    cricket: {
        title: "Cricket — How to Play",
        body: `
            <section class="info-section">
                <h3>Targets</h3>
                <p><strong>Standard:</strong> 20, 19, 18, 17, 16, 15, Bull (7 targets). <strong>Extended:</strong> adds 14 down to 10 (12 targets total). Each target needs 3 marks to close.</p>
            </section>
            <section class="info-section">
                <h3>Bull</h3>
                <p>Bull is one unified target worth 25 points per mark. <strong>O.Bull</strong> = 1 mark. <strong>I.Bull</strong> = 2 marks. Bull closes at 3 marks total. Extra marks score 25 pts each while any opponent has Bull open.</p>
            </section>
            <section class="info-section">
                <h3>Multiplier</h3>
                <p>Select Single, Double or Triple before tapping a target. The selected multiplier determines how many marks you award and stays set until you change it or throw a dart (it resets to Single after each dart).</p>
            </section>
            <section class="info-section">
                <h3>Scoring Points</h3>
                <p>Once you have closed a target (3 marks), extra marks score points — but only while at least one opponent has not yet closed it. Points = target value per extra mark.</p>
            </section>
            <section class="info-section">
                <h3>Winning</h3>
                <p>Close all targets AND have a score ≥ every opponent. Solo: just close all targets. If all targets become closed by all players simultaneously, highest score wins.</p>
            </section>
            <section class="info-section">
                <h3>Closed rows</h3>
                <p>When every player has closed a target, its row is struck through in the scoreboard and its button is disabled. No more marks or points can be scored on that target.</p>
            </section>
            <section class="info-section">
                <h3>Undo</h3>
                <p>Tap Undo to reverse the last dart, restoring marks, points and turn position.</p>
            </section>
        `
    },
    x01: {
        title: "Classic — How to Play",
        body: `
            <section class="info-section">
                <h3>Goal</h3>
                <p>Start from 301, 501 or 701 and reduce your score to exactly zero. First to zero wins the leg.</p>
            </section>
            <section class="info-section">
                <h3>Finish Rule</h3>
                <p>In Double Out mode, the final dart must land on a double or the inner bull. Single Out has no restriction.</p>
            </section>
            <section class="info-section">
                <h3>Legs</h3>
                <p>Win the set number of legs to win the match. Leg averages reset each leg; match average carries through.</p>
            </section>
            <section class="info-section">
                <h3>Input Modes</h3>
                <p><strong>Turn Total:</strong> Enter your 3-dart total after throwing. Leave empty and tap Enter to score 0.</p>
                <p><strong>Dart by Dart:</strong> Enter each dart individually. Tap End Turn to finish your turn early.</p>
            </section>
            <section class="info-section">
                <h3>Checkout Suggestions</h3>
                <p>When your score is 170 or below, the app suggests a checkout route.</p>
            </section>
        `
    },
    classic: {
        title: "Classic Killer Info",
        body: `
            <section class="info-section">
                <h3>How to play</h3>
                <p>Each player throws 1 dart with their non-dominant hand. The number hit becomes their personal number. Every player needs a unique number.</p>
            </section>
            <section class="info-section">
                <h3>Become a Killer</h3>
                <p>Hit your own number to gain points. Single = +1, Double = +2, Triple = +3. Reach 5 to become a Killer.</p>
            </section>
            <section class="info-section">
                <h3>Attack players</h3>
                <p>Once you're a Killer, hit opponents' numbers to damage them. If a player reaches 0, that player is out.</p>
            </section>
        `
    },
    chaos: {
        title: "Chaos Mode Info",
        body: `
            <section class="info-section">
                <h3>How it works</h3>
                <p>Chaos Mode uses the same base as Killer, but random modifiers can change the rules during the match.</p>
            </section>
            <section class="info-section">
                <h3>Modifiers</h3>
                <p>Some rounds force doubles or triples, give bonus darts, protect players, revive players or create sudden pressure.</p>
            </section>
            <section class="info-section">
                <h3>Settings</h3>
                <p>You can enable or disable modifiers in the settings screen.</p>
            </section>
        `
    },
    checkout: {
        title: "121 Checkout Info",
        body: `
            <section class="info-section">
                <h3>Goal</h3>
                <p>Start at 121 and try to reach exactly 0 within 9 darts.</p>
            </section>
            <section class="info-section">
                <h3>Success</h3>
                <p>If you check out, the next target increases by 1 point.</p>
            </section>
            <section class="info-section">
                <h3>Fail</h3>
                <p>If you bust or run out of darts, you fall back to your safehouse score.</p>
            </section>
            <section class="info-section">
                <h3>Multiplayer</h3>
                <p>With multiple players, everyone works together on the same checkout. After every dart, the next player throws.</p>
            </section>
        `
    },
    duel: {
        title: "How Duel Works",
        body: `
            <section class="info-section">
                <h3>1v1 HP Battle</h3>
                <p>Both players start with <strong>10 HP</strong> (max 15). First player to reach 0 HP and fail to recover is eliminated.</p>
            </section>
            <section class="info-section">
                <h3>Attack</h3>
                <p>Hit your opponent's number to deal damage. Single = −1 HP · Double = −2 HP · Triple = −3 HP.</p>
            </section>
            <section class="info-section">
                <h3>Healing</h3>
                <p><strong>Outer Bull 25</strong> always heals you +1 HP. <strong>Bull 50</strong> always heals you +2 HP.</p>
            </section>
            <section class="info-section">
                <h3>Heal Target</h3>
                <p>Every 2–5 rounds a random number becomes a green Heal Target. Hit it to recover HP (S=+1, D=+2, T=+3). It disappears after 2 turns.</p>
            </section>
            <section class="info-section">
                <h3>Last Chance</h3>
                <p>If your HP drops to <strong>0 or below</strong>, you get one full turn to heal back above 0. If you're still at 0 or below at the end of your turn, you are eliminated.</p>
            </section>
            <section class="info-section">
                <h3>Next Turn</h3>
                <p>Tap <strong>Next Turn</strong> to end your turn early without throwing all 3 darts.</p>
            </section>
        `
    },
    transitArena: {
        title: "How Transit Arena Works",
        body: `
            <section class="info-section">
                <h3>HP Battle Royale</h3>
                <p>All players start with <strong>10 HP</strong>. Last player standing wins.</p>
            </section>
            <section class="info-section">
                <h3>Target Numbers</h3>
                <p>Before the match starts, every player throws one dart with their weak hand and enters the number they hit. This becomes their personal target number — the number opponents must hit to deal damage to them.</p>
            </section>
            <section class="info-section">
                <h3>Active Player</h3>
                <p>The current player's card is highlighted with an orange glow and a <strong>TURN</strong> badge. Low-HP players have a subtle red tint but the active-player glow always takes priority.</p>
            </section>
            <section class="info-section">
                <h3>Attacking</h3>
                <p>Each alive opponent has direct <strong>S / D / T</strong> attack buttons. Single = −1 HP · Double = −2 HP · Triple = −3 HP. Shield absorbs damage before HP.</p>
            </section>
            <section class="info-section">
                <h3>Bulls — Shield</h3>
                <p><strong>Outer Bull 25</strong> gives YOU +1 shield. <strong>Bull 50</strong> gives YOU +3 shield. Bulls do not damage opponents. Max shield is 5.</p>
            </section>
            <section class="info-section">
                <h3>Healer's Round</h3>
                <p>Occasionally the arena enters a Healer's Round. Every player gets one turn to heal by hitting their own target number: Single = +1 HP · Double = +2 HP · Triple = +3 HP. HP cannot exceed your maximum. Normal attacks still work during Healer's Round.</p>
            </section>
            <section class="info-section">
                <h3>Power-Ups</h3>
                <p>Power-up coins spawn after a random number of played turns (3–15). Only turns where you actually throw at least one dart count — skipping with Next Turn does not advance the counter. Up to 2 coins can be active at once. Each coin shows a segment to hit (e.g. D7) and how many turns it has left. Physically throw that dart — if you hit it, tap the spinning coin to claim it. The app trusts your aim. Unclaimed coins expire after 2 turns per alive player.</p>
            </section>
            <section class="info-section">
                <h3>Undo</h3>
                <p>Tap <strong>↶ Undo</strong> (orange, top right) to reverse your last throw — including shield gains, heals, and power-up claims.</p>
            </section>
        `
    },
    halveIt: {
        title: "Halve It Info",
        body: `
            <section class="info-section">
                <h3>Goal</h3>
                <p>Score as many points as possible across multiple rounds. Each round has a specific target to hit.</p>
            </section>
            <section class="info-section">
                <h3>Halving</h3>
                <p>If you miss the round's target with all three darts, your score is halved.</p>
            </section>
            <section class="info-section">
                <h3>Winning</h3>
                <p>The player with the highest score after all rounds wins.</p>
            </section>
        `
    },
    drink: {
        title: "Drink Mode Info",
        body: `
            <section class="info-section">
                <h3>How it works</h3>
                <p>Drink Mode gives you random dart challenges. Try the challenge, then follow the success or fail result.</p>
            </section>
            <section class="info-section">
                <h3>Examples</h3>
                <p>Challenges can ask you to hit a double, triple, bull, same number twice, or avoid missing.</p>
            </section>
            <section class="info-section">
                <h3>Play responsibly</h3>
                <p>You can play with any drink. Keep it fun and stop when needed.</p>
            </section>
        `
    }
};

function updateGameInfoContent() {
    const mode = document.body.dataset.currentMode || "home";
    const content = infoContentByMode[mode] || infoContentByMode.home;

    if (gameInfoTitle) {
        gameInfoTitle.textContent = content.title;
    }

    if (gameInfoBody) {
        gameInfoBody.innerHTML = content.body;
    }
}

function openGameInfoModal() {
    updateGameInfoContent();

    if (gameInfoModal) {
        gameInfoModal.classList.remove("hidden");
    }
}

function closeGameInfoModal() {
    if (gameInfoModal) {
        gameInfoModal.classList.add("hidden");
    }
}

if (gameInfoBtn) {
    gameInfoBtn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        openGameInfoModal();
    });
}

if (setupGameInfoBtn) {
    setupGameInfoBtn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        openGameInfoModal();
    });
}

if (boardGameInfoBtn) {
    boardGameInfoBtn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        openGameInfoModal();
    });
}

if (closeGameInfoTop) {
    closeGameInfoTop.addEventListener("click", function () {
        closeGameInfoModal();
    });
}

if (closeGameInfoBottom) {
    closeGameInfoBottom.addEventListener("click", function () {
        closeGameInfoModal();
    });
}

if (gameInfoBackdrop) {
    gameInfoBackdrop.addEventListener("click", function () {
        closeGameInfoModal();
    });
}