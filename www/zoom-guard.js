// Blocks iOS Safari/WKWebView's double-tap-to-zoom and pinch-zoom gestures.
// touch-action: manipulation (see style.css) already stops most of this,
// but iOS still triggers double-tap zoom in some WKWebView contexts, so we
// also guard it manually here.
(function () {
    var lastTouchEnd = 0;

    document.addEventListener(
        "touchend",
        function (event) {
            var now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        },
        { passive: false }
    );

    document.addEventListener(
        "gesturestart",
        function (event) {
            event.preventDefault();
        },
        { passive: false }
    );
})();
