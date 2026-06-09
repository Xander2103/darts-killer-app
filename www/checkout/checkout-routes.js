// =====================================================
// Checkout Route Advice
// =====================================================

const CHART = {
    170: "T20 + T20 + Bull",
    167: "T20 + T19 + Bull",
    164: "T20 + T18 + Bull",
    161: "T20 + T17 + Bull",
    160: "T20 + T20 + D20",
    158: "T20 + T20 + D19",
    157: "T20 + T19 + D20",
    156: "T20 + T20 + D18",
    155: "T20 + T19 + D19",
    154: "T20 + T18 + D20",
    153: "T20 + T19 + D18",
    152: "T20 + T20 + D16",
    151: "T20 + T17 + D20",
    150: "T20 + T18 + D18",
    149: "T20 + T19 + D16",
    148: "T20 + T20 + D14",
    147: "T20 + T17 + D18",
    146: "T20 + T18 + D16",
    145: "T20 + T19 + D14",
    144: "T20 + T20 + D12",
    143: "T20 + T17 + D16",
    142: "T20 + T14 + D20",
    141: "T20 + T19 + D12",
    140: "T20 + T20 + D10",
    139: "T20 + T13 + D20",
    138: "T20 + T20 + D9",
    137: "T20 + T15 + D16",
    136: "T20 + T20 + D8",
    135: "25 + T20 + Bull",
    134: "T20 + T14 + D16",
    133: "T20 + T19 + D8",
    132: "25 + T19 + Bull",
    131: "T20 + T13 + D16",
    130: "T20 + T20 + D5",
    129: "T19 + T12 + D18",
    128: "T18 + T14 + D16",
    127: "T20 + T17 + D8",
    126: "T19 + T19 + D6",
    125: "T18 + T13 + D16",
    124: "T20 + T16 + D8",
    123: "T19 + T16 + D9",
    122: "T18 + T18 + D4",
    121: "T20 + T11 + D14",
    120: "T20 + 20 + D20",
    119: "T19 + T12 + D13",
    118: "T20 + 18 + D20",
    117: "T20 + 17 + D20",
    116: "T19 + 19 + D20",
    115: "T19 + 18 + D20",
    114: "T20 + 14 + D20",
    113: "T19 + 16 + D20",
    112: "T20 + 12 + D20",
    111: "T19 + 14 + D20",
    110: "T20 + 10 + D20",
    109: "T20 + 9 + D20",
    108: "T20 + 16 + D16",
    107: "T20 + 15 + D16",
    106: "T20 + 6 + D20",
    105: "T19 + 16 + D16",
    104: "T16 + 16 + D20",
    103: "T19 + 6 + D20",
    102: "T20 + 10 + D16",
    101: "T20 + 9 + D16",
    100: "T20 + D20",
    99: "T19 + 10 + D16",
    98: "T20 + D19",
    97: "T19 + D20",
    96: "T20 + D18",
    95: "T19 + D19",
    94: "T18 + D20",
    93: "T19 + D18",
    92: "T20 + D16",
    91: "T17 + D20",
    90: "T20 + D15",
    89: "T19 + D16",
    88: "T20 + D14",
    87: "T17 + D18",
    86: "T18 + D16",
    85: "T15 + D20",
    84: "T20 + D12",
    83: "T17 + D16",
    82: "T14 + D20",
    81: "T19 + D12",
    80: "T20 + D10",
    79: "T19 + D11",
    78: "T18 + D12",
    77: "T19 + D10",
    76: "T16 + D14",
    75: "T17 + D12",
    74: "T14 + D16",
    73: "T19 + D8",
    72: "T16 + D12",
    71: "T13 + D16",
    70: "T18 + D8",
    69: "T19 + D6",
    68: "T16 + D10",
    67: "T9 + D20",
    66: "T10 + D18",
    65: "T11 + D16",
    64: "T16 + D8",
    63: "T17 + D6",
    62: "T10 + D16",
    61: "T15 + D8",
    60: "20 + D20",
    59: "19 + D20",
    58: "18 + D20",
    57: "17 + D20",
    56: "16 + D20",
    55: "15 + D20",
    54: "14 + D20",
    53: "13 + D20",
    52: "12 + D20",
    51: "11 + D20",
    50: "10 + D20",
    49: "9 + D20",
    48: "8 + D20",
    47: "15 + D16",
    46: "6 + D20",
    45: "13 + D16",
    44: "12 + D16",
    43: "11 + D16",
    42: "10 + D16",
    41: "9 + D16"
};

// Curated 2-dart safety overrides: triple first, single miss still leaves a valid 1-dart finish
const SAFETY_OVERRIDES = {
    61: { route: "T11 + D14", helper: "Single 11 leaves Bull" }
};

// Preferred scores to leave after a setup (D20 first, then common doubles, then Bull)
const PREFERRED_LEAVES = [40, 50, 32, 36, 38, 28, 30, 34, 24, 26, 20, 22, 16, 18, 12, 14, 8, 10, 4, 6, 2];

// All valid single-dart options sorted by value descending
const ALL_DART_OPTIONS = (() => {
    const opts = [];
    for (let n = 20; n >= 1; n--) opts.push({ label: `T${n}`, value: n * 3 });
    opts.push({ label: "Bull", value: 50 });
    opts.push({ label: "25", value: 25 });
    for (let n = 20; n >= 1; n--) opts.push({ label: `D${n}`, value: n * 2 });
    for (let n = 20; n >= 1; n--) opts.push({ label: String(n), value: n });
    opts.sort((a, b) => b.value - a.value);
    return opts;
})();

function isValidFinish(score) {
    if (score === 50) return { label: "Bull", value: 50 };
    if (score >= 2 && score <= 40 && score % 2 === 0) return { label: `D${score / 2}`, value: score };
    return null;
}

function getThrowLabel(score) {
    if (score >= 1 && score <= 20) return { label: String(score), value: score };
    if (score === 25) return { label: "25", value: 25 };
    if (score === 50) return { label: "Bull", value: 50 };
    if (score >= 22 && score <= 40 && score % 2 === 0) return { label: `D${score / 2}`, value: score };
    if (score >= 21 && score <= 60 && score % 3 === 0) return { label: `T${score / 3}`, value: score };
    return null;
}

function countDarts(route) {
    return route.split(" + ").length;
}

// Returns { route, helper } if a safe 2-dart checkout exists (triple first that leaves valid finish on single miss)
function findSafeTwoDartCheckout(score) {
    for (const first of ALL_DART_OPTIONS) {
        if (!first.label.startsWith("T")) continue;

        const remaining = score - first.value;
        if (remaining <= 1) continue;

        const finish = isValidFinish(remaining);
        if (!finish) continue;

        const tripleNum = parseInt(first.label.slice(1), 10);
        const singleLeave = score - tripleNum;
        const singleFinish = isValidFinish(singleLeave);

        if (singleFinish) {
            return {
                route: `${first.label} + ${finish.label}`,
                helper: `Single ${tripleNum} leaves ${singleFinish.label}`
            };
        }
    }
    return null;
}

function findTwoDartCheckout(score) {
    for (const first of ALL_DART_OPTIONS) {
        const remaining = score - first.value;
        if (remaining <= 1) continue;
        const finish = isValidFinish(remaining);
        if (finish) return `${first.label} + ${finish.label}`;
    }
    return null;
}

function findTwoDartSetup(score) {
    for (const first of ALL_DART_OPTIONS) {
        const afterFirst = score - first.value;
        if (afterFirst <= 0) continue;

        for (const leaveTarget of PREFERRED_LEAVES) {
            const secondDartValue = afterFirst - leaveTarget;
            if (secondDartValue <= 0) continue;

            const secondDart = getThrowLabel(secondDartValue);
            if (secondDart) {
                return `${first.label} + ${secondDart.label} leaves ${leaveTarget}`;
            }
        }
    }
    return null;
}

function findOneDartSetup(score) {
    for (const leaveTarget of PREFERRED_LEAVES) {
        const throwValue = score - leaveTarget;
        if (throwValue <= 0) continue;
        const dart = getThrowLabel(throwValue);
        if (dart) return `${dart.label} leaves ${leaveTarget}`;
    }
    return null;
}

export function getCheckoutAdvice(remaining, dartsLeft) {
    const score = Number(remaining);
    const darts = Number(dartsLeft);

    if (!Number.isFinite(score) || score <= 1) {
        return { type: "none", title: "No checkout", route: "No route available", helper: "" };
    }

    if (score > 170) {
        return { type: "none", title: "No checkout", route: "Score too high to checkout", helper: "" };
    }

    // 1-dart finish (double or Bull)
    if (darts >= 1) {
        const finish = isValidFinish(score);
        if (finish) {
            return { type: "checkout", title: "Checkout route", route: finish.label, helper: "" };
        }
    }

    // 2-dart checkout: prefer safe routes
    if (darts >= 2 && score <= 110) {
        if (SAFETY_OVERRIDES[score]) {
            const o = SAFETY_OVERRIDES[score];
            return { type: "checkout", title: "Checkout route", route: o.route, helper: o.helper };
        }

        const chartRoute = CHART[score];
        const chartRoute2 = chartRoute && countDarts(chartRoute) === 2 ? chartRoute : null;

        if (chartRoute2) {
            const parts = chartRoute2.split(" + ");
            const firstPart = parts[0];

            if (firstPart.startsWith("T")) {
                // Check if the chart route itself is safe
                const n = parseInt(firstPart.slice(1), 10);
                const singleLeave = score - n;
                const singleFinish = isValidFinish(singleLeave);

                if (singleFinish) {
                    // Chart route is already safe — use it with helper
                    return {
                        type: "checkout",
                        title: "Checkout route",
                        route: chartRoute2,
                        helper: `Single ${n} leaves ${singleFinish.label}`
                    };
                }

                // Chart route is not safe — try to find a safer alternative
                const safeRoute = findSafeTwoDartCheckout(score);
                if (safeRoute) {
                    return { type: "checkout", title: "Checkout route", route: safeRoute.route, helper: safeRoute.helper };
                }

                // No safer route found — fall back to chart route without helper
                return { type: "checkout", title: "Checkout route", route: chartRoute2, helper: "" };
            }

            // Non-triple first dart (e.g., "15 + D20") — use as is, no safety concern
            return { type: "checkout", title: "Checkout route", route: chartRoute2, helper: "" };
        }

        // No 2-dart chart entry — try safe algorithmic, then any 2-dart
        const safeRoute = findSafeTwoDartCheckout(score);
        if (safeRoute) {
            return { type: "checkout", title: "Checkout route", route: safeRoute.route, helper: safeRoute.helper };
        }

        const twoRoute = findTwoDartCheckout(score);
        if (twoRoute) {
            return { type: "checkout", title: "Checkout route", route: twoRoute, helper: "" };
        }
    }

    // 3-dart checkout: chart only
    if (darts >= 3) {
        const chartRoute = CHART[score];
        if (chartRoute) {
            return { type: "checkout", title: "Checkout route", route: chartRoute, helper: "" };
        }
    }

    // Can't finish — show best setup route
    if (darts >= 2) {
        const setup = findTwoDartSetup(score);
        if (setup) {
            return { type: "setup", title: "Setup route", route: setup, helper: "" };
        }
    }

    if (darts >= 1) {
        const setup = findOneDartSetup(score);
        if (setup) {
            return { type: "setup", title: "Setup route", route: setup, helper: "" };
        }
    }

    return { type: "none", title: "No checkout", route: "No clean route available", helper: "" };
}
