const gameInfoBtn = document.getElementById("gameInfoBtn");
const setupGameInfoBtn = document.getElementById("setupGameInfoBtn");
const boardGameInfoBtn = document.getElementById("boardGameInfoBtn");

const gameInfoModal = document.getElementById("gameInfoModal");
const closeGameInfoTop = document.getElementById("closeGameInfoTop");
const closeGameInfoBottom = document.getElementById("closeGameInfoBottom");
const gameInfoBackdrop = document.getElementById("gameInfoBackdrop");

function openGameInfoModal() {
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