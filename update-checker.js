// update-checker.js
//
// HOW TO USE FOR FUTURE RELEASES:
//   1. Before every release: increase APP_VERSION below (e.g. "1.0.0" → "1.1.0")
//   2. After publishing to the stores: update "latestVersion" in the remote
//      update.json at https://vanmalderstudio.be/darts-killer/update.json
//   3. For the Android URL: use a direct Play Store details link once the package
//      name is known, e.g. https://play.google.com/store/apps/details?id=be.vanmalderstudio.dartskiller

// APP_VERSION must match the version you ship in the stores.
export const APP_VERSION = "1.0.0";

const UPDATE_JSON_URL = "https://vanmalderstudio.be/darts-killer/update.json";
const DISMISSED_KEY = "dismissedUpdateVersion";

// Returns negative if a < b, 0 if equal, positive if a > b.
function compareSemVer(a, b) {
    const aParts = String(a).split(".").map(Number);
    const bParts = String(b).split(".").map(Number);
    for (let i = 0; i < 3; i++) {
        const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

function detectPlatform() {
    // Capacitor exposes the native platform at runtime.
    if (window.Capacitor && typeof window.Capacitor.getPlatform === "function") {
        return window.Capacitor.getPlatform(); // "android" | "ios" | "web"
    }
    const ua = navigator.userAgent || "";
    if (/android/i.test(ua)) return "android";
    if (/iphone|ipad|ipod/i.test(ua)) return "ios";
    return "web";
}

async function openStoreUrl(url) {
    try {
        // Use Capacitor Browser if available (opens in-app browser on native).
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url });
    } catch {
        // Fallback for web or when @capacitor/browser is not installed.
        window.open(url, "_blank", "noopener,noreferrer");
    }
}

function buildUpdateModal(data, platform, isForced) {
    const storeUrl = platform === "ios" ? (data.iosUrl || "") : (data.androidUrl || "");
    const hasUrl = storeUrl.trim().length > 0;

    const overlay = document.createElement("div");
    overlay.className = "update-modal-overlay";
    overlay.id = "updateModalOverlay";

    const box = document.createElement("div");
    box.className = "update-modal-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "updateModalTitle");

    const title = document.createElement("h2");
    title.className = "update-modal-title";
    title.id = "updateModalTitle";
    title.textContent = data.title || "Update available";

    const message = document.createElement("p");
    message.className = "update-modal-message";
    message.textContent = data.message || "A new version is available.";

    const actions = document.createElement("div");
    actions.className = "update-modal-actions";

    function dismiss() {
        localStorage.setItem(DISMISSED_KEY, data.latestVersion);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    if (!isForced) {
        const laterBtn = document.createElement("button");
        laterBtn.className = "update-modal-btn update-modal-btn-later";
        laterBtn.textContent = data.laterButtonText || "Later";
        laterBtn.addEventListener("click", dismiss);
        actions.appendChild(laterBtn);
    }

    if (hasUrl) {
        const updateBtn = document.createElement("button");
        updateBtn.className = "update-modal-btn update-modal-btn-update";
        updateBtn.textContent = data.buttonText || "Update now";
        updateBtn.addEventListener("click", () => openStoreUrl(storeUrl));
        actions.appendChild(updateBtn);
    }

    box.appendChild(title);
    box.appendChild(message);
    box.appendChild(actions);
    overlay.appendChild(box);

    // Backdrop tap closes only when update is not forced.
    if (!isForced) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) dismiss();
        });
    }

    document.body.appendChild(overlay);
}

export async function checkForUpdates() {
    try {
        const res = await fetch(UPDATE_JSON_URL, { cache: "no-cache" });
        if (!res.ok) return;

        const data = await res.json();
        if (!data.enabled) return;

        const { latestVersion, minRequiredVersion, forceUpdate } = data;
        if (!latestVersion) return;

        // No update needed — current version is up to date.
        if (compareSemVer(APP_VERSION, latestVersion) >= 0) return;

        // Force update when minRequiredVersion is higher than the installed version.
        const isForcedByMin =
            minRequiredVersion && compareSemVer(APP_VERSION, minRequiredVersion) < 0;
        const isForced = Boolean(forceUpdate) || isForcedByMin;

        // Skip if user already dismissed this exact version (only for non-forced).
        if (!isForced) {
            const dismissed = localStorage.getItem(DISMISSED_KEY);
            if (dismissed === latestVersion) return;
        }

        const platform = detectPlatform();
        buildUpdateModal(data, platform, isForced);
    } catch {
        // Fail silently — app must work offline and never block startup.
    }
}
