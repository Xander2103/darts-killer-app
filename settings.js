// settings beheren, inclusief thema's en game-instellingen

export function initSettings(game, renderApp, renderActions = {}) {
    const settingsModal = document.getElementById("settingsModal");
    const settingsButton = document.getElementById("settingsButton");
    const closeSettingsButton = document.getElementById("closeSettingsButton");
    const themeSelect = document.getElementById("themeSelect");
    const immunityToggle = document.getElementById("immunityToggle");
    const killerForeverToggle = document.getElementById("killerForeverToggle");
    const exactZeroToggle = document.getElementById("exactZeroToggle");
    const recoveryToggle = document.getElementById("recoveryToggle");
    const settingsError = document.getElementById("settingsError");

    const chaosRuleScopeToggle = document.getElementById("chaosRuleScopeToggle");
    const chaosSettingsSection = document.getElementById("chaosSettingsSection");

    // chaos modifier toggles
    const doubleTroubleToggle = document.getElementById("doubleTroubleToggle");
    const tripleTroubleToggle = document.getElementById("tripleTroubleToggle");
    const bonusDartsToggle = document.getElementById("bonusDartsToggle");
    const immunityOffToggle = document.getElementById("immunityOffToggle");
    const targetLockToggle = document.getElementById("targetLockToggle");
    const noMissToggle = document.getElementById("noMissToggle");
    const lastDartPressureToggle = document.getElementById("lastDartPressureToggle");
    const doubleDamageToggle = document.getElementById("doubleDamageToggle");
    const oneShotToggle = document.getElementById("oneShotToggle");
    const safeZoneToggle = document.getElementById("safeZoneToggle");
    const hotStreakToggle = document.getElementById("hotStreakToggle");
    const vampireModeToggle = document.getElementById("vampireModeToggle");
    const revivalToggle = document.getElementById("revivalToggle");
    const instantKillToggle = document.getElementById("instantKillToggle");
    const suddenDeathToggle = document.getElementById("suddenDeathToggle");
    const bullseyeMadnessToggle = document.getElementById("bullseyeMadnessToggle");
    const randomTargetSwapToggle = document.getElementById("randomTargetSwapToggle");
    const firstBloodToggle = document.getElementById("firstBloodToggle");
    const focusToggle = document.getElementById("focusToggle");
    const equalizerToggle = document.getElementById("equalizerToggle");
    const luckyHitToggle = document.getElementById("luckyHitToggle");
    const steadyHandToggle = document.getElementById("steadyHandToggle");
    const openSeasonToggle = document.getElementById("openSeasonToggle");

    // cards om per mode te kunnen tonen/verbergen
    const immunityCard = document.querySelector('[data-setting="immunity"]');
    const killerForeverCard = document.querySelector('[data-setting="killerForever"]');
    const exactZeroCard = document.querySelector('[data-setting="exactZero"]');
    const recoveryCard = document.querySelector('[data-setting="recovery"]');

    const availableThemes = [
        "theme-neon",
        "theme-pub",
        "theme-arcade",
        "theme-clean"
    ];

    const defaultChaosModifiers = {
        doubleTrouble: true,
        tripleTrouble: true,
        bonusDarts: true,
        immunityOff: true,
        targetLock: true,
        noMiss: true,
        lastDartPressure: true,
        doubleDamage: true,
        oneShot: true,
        safeZone: true,
        hotStreak: true,
        vampireMode: true,
        revival: true,
        instantKill: true,
        suddenDeath: true,
        bullseyeMadness: true,
        randomTargetSwap: true,
        firstBlood: true,
        focus: true,
        equalizer: true,
        luckyHit: true,
        steadyHand: true,
        openSeason: true,
    };

    const defaultSettingsByMode = {
        classic: {
            immunityEnabled: true,
            killerStaysForever: true,
            eliminateOnExactZeroOnly: false,
            allowRecoveryBeforeTurn: true,
            chaosRuleScope: "round",
            chaosModifiers: { ...defaultChaosModifiers }
        },
        chaos: {
            immunityEnabled: true,
            killerStaysForever: true,
            eliminateOnExactZeroOnly: false,
            allowRecoveryBeforeTurn: true,
            chaosRuleScope: "round",
            chaosModifiers: { ...defaultChaosModifiers }
        },
        drink: {
            immunityEnabled: true,
            killerStaysForever: true,
            eliminateOnExactZeroOnly: false,
            allowRecoveryBeforeTurn: true,
            chaosRuleScope: "round",
            chaosModifiers: { ...defaultChaosModifiers }
        }
    };

    function ensureChaosModifiersObject() {
        if (!game.settings.chaosModifiers) {
            game.settings.chaosModifiers = { ...defaultChaosModifiers };
            return;
        }

        for (const modifierKey in defaultChaosModifiers) {
            if (!(modifierKey in game.settings.chaosModifiers)) {
                game.settings.chaosModifiers[modifierKey] = defaultChaosModifiers[modifierKey];
            }
        }
    }

    function getActiveMode() {
        return game.gameMode || "classic";
    }

    function getStorageKey(settingName) {
        return `${getActiveMode()}_${settingName}`;
    }

    function getDefaultsForActiveMode() {
        return defaultSettingsByMode[getActiveMode()] || defaultSettingsByMode.classic;
    }

    function applyTheme(themeName) {
        document.body.classList.remove(...availableThemes);
        document.body.classList.add(themeName);
        localStorage.setItem("selectedTheme", themeName);
    }

    function loadSavedTheme() {
        const savedTheme = localStorage.getItem("selectedTheme");

        if (savedTheme && availableThemes.includes(savedTheme)) {
            applyTheme(savedTheme);

            if (themeSelect) {
                themeSelect.value = savedTheme;
            }

            return;
        }

        applyTheme("theme-neon");

        if (themeSelect) {
            themeSelect.value = "theme-neon";
        }
    }

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

    function updateSettingsUIForMode() {
        const activeMode = getActiveMode();
        const isChaosMode = activeMode === "chaos";

        // Base rules die altijd zichtbaar mogen zijn
        if (immunityCard) {
            immunityCard.style.display = "";
        }

        if (recoveryCard) {
            recoveryCard.style.display = "";
        }

        // Alleen zichtbaar in Classic / Drink, niet in Chaos
        if (killerForeverCard) {
            killerForeverCard.style.display = isChaosMode ? "none" : "";
        }

        if (exactZeroCard) {
            exactZeroCard.style.display = isChaosMode ? "none" : "";
        }

        // Chaos-sectie alleen zichtbaar in Chaos mode
        if (chaosSettingsSection) {
            chaosSettingsSection.style.display = isChaosMode ? "flex" : "none";
            chaosSettingsSection.classList.toggle("hidden", !isChaosMode);
        }

        // Chaos rule scope toggle mag alleen in Chaos zichtbaar zijn
        if (chaosRuleScopeToggle) {
            const scopeCard =
                chaosRuleScopeToggle.closest(".setting-card") ||
                chaosRuleScopeToggle.closest(".clickable-setting");

            if (scopeCard) {
                scopeCard.style.display = isChaosMode ? "" : "none";
            }
        }
    }
    function applyForcedSettingsForMode() {
        const activeMode = getActiveMode();

        if (activeMode === "chaos") {
            game.settings.killerStaysForever = true;
            game.settings.eliminateOnExactZeroOnly = false;
        }
    }

    function syncTogglesFromGameSettings() {
        ensureChaosModifiersObject();

        if (immunityToggle) {
            immunityToggle.checked = game.settings.immunityEnabled;
        }

        if (killerForeverToggle) {
            killerForeverToggle.checked = game.settings.killerStaysForever;
        }

        if (exactZeroToggle) {
            exactZeroToggle.checked = game.settings.eliminateOnExactZeroOnly;
        }

        if (recoveryToggle) {
            recoveryToggle.checked = game.settings.allowRecoveryBeforeTurn;
        }

        if (chaosRuleScopeToggle) {
            chaosRuleScopeToggle.checked = game.settings.chaosRuleScope === "turn";
        }

        if (doubleTroubleToggle) {
            doubleTroubleToggle.checked = game.settings.chaosModifiers.doubleTrouble;
        }

        if (tripleTroubleToggle) {
            tripleTroubleToggle.checked = game.settings.chaosModifiers.tripleTrouble;
        }

        if (bonusDartsToggle) {
            bonusDartsToggle.checked = game.settings.chaosModifiers.bonusDarts;
        }

        if (immunityOffToggle) {
            immunityOffToggle.checked = game.settings.chaosModifiers.immunityOff;
        }

        if (targetLockToggle) {
            targetLockToggle.checked = game.settings.chaosModifiers.targetLock;
        }

        if (noMissToggle) {
            noMissToggle.checked = game.settings.chaosModifiers.noMiss;
        }

        if (lastDartPressureToggle) {
            lastDartPressureToggle.checked = game.settings.chaosModifiers.lastDartPressure;
        }

        if (doubleDamageToggle) {
            doubleDamageToggle.checked = game.settings.chaosModifiers.doubleDamage;
        }

        if (oneShotToggle) {
            oneShotToggle.checked = game.settings.chaosModifiers.oneShot;
        }

        if (safeZoneToggle) {
            safeZoneToggle.checked = game.settings.chaosModifiers.safeZone;
        }

        if (hotStreakToggle) {
            hotStreakToggle.checked = game.settings.chaosModifiers.hotStreak;
        }

        if (vampireModeToggle) {
            vampireModeToggle.checked = game.settings.chaosModifiers.vampireMode;
        }

        if (revivalToggle) {
            revivalToggle.checked = game.settings.chaosModifiers.revival;
        }

        if (instantKillToggle) {
            instantKillToggle.checked = game.settings.chaosModifiers.instantKill;
        }

        if (suddenDeathToggle) {
            suddenDeathToggle.checked = game.settings.chaosModifiers.suddenDeath;
        }

        if (bullseyeMadnessToggle) {
            bullseyeMadnessToggle.checked = game.settings.chaosModifiers.bullseyeMadness;
        }

        if (randomTargetSwapToggle) {
            randomTargetSwapToggle.checked = game.settings.chaosModifiers.randomTargetSwap;
        }

        if (firstBloodToggle) {
            firstBloodToggle.checked = game.settings.chaosModifiers.firstBlood;
        }

        if (focusToggle) {
            focusToggle.checked = game.settings.chaosModifiers.focus;
        }

        if (equalizerToggle) {
            equalizerToggle.checked = game.settings.chaosModifiers.equalizer;
        }

        if (luckyHitToggle) {
            luckyHitToggle.checked = game.settings.chaosModifiers.luckyHit;
        }

        if (steadyHandToggle) {
            steadyHandToggle.checked = game.settings.chaosModifiers.steadyHand;
        }

        if (openSeasonToggle) {
            openSeasonToggle.checked = game.settings.chaosModifiers.openSeason;
        }
    }

    function applyDefaultSettingsToGame() {
        const defaults = getDefaultsForActiveMode();

        game.settings.immunityEnabled = defaults.immunityEnabled;
        game.settings.killerStaysForever = defaults.killerStaysForever;
        game.settings.eliminateOnExactZeroOnly = defaults.eliminateOnExactZeroOnly;
        game.settings.allowRecoveryBeforeTurn = defaults.allowRecoveryBeforeTurn;
        game.settings.chaosRuleScope = defaults.chaosRuleScope;
        game.settings.chaosModifiers = { ...defaults.chaosModifiers };
    }

    function loadChaosModifierSetting(modifierKey) {
        const savedValue = localStorage.getItem(getStorageKey(`chaosModifier_${modifierKey}`));

        if (savedValue !== null) {
            return savedValue === "true";
        }

        const defaults = getDefaultsForActiveMode();
        return defaults.chaosModifiers[modifierKey];
    }

    function saveChaosModifierSetting(modifierKey, value) {
        localStorage.setItem(getStorageKey(`chaosModifier_${modifierKey}`), String(value));
    }

    function openSettingsModal() {
        if (!settingsModal) {
            return;
        }

        loadSavedGameSettings();
        updateSettingsUIForMode();
        syncTogglesFromGameSettings();

        settingsModal.classList.remove("hidden");
        clearSettingsError();
    }

    function closeSettingsModal() {
        if (!settingsModal) {
            return;
        }

        settingsModal.classList.add("hidden");
        clearSettingsError();
    }

    function loadSavedGameSettings() {
        const defaults = getDefaultsForActiveMode();

        ensureChaosModifiersObject();

        const savedImmunity = localStorage.getItem(getStorageKey("immunityEnabled"));
        if (savedImmunity !== null) {
            game.settings.immunityEnabled = savedImmunity === "true";
        } else {
            game.settings.immunityEnabled = defaults.immunityEnabled;
        }

        const savedKillerForever = localStorage.getItem(getStorageKey("killerStaysForever"));
        if (savedKillerForever !== null) {
            game.settings.killerStaysForever = savedKillerForever === "true";
        } else {
            game.settings.killerStaysForever = defaults.killerStaysForever;
        }

        const savedExactZero = localStorage.getItem(getStorageKey("eliminateOnExactZeroOnly"));
        if (savedExactZero !== null) {
            game.settings.eliminateOnExactZeroOnly = savedExactZero === "true";
        } else {
            game.settings.eliminateOnExactZeroOnly = defaults.eliminateOnExactZeroOnly;
        }

        const savedRecovery = localStorage.getItem(getStorageKey("allowRecoveryBeforeTurn"));
        if (savedRecovery !== null) {
            game.settings.allowRecoveryBeforeTurn = savedRecovery === "true";
        } else {
            game.settings.allowRecoveryBeforeTurn = defaults.allowRecoveryBeforeTurn;
        }

        const savedChaosRuleScope = localStorage.getItem(getStorageKey("chaosRuleScope"));
        if (savedChaosRuleScope !== null && (savedChaosRuleScope === "round" || savedChaosRuleScope === "turn")) {
            game.settings.chaosRuleScope = savedChaosRuleScope;
        } else {
            game.settings.chaosRuleScope = defaults.chaosRuleScope;
        }

        game.settings.chaosModifiers = {
            doubleTrouble: loadChaosModifierSetting("doubleTrouble"),
            tripleTrouble: loadChaosModifierSetting("tripleTrouble"),
            bonusDarts: loadChaosModifierSetting("bonusDarts"),
            immunityOff: loadChaosModifierSetting("immunityOff"),
            targetLock: loadChaosModifierSetting("targetLock"),
            noMiss: loadChaosModifierSetting("noMiss"),
            lastDartPressure: loadChaosModifierSetting("lastDartPressure"),
            doubleDamage: loadChaosModifierSetting("doubleDamage"),
            oneShot: loadChaosModifierSetting("oneShot"),
            safeZone: loadChaosModifierSetting("safeZone"),
            hotStreak: loadChaosModifierSetting("hotStreak"),
            vampireMode: loadChaosModifierSetting("vampireMode"),
            revival: loadChaosModifierSetting("revival"),
            instantKill: loadChaosModifierSetting("instantKill"),
            suddenDeath: loadChaosModifierSetting("suddenDeath"),
            bullseyeMadness: loadChaosModifierSetting("bullseyeMadness"),
            randomTargetSwap: loadChaosModifierSetting("randomTargetSwap"),
            firstBlood: loadChaosModifierSetting("firstBlood"),
            focus: loadChaosModifierSetting("focus"),
            equalizer: loadChaosModifierSetting("equalizer"),
            luckyHit: loadChaosModifierSetting("luckyHit"),
            steadyHand: loadChaosModifierSetting("steadyHand"),
            openSeason: loadChaosModifierSetting("openSeason"),
        };

        if (game.settings.allowRecoveryBeforeTurn && game.settings.eliminateOnExactZeroOnly) {
            game.settings.eliminateOnExactZeroOnly = false;
        }

        applyForcedSettingsForMode();

        syncTogglesFromGameSettings();
        updateSettingsUIForMode();
    }

    function saveGameSettings() {
        ensureChaosModifiersObject();
        applyForcedSettingsForMode();

        localStorage.setItem(getStorageKey("immunityEnabled"), String(game.settings.immunityEnabled));
        localStorage.setItem(getStorageKey("killerStaysForever"), String(game.settings.killerStaysForever));
        localStorage.setItem(getStorageKey("eliminateOnExactZeroOnly"), String(game.settings.eliminateOnExactZeroOnly));
        localStorage.setItem(getStorageKey("allowRecoveryBeforeTurn"), String(game.settings.allowRecoveryBeforeTurn));
        localStorage.setItem(getStorageKey("chaosRuleScope"), String(game.settings.chaosRuleScope));

        saveChaosModifierSetting("doubleTrouble", game.settings.chaosModifiers.doubleTrouble);
        saveChaosModifierSetting("tripleTrouble", game.settings.chaosModifiers.tripleTrouble);
        saveChaosModifierSetting("bonusDarts", game.settings.chaosModifiers.bonusDarts);
        saveChaosModifierSetting("immunityOff", game.settings.chaosModifiers.immunityOff);
        saveChaosModifierSetting("targetLock", game.settings.chaosModifiers.targetLock);
        saveChaosModifierSetting("noMiss", game.settings.chaosModifiers.noMiss);
        saveChaosModifierSetting("lastDartPressure", game.settings.chaosModifiers.lastDartPressure);
        saveChaosModifierSetting("doubleDamage", game.settings.chaosModifiers.doubleDamage);
        saveChaosModifierSetting("oneShot", game.settings.chaosModifiers.oneShot);
        saveChaosModifierSetting("safeZone", game.settings.chaosModifiers.safeZone);
        saveChaosModifierSetting("hotStreak", game.settings.chaosModifiers.hotStreak);
        saveChaosModifierSetting("vampireMode", game.settings.chaosModifiers.vampireMode);
        saveChaosModifierSetting("revival", game.settings.chaosModifiers.revival);
        saveChaosModifierSetting("instantKill", game.settings.chaosModifiers.instantKill);
        saveChaosModifierSetting("suddenDeath", game.settings.chaosModifiers.suddenDeath);
        saveChaosModifierSetting("bullseyeMadness", game.settings.chaosModifiers.bullseyeMadness);
        saveChaosModifierSetting("randomTargetSwap", game.settings.chaosModifiers.randomTargetSwap);
        saveChaosModifierSetting("firstBlood", game.settings.chaosModifiers.firstBlood);
        saveChaosModifierSetting("focus", game.settings.chaosModifiers.focus);
        saveChaosModifierSetting("equalizer", game.settings.chaosModifiers.equalizer);
        saveChaosModifierSetting("luckyHit", game.settings.chaosModifiers.luckyHit);
        saveChaosModifierSetting("steadyHand", game.settings.chaosModifiers.steadyHand);
        saveChaosModifierSetting("openSeason", game.settings.chaosModifiers.openSeason);
    }

    function applySettingsForCurrentMode() {
        loadSavedGameSettings();
        updateSettingsUIForMode();
        syncTogglesFromGameSettings();
    }

    function resetSettingsForCurrentMode() {
        applyDefaultSettingsToGame();
        applyForcedSettingsForMode();
        saveGameSettings();
        syncTogglesFromGameSettings();
        updateSettingsUIForMode();
        clearSettingsError();
        renderApp(game, renderActions);
    }

    if (settingsButton) {
        settingsButton.addEventListener("click", () => {
            openSettingsModal();
        });
    }

    if (closeSettingsButton) {
        closeSettingsButton.addEventListener("click", () => {
            closeSettingsModal();
        });
    }

    if (settingsModal) {
        settingsModal.addEventListener("click", event => {
            if (event.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }

    if (themeSelect) {
        themeSelect.addEventListener("change", () => {
            applyTheme(themeSelect.value);
        });
    }

    const clickableSettings = document.querySelectorAll(".clickable-setting");

    clickableSettings.forEach(card => {
        card.addEventListener("click", event => {
            if (event.target.tagName === "INPUT") {
                return;
            }

            const settingType = card.dataset.setting;
            const isChaosMode = getActiveMode() === "chaos";

            if (settingType === "immunity" && immunityToggle) {
                immunityToggle.checked = !immunityToggle.checked;
                clearSettingsError();
                immunityToggle.dispatchEvent(new Event("change"));
                return;
            }

            if (settingType === "killerForever" && killerForeverToggle) {
                if (isChaosMode) {
                    return;
                }

                killerForeverToggle.checked = !killerForeverToggle.checked;
                clearSettingsError();
                killerForeverToggle.dispatchEvent(new Event("change"));
                return;
            }

            if (settingType === "exactZero" && exactZeroToggle && recoveryToggle) {
                if (isChaosMode) {
                    return;
                }

                if (recoveryToggle.checked) {
                    showSettingsError("‘Uit op exact 0’ kan niet aan zolang ‘Recovery vóór eigen beurt’ actief is.");
                    return;
                }

                exactZeroToggle.checked = !exactZeroToggle.checked;
                clearSettingsError();
                exactZeroToggle.dispatchEvent(new Event("change"));
                return;
            }

            if (settingType === "recovery" && recoveryToggle) {
                recoveryToggle.checked = !recoveryToggle.checked;
                clearSettingsError();
                recoveryToggle.dispatchEvent(new Event("change"));
                return;
            }

            const chaosModifierMap = {
                chaosRuleScope: chaosRuleScopeToggle,
                doubleTrouble: doubleTroubleToggle,
                tripleTrouble: tripleTroubleToggle,
                bonusDarts: bonusDartsToggle,
                immunityOff: immunityOffToggle,
                targetLock: targetLockToggle,
                noMiss: noMissToggle,
                lastDartPressure: lastDartPressureToggle,
                doubleDamage: doubleDamageToggle,
                oneShot: oneShotToggle,
                safeZone: safeZoneToggle,
                hotStreak: hotStreakToggle,
                vampireMode: vampireModeToggle,
                revival: revivalToggle,
                instantKill: instantKillToggle,
                suddenDeath: suddenDeathToggle,
                bullseyeMadness: bullseyeMadnessToggle,
                randomTargetSwap: randomTargetSwapToggle,
                firstBlood: firstBloodToggle,
                focus: focusToggle,
                equalizer: equalizerToggle,
                luckyHit: luckyHitToggle,
                steadyHand: steadyHandToggle,
                openSeason: openSeasonToggle,
            };

            const targetToggle = chaosModifierMap[settingType];

            if (targetToggle) {
                targetToggle.checked = !targetToggle.checked;
                clearSettingsError();
                targetToggle.dispatchEvent(new Event("change"));
            }
        });
    });

    if (immunityToggle) {
        immunityToggle.addEventListener("change", () => {
            game.settings.immunityEnabled = immunityToggle.checked;
            saveGameSettings();
            renderApp(game, renderActions);
        });
    }

    if (killerForeverToggle) {
        killerForeverToggle.addEventListener("change", () => {
            if (getActiveMode() === "chaos") {
                game.settings.killerStaysForever = true;
                killerForeverToggle.checked = true;
                return;
            }

            game.settings.killerStaysForever = killerForeverToggle.checked;
            saveGameSettings();
            renderApp(game, renderActions);
        });
    }

    if (exactZeroToggle && recoveryToggle) {
        exactZeroToggle.addEventListener("click", event => {
            if (getActiveMode() === "chaos") {
                event.preventDefault();
                return;
            }

            if (recoveryToggle.checked && !exactZeroToggle.checked) {
                event.preventDefault();
                showSettingsError("‘Uit op exact 0’ kan niet aan zolang ‘Recovery vóór eigen beurt’ actief is.");
            } else {
                clearSettingsError();
            }
        });

        exactZeroToggle.addEventListener("change", () => {
            if (getActiveMode() === "chaos") {
                game.settings.eliminateOnExactZeroOnly = false;
                exactZeroToggle.checked = false;
                return;
            }

            game.settings.eliminateOnExactZeroOnly = exactZeroToggle.checked;
            saveGameSettings();
            renderApp(game, renderActions);
        });
    }

    if (recoveryToggle && exactZeroToggle) {
        recoveryToggle.addEventListener("change", () => {
            game.settings.allowRecoveryBeforeTurn = recoveryToggle.checked;

            if (game.settings.allowRecoveryBeforeTurn && exactZeroToggle.checked) {
                game.settings.eliminateOnExactZeroOnly = false;
                exactZeroToggle.checked = false;
                showSettingsError("‘Uit op exact 0’ werd uitgezet omdat ‘Recovery vóór eigen beurt’ actief is.");
            } else {
                clearSettingsError();
            }

            applyForcedSettingsForMode();
            saveGameSettings();
            renderApp(game, renderActions);
        });
    }

    if (chaosRuleScopeToggle) {
        chaosRuleScopeToggle.addEventListener("change", () => {
            game.settings.chaosRuleScope = chaosRuleScopeToggle.checked ? "turn" : "round";
            saveGameSettings();
            renderApp(game, renderActions);
        });
    }

    if (doubleTroubleToggle) {
        doubleTroubleToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.doubleTrouble = doubleTroubleToggle.checked;
            saveGameSettings();
        });
    }

    if (tripleTroubleToggle) {
        tripleTroubleToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.tripleTrouble = tripleTroubleToggle.checked;
            saveGameSettings();
        });
    }

    if (bonusDartsToggle) {
        bonusDartsToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.bonusDarts = bonusDartsToggle.checked;
            saveGameSettings();
        });
    }

    if (immunityOffToggle) {
        immunityOffToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.immunityOff = immunityOffToggle.checked;
            saveGameSettings();
        });
    }

    if (targetLockToggle) {
        targetLockToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.targetLock = targetLockToggle.checked;
            saveGameSettings();
        });
    }

    if (noMissToggle) {
        noMissToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.noMiss = noMissToggle.checked;
            saveGameSettings();
        });
    }

    if (lastDartPressureToggle) {
        lastDartPressureToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.lastDartPressure = lastDartPressureToggle.checked;
            saveGameSettings();
        });
    }

    if (doubleDamageToggle) {
        doubleDamageToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.doubleDamage = doubleDamageToggle.checked;
            saveGameSettings();
        });
    }

    if (oneShotToggle) {
        oneShotToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.oneShot = oneShotToggle.checked;
            saveGameSettings();
        });
    }

    if (safeZoneToggle) {
        safeZoneToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.safeZone = safeZoneToggle.checked;
            saveGameSettings();
        });
    }

    if (hotStreakToggle) {
        hotStreakToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.hotStreak = hotStreakToggle.checked;
            saveGameSettings();
        });
    }

    if (vampireModeToggle) {
        vampireModeToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.vampireMode = vampireModeToggle.checked;
            saveGameSettings();
        });
    }

    if (revivalToggle) {
        revivalToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.revival = revivalToggle.checked;
            saveGameSettings();
        });
    }

    if (instantKillToggle) {
        instantKillToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.instantKill = instantKillToggle.checked;
            saveGameSettings();
        });
    }

    if (suddenDeathToggle) {
        suddenDeathToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.suddenDeath = suddenDeathToggle.checked;
            saveGameSettings();
        });
    }

    if (bullseyeMadnessToggle) {
        bullseyeMadnessToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.bullseyeMadness = bullseyeMadnessToggle.checked;
            saveGameSettings();
        });
    }

    if (randomTargetSwapToggle) {
        randomTargetSwapToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.randomTargetSwap = randomTargetSwapToggle.checked;
            saveGameSettings();
        });
    }

    if (firstBloodToggle) {
        firstBloodToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.firstBlood = firstBloodToggle.checked;
            saveGameSettings();
        });
    }

    if (focusToggle) {
        focusToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.focus = focusToggle.checked;
            saveGameSettings();
        });
    }

    if (equalizerToggle) {
        equalizerToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.equalizer = equalizerToggle.checked;
            saveGameSettings();
        });
    }

    if (luckyHitToggle) {
        luckyHitToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.luckyHit = luckyHitToggle.checked;
            saveGameSettings();
        });
    }

    if (steadyHandToggle) {
        steadyHandToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.steadyHand = steadyHandToggle.checked;
            saveGameSettings();
        });
    }

    if (openSeasonToggle) {
        openSeasonToggle.addEventListener("change", () => {
            game.settings.chaosModifiers.openSeason = openSeasonToggle.checked;
            saveGameSettings();
        });
    }

    loadSavedTheme();
    loadSavedGameSettings();

    return {
        openSettingsModal,
        closeSettingsModal,
        applySettingsForCurrentMode,
        resetSettingsForCurrentMode
    };
}