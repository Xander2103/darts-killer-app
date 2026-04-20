//Voor popups en modals

const appModal = document.getElementById("appModal");
const appModalTitle = document.getElementById("appModalTitle");
const appModalMessage = document.getElementById("appModalMessage");
const appModalActions = document.getElementById("appModalActions");
const appModalCancel = document.getElementById("appModalCancel");
const appModalConfirm = document.getElementById("appModalConfirm");
const appModalBackdrop = document.getElementById("appModalBackdrop");

let confirmHandler = null;
let cancelHandler = null;

function closeAppModal() {
    appModal.classList.add("hidden");
    confirmHandler = null;
    cancelHandler = null;
}

function openInfoModal(title, message, buttonText = "OK") {
    appModalTitle.textContent = title;
    appModalMessage.textContent = message;

    appModalCancel.style.display = "none";
    appModalConfirm.textContent = buttonText;

    confirmHandler = () => {
        closeAppModal();
    };

    cancelHandler = null;

    appModal.classList.remove("hidden");
}

function openConfirmModal(title, message, onConfirm, onCancel = null) {
    appModalTitle.textContent = title;
    appModalMessage.textContent = message;

    appModalCancel.style.display = "inline-block";
    appModalCancel.textContent = "Annuleren";
    appModalConfirm.textContent = "Bevestigen";

    confirmHandler = () => {
        closeAppModal();
        if (typeof onConfirm === "function") {
            onConfirm();
        }
    };

    cancelHandler = () => {
        closeAppModal();
        if (typeof onCancel === "function") {
            onCancel();
        }
    };

    appModal.classList.remove("hidden");
}

appModalConfirm.addEventListener("click", () => {
    if (typeof confirmHandler === "function") {
        confirmHandler();
    }
});

appModalCancel.addEventListener("click", () => {
    if (typeof cancelHandler === "function") {
        cancelHandler();
    } else {
        closeAppModal();
    }
});

appModalBackdrop.addEventListener("click", () => {
    if (typeof cancelHandler === "function") {
        cancelHandler();
    } else {
        closeAppModal();
    }
});