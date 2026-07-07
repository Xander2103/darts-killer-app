// www/shared/ios-scroll-lock.js
// Best-effort scroll-position restorer for iOS WKWebView numeric gameplay inputs.
//
// Problem: when a native <input> receives focus, WKWebView scrolls the page to
// keep the input visible. With Keyboard.resize="none" the viewport doesn't
// resize, but iOS still runs a built-in scroll-to-caret pass (~350 ms after
// focus). This helper stores scroll state on focusin and restores it after that
// delay — a best-effort fix, not a guarantee.
//
// Applies ONLY to elements with [data-numeric-gameplay].
// Player-name text inputs are left alone.

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

if (isIOS) {
    let _savedScrollY = 0;
    let _savedContainerTop = 0;
    let _restoreTimer = null;

    function _getGameContainer() {
        // Nearest scrollable game panel; fall back to .screen-body
        return (
            document.querySelector(".game-panel .screen-body") ||
            document.querySelector(".screen-body") ||
            null
        );
    }

    document.addEventListener("focusin", e => {
        if (!e.target.hasAttribute("data-numeric-gameplay")) return;

        // Cancel any pending restore from a previous focus
        if (_restoreTimer) { clearTimeout(_restoreTimer); _restoreTimer = null; }

        _savedScrollY = window.scrollY;
        const container = _getGameContainer();
        _savedContainerTop = container ? container.scrollTop : 0;

        // iOS performs its scroll-to-caret ~350 ms after focus.
        // We restore after that window has passed.
        _restoreTimer = setTimeout(() => {
            _restoreTimer = null;
            if (window.scrollY !== _savedScrollY) {
                window.scrollTo({ top: _savedScrollY, behavior: "instant" });
            }
            const container2 = _getGameContainer();
            if (container2 && container2.scrollTop !== _savedContainerTop) {
                container2.scrollTop = _savedContainerTop;
            }
        }, 400);
    }, true);

    document.addEventListener("focusout", e => {
        if (!e.target.hasAttribute("data-numeric-gameplay")) return;
        // Cancel pending restore when the user dismisses the keyboard
        if (_restoreTimer) { clearTimeout(_restoreTimer); _restoreTimer = null; }
    }, true);
}
