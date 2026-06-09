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
        title: "Game Info",
        body: `
            <section class="info-section">
                <h3>Choose a mode</h3>
                <p><strong>Classic Killer:</strong> Standard Killer darts with player numbers, killers and elimination.</p>
                <p><strong>Chaos Mode:</strong> Killer darts with random modifiers and party effects.</p>
                <p><strong>121 Checkout:</strong> Collaborative checkout training. Bring the target to exactly 0 within the dart limit.</p>
                <p><strong>Halve It:</strong> Number rounds with random challenges. Miss a round and your score is halved.</p>
                <p><strong>Drink Mode:</strong> Party challenge cards for darts and drinks. Play responsibly.</p>
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
        title: "Transit Arena",
        body: `
            <section class="info-section">
                <h3>HP Battle Royale</h3>
                <p>All players start with <strong>10 HP</strong>. Attack opponents to drain their HP. Last player alive wins.</p>
            </section>
            <section class="info-section">
                <h3>Attack</h3>
                <p>Hit a number to deal damage to your selected target. Single = −1 HP · Double = −2 HP · Triple = −3 HP. Bull 25 = −2 HP · Bull 50 = −5 HP.</p>
            </section>
            <section class="info-section">
                <h3>Power-Ups</h3>
                <p>A glowing segment appears periodically on the board. Hit it to unlock the power-up — then tap the coin icon to claim it.</p>
            </section>
            <section class="info-section">
                <h3>Shields</h3>
                <p>Some power-ups grant shield points that absorb incoming damage before HP is lost.</p>
            </section>
            <section class="info-section">
                <h3>Target &amp; Multiplier</h3>
                <p>Tap a player card to change your target. Use the <strong>S / D / T</strong> row to set your multiplier before throwing.</p>
            </section>
            <section class="info-section">
                <h3>Undo</h3>
                <p>Tap <strong>↶ Undo</strong> to reverse your last throw, including power-up claims.</p>
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