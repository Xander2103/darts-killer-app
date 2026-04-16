const settingsModal = document.getElementById("settingsModal");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const themeSelect = document.getElementById("themeSelect");
const immunityToggle = document.getElementById("immunityToggle");
const killerForeverToggle = document.getElementById("killerForeverToggle");
const exactZeroToggle = document.getElementById("exactZeroToggle");
const recoveryToggle = document.getElementById("recoveryToggle");
const settingsError = document.getElementById("settingsError");

//theme's opslaan in localStorage zodat ze behouden blijven bij herladen
const availableThemes = [
    "theme-neon",
    "theme-pub",
    "theme-arcade",
    "theme-clean"
];

function applyTheme(themeName) {
    document.body.classList.remove(...availableThemes);
    document.body.classList.add(themeName);
    localStorage.setItem("selectedTheme", themeName);
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem("selectedTheme");

    if (savedTheme && availableThemes.includes(savedTheme)) {
        applyTheme(savedTheme);
        themeSelect.value = savedTheme;
        return;
    }

    applyTheme("theme-neon");
    themeSelect.value = "theme-neon";
}

//Settings modal openen en sluiten
function openSettingsModal() {
    settingsModal.classList.remove("hidden");
    clearSettingsError();
}

function closeSettingsModal() {
    settingsModal.classList.add("hidden");
    clearSettingsError();
}

settingsButton.addEventListener("click", () => {
    openSettingsModal();
});

closeSettingsButton.addEventListener("click", () => {
    closeSettingsModal();
});

settingsModal.addEventListener("click", event => {
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
});

themeSelect.addEventListener("change", () => {
    applyTheme(themeSelect.value);
});

function showSettingsError(message) {
    if (!settingsError) {
        return;
    }

    settingsError.textContent = message;
    settingsError.classList.remove("hidden");
}

function clearSettingsError() {
    if (!settingsError) {
        return;
    }

    settingsError.textContent = "";
    settingsError.classList.add("hidden");
}

const clickableSettings = document.querySelectorAll(".clickable-setting");

clickableSettings.forEach(card => {
    card.addEventListener("click", event => {
        if (event.target.tagName === "INPUT") {
            return;
        }

        const settingType = card.dataset.setting;

        if (settingType === "immunity") {
            immunityToggle.checked = !immunityToggle.checked;
            clearSettingsError();
            immunityToggle.dispatchEvent(new Event("change"));
            return;
        }

        if (settingType === "killerForever") {
            killerForeverToggle.checked = !killerForeverToggle.checked;
            clearSettingsError();
            killerForeverToggle.dispatchEvent(new Event("change"));
            return;
        }

        if (settingType === "exactZero") {
            if (recoveryToggle.checked) {
                showSettingsError("‘Uit op exact 0’ kan niet aan zolang ‘Recovery vóór eigen beurt’ actief is.");
                return;
            }

            exactZeroToggle.checked = !exactZeroToggle.checked;
            clearSettingsError();
            exactZeroToggle.dispatchEvent(new Event("change"));
            return;
        }

        if (settingType === "recovery") {
            recoveryToggle.checked = !recoveryToggle.checked;
            clearSettingsError();
            recoveryToggle.dispatchEvent(new Event("change"));
        }
    });
});

//Game settings laden uit localStorage zodat ze behouden blijven bij herladen
function loadSavedGameSettings() {
    const savedImmunity = localStorage.getItem("immunityEnabled");
    if (savedImmunity !== null) {
        const immunityEnabled = savedImmunity === "true";
        game.settings.immunityEnabled = immunityEnabled;
        immunityToggle.checked = immunityEnabled;
    } else {
        game.settings.immunityEnabled = true;
        immunityToggle.checked = true;
    }

    const savedKillerForever = localStorage.getItem("killerStaysForever");
    if (savedKillerForever !== null) {
        const killerStaysForever = savedKillerForever === "true";
        game.settings.killerStaysForever = killerStaysForever;
        killerForeverToggle.checked = killerStaysForever;
    } else {
        game.settings.killerStaysForever = true;
        killerForeverToggle.checked = true;
    }

    const savedExactZero = localStorage.getItem("eliminateOnExactZeroOnly");
    if (savedExactZero !== null) {
        const eliminateOnExactZeroOnly = savedExactZero === "true";
        game.settings.eliminateOnExactZeroOnly = eliminateOnExactZeroOnly;
        exactZeroToggle.checked = eliminateOnExactZeroOnly;
    } else {
        game.settings.eliminateOnExactZeroOnly = false;
        exactZeroToggle.checked = false;
    }

    const savedRecovery = localStorage.getItem("allowRecoveryBeforeTurn");
    if (savedRecovery !== null) {
        const allowRecoveryBeforeTurn = savedRecovery === "true";
        game.settings.allowRecoveryBeforeTurn = allowRecoveryBeforeTurn;
        recoveryToggle.checked = allowRecoveryBeforeTurn;
    } else {
        game.settings.allowRecoveryBeforeTurn = true;
        recoveryToggle.checked = true;
    }

    if (game.settings.allowRecoveryBeforeTurn && game.settings.eliminateOnExactZeroOnly) {
        game.settings.eliminateOnExactZeroOnly = false;
        exactZeroToggle.checked = false;
    }
}

//Game settings opslaan wanneer ze veranderen
function saveGameSettings() {
    localStorage.setItem("immunityEnabled", String(game.settings.immunityEnabled));
    localStorage.setItem("killerStaysForever", String(game.settings.killerStaysForever));
    localStorage.setItem("eliminateOnExactZeroOnly", String(game.settings.eliminateOnExactZeroOnly));
    localStorage.setItem("allowRecoveryBeforeTurn", String(game.settings.allowRecoveryBeforeTurn));
}

immunityToggle.addEventListener("change", () => {
    game.settings.immunityEnabled = immunityToggle.checked;
    saveGameSettings();
    renderApp(game);
});

killerForeverToggle.addEventListener("change", () => {
    game.settings.killerStaysForever = killerForeverToggle.checked;
    saveGameSettings();
    renderApp(game);
});

exactZeroToggle.addEventListener("click", event => {
    if (recoveryToggle.checked && !exactZeroToggle.checked) {
        event.preventDefault();
        showSettingsError("‘Uit op exact 0’ kan niet aan zolang ‘Recovery vóór eigen beurt’ actief is.");
    } else {
        clearSettingsError();
    }
});

exactZeroToggle.addEventListener("change", () => {
    game.settings.eliminateOnExactZeroOnly = exactZeroToggle.checked;
    saveGameSettings();
    renderApp(game);
});

recoveryToggle.addEventListener("change", () => {
    game.settings.allowRecoveryBeforeTurn = recoveryToggle.checked;

    if (game.settings.allowRecoveryBeforeTurn && exactZeroToggle.checked) {
        game.settings.eliminateOnExactZeroOnly = false;
        exactZeroToggle.checked = false;
        showSettingsError("‘Uit op exact 0’ werd uitgezet omdat ‘Recovery vóór eigen beurt’ actief is.");
    } else {
        clearSettingsError();
    }

    saveGameSettings();
    renderApp(game);
});

loadSavedTheme();
loadSavedGameSettings();