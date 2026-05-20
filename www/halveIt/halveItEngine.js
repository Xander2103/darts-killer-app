// www/halveIt/halveItEngine.js

import { createHalveItRounds } from "./halveItRounds.js";

export function createHalveItGame(players) {
    return {
        mode: "halveIt",

        players: players.map((player) => ({
            name: typeof player === "string" ? player : player.name,
            score: 0,
            roundScores: [],
            isWinner: false
        })),

        rounds: createHalveItRounds(),

        currentRoundIndex: 0,
        currentPlayerIndex: 0,

        dartsThisTurn: [],
        turnScore: 0,

        isFinished: false,
        winnerIndex: null
    };
}

export function submitHalveItScore(game, rawScore) {
    if (game.isFinished) {
        return game;
    }

    const round = getCurrentHalveItRound(game);
    const playerIndex = game.currentPlayerIndex;
    const player = game.players[playerIndex];

    const score = Math.max(0, Number(rawScore) || 0);
    const success = score > 0;

    const newScore = success
        ? player.score + score
        : Math.floor(player.score / 2);

    const updatedPlayers = game.players.map((currentPlayer, index) => {
        if (index !== playerIndex) {
            return currentPlayer;
        }

        return {
            ...currentPlayer,
            score: newScore,
            roundScores: [
                ...currentPlayer.roundScores,
                {
                    roundIndex: game.currentRoundIndex,
                    roundLabel: round?.label ?? "",
                    roundType: round?.type ?? "",
                    turnScore: score,
                    success,
                    missedRound: !success,
                    reason: success
                        ? `Contract completed with ${score} points.`
                        : "Contract failed. Score was halved.",
                    scoreBeforeRound: player.score,
                    scoreAfterRound: newScore
                }
            ]
        };
    });

    const isLastPlayerOfRound = playerIndex === game.players.length - 1;
    const isLastRound = game.currentRoundIndex === game.rounds.length - 1;

    if (isLastPlayerOfRound && isLastRound) {
        const winnerIndex = getHalveItWinnerIndex(updatedPlayers);

        return {
            ...game,
            players: updatedPlayers.map((currentPlayer, index) => ({
                ...currentPlayer,
                isWinner: index === winnerIndex
            })),
            dartsThisTurn: [],
            turnScore: 0,
            isFinished: true,
            winnerIndex
        };
    }

    return {
        ...game,
        players: updatedPlayers,
        currentPlayerIndex: isLastPlayerOfRound ? 0 : playerIndex + 1,
        currentRoundIndex: isLastPlayerOfRound
            ? game.currentRoundIndex + 1
            : game.currentRoundIndex,
        dartsThisTurn: [],
        turnScore: 0
    };
}

export function getCurrentHalveItRound(game) {
    return game.rounds[game.currentRoundIndex] ?? null;
}

export function getCurrentHalveItPlayer(game) {
    return game.players[game.currentPlayerIndex] ?? null;
}

export function addHalveItDart(game, dart) {
    if (game.isFinished) {
        return game;
    }

    if (game.dartsThisTurn.length >= 3) {
        return game;
    }

    const round = getCurrentHalveItRound(game);
    const dartScore = getDartScore(dart);
    const valid = isValidHalveItDart(round, dart);
    const scoredPoints = valid ? dartScore : 0;

    return {
        ...game,
        dartsThisTurn: [
            ...game.dartsThisTurn,
            {
                ...dart,
                valid,
                dartScore,
                scoredPoints
            }
        ],
        turnScore: game.turnScore + scoredPoints
    };
}

export function finishHalveItTurn(game) {
    if (game.isFinished) {
        return game;
    }

    const round = getCurrentHalveItRound(game);
    const playerIndex = game.currentPlayerIndex;
    const player = game.players[playerIndex];

    const turnResult = getHalveItTurnResult(round, game.dartsThisTurn);

    const newScore = turnResult.success
        ? player.score + turnResult.score
        : Math.floor(player.score / 2);

    const updatedPlayers = game.players.map((currentPlayer, index) => {
        if (index !== playerIndex) {
            return currentPlayer;
        }

        return {
            ...currentPlayer,
            score: newScore,
            roundScores: [
                ...currentPlayer.roundScores,
                {
                    roundIndex: game.currentRoundIndex,
                    roundLabel: round?.label ?? "",
                    roundType: round?.type ?? "",
                    darts: game.dartsThisTurn,
                    turnScore: turnResult.score,
                    success: turnResult.success,
                    missedRound: !turnResult.success,
                    reason: turnResult.reason,
                    scoreBeforeRound: player.score,
                    scoreAfterRound: newScore
                }
            ]
        };
    });

    const isLastPlayerOfRound = playerIndex === game.players.length - 1;
    const isLastRound = game.currentRoundIndex === game.rounds.length - 1;

    if (isLastPlayerOfRound && isLastRound) {
        const winnerIndex = getHalveItWinnerIndex(updatedPlayers);

        return {
            ...game,
            players: updatedPlayers.map((currentPlayer, index) => ({
                ...currentPlayer,
                isWinner: index === winnerIndex
            })),
            dartsThisTurn: [],
            turnScore: 0,
            isFinished: true,
            winnerIndex
        };
    }

    return {
        ...game,
        players: updatedPlayers,
        currentPlayerIndex: isLastPlayerOfRound ? 0 : playerIndex + 1,
        currentRoundIndex: isLastPlayerOfRound
            ? game.currentRoundIndex + 1
            : game.currentRoundIndex,
        dartsThisTurn: [],
        turnScore: 0
    };
}

export function undoLastHalveItDart(game) {
    if (game.isFinished || game.dartsThisTurn.length === 0) {
        return game;
    }

    const updatedDarts = game.dartsThisTurn.slice(0, -1);

    const updatedTurnScore = updatedDarts.reduce((total, dart) => {
        return total + (dart.scoredPoints ?? 0);
    }, 0);

    return {
        ...game,
        dartsThisTurn: updatedDarts,
        turnScore: updatedTurnScore
    };
}

export function resetHalveItTurn(game) {
    if (game.isFinished) {
        return game;
    }

    return {
        ...game,
        dartsThisTurn: [],
        turnScore: 0
    };
}

function getHalveItWinnerIndex(players) {
    let winnerIndex = 0;
    let highestScore = players[0]?.score ?? 0;

    players.forEach((player, index) => {
        if (player.score > highestScore) {
            highestScore = player.score;
            winnerIndex = index;
        }
    });

    return winnerIndex;
}

function getHalveItTurnResult(round, dartsThisTurn) {
    if (!round) {
        return {
            success: false,
            score: 0,
            reason: "No round found."
        };
    }

    const validDarts = dartsThisTurn.filter((dart) => dart.valid);

    const validScore = validDarts.reduce((total, dart) => {
        return total + (dart.scoredPoints ?? 0);
    }, 0);

    switch (round.type) {
        case "threeDifferentColors":
            return getThreeDifferentColorsResult(dartsThisTurn);

        case "threeSameColors":
            return getThreeSameColorsResult(dartsThisTurn);

        case "scoreChallenge":
            return getScoreChallengeResult(dartsThisTurn, round);

        default:
            return {
                success: validDarts.length > 0,
                score: validScore,
                reason: validDarts.length > 0
                    ? "At least one valid dart was hit."
                    : "No valid darts were hit."
            };
    }
}

function getThreeDifferentColorsResult(dartsThisTurn) {
    const validColorDarts = dartsThisTurn.filter((dart) => {
        return dart.color && dart.segment !== "miss";
    });

    const colors = validColorDarts.map((dart) => dart.color);
    const uniqueColors = new Set(colors);

    const score = validColorDarts.reduce((total, dart) => {
        return total + getDartScore(dart);
    }, 0);

    const success = validColorDarts.length === 3 && uniqueColors.size === 3;

    return {
        success,
        score: success ? score : 0,
        reason: success
            ? "Three different colors were hit."
            : "You need to hit three different colors with your three darts."
    };
}

function getThreeSameColorsResult(dartsThisTurn) {
    const validColorDarts = dartsThisTurn.filter((dart) => {
        return dart.color && dart.segment !== "miss";
    });

    const colors = validColorDarts.map((dart) => dart.color);
    const uniqueColors = new Set(colors);

    const score = validColorDarts.reduce((total, dart) => {
        return total + getDartScore(dart);
    }, 0);

    const success = validColorDarts.length === 3 && uniqueColors.size === 1;

    return {
        success,
        score: success ? score : 0,
        reason: success
            ? "Three darts of the same color were hit."
            : "You need to hit the same color with all three darts."
    };
}

function getScoreChallengeResult(dartsThisTurn, round) {
    const score = dartsThisTurn.reduce((total, dart) => {
        if (!dart || dart.segment === "miss") {
            return total;
        }

        return total + getDartScore(dart);
    }, 0);

    const targets = round.targets ?? [];

    const success = targets.some((target) => {
        if (target === 101 || target === 121) {
            return score >= target;
        }

        return score === target;
    });

    return {
        success,
        score: success ? score : 0,
        reason: success
            ? `Score challenge completed with ${score} points.`
            : `You needed ${targets.join(", ")}. You scored ${score}.`
    };
}

function isValidHalveItDart(round, dart) {
    if (!round || !dart || dart.segment === "miss") {
        return false;
    }

    switch (round.type) {
        case "number":
            return dart.number === round.value;

        case "anyDouble":
            return dart.multiplier === 2;

        case "anyTriple":
            return dart.multiplier === 3;

        case "bull":
            return dart.segment === "outerBull" || dart.segment === "bull";

        case "singleColor":
            return dart.color === round.color;

        case "oddNumbers":
            return dart.number % 2 === 1;

        case "evenNumbers":
            return dart.number % 2 === 0;

        case "threeDifferentColors":
            return Boolean(dart.color);

        case "threeSameColors":
            return Boolean(dart.color);

        case "scoreChallenge":
            return dart.segment !== "miss";

        default:
            return false;
    }
}

function getDartScore(dart) {
    if (!dart || dart.segment === "miss") {
        return 0;
    }

    if (dart.segment === "outerBull") {
        return 25;
    }

    if (dart.segment === "bull") {
        return 50;
    }

    return dart.number * dart.multiplier;
}