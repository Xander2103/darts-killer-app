// Blocks iOS Safari/WKWebView's double-tap-to-zoom and pinch-zoom gestures.
// touch-action: manipulation (see style.css) already stops most of this,
// but iOS still triggers double-tap zoom in some WKWebView contexts, so we
// also guard it manually here.
(function () {
    var lastTouchEnd = 0;
    var lastTouchTarget = null;

    document.addEventListener(
        "touchend",
        function (event) {
            var now = Date.now();
            // Only treat this as a double-tap (and suppress the zoom) when both
            // taps land on the SAME element within the window. Without the
            // same-target check, two unrelated quick taps on different buttons
            // (e.g. tapping a setup option, then "Start 121 Checkout" right
            // after) both fire touchend on <300ms apart, so preventDefault()
            // here would cancel the browser's synthesized click for the
            // second tap — requiring the user to tap that button again.
            if (now - lastTouchEnd <= 300 && event.target === lastTouchTarget) {
                event.preventDefault();
            }
            lastTouchEnd = now;
            lastTouchTarget = event.target;
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
