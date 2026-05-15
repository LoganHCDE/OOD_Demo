(function () {
    "use strict";

    var page = document.querySelector(".job-status-page");
    if (!page) return;

    var modal = page.querySelector("[data-job-cancel-modal]");
    var description = page.querySelector("#job-cancel-modal-description");
    var confirmButton = page.querySelector("[data-job-cancel-confirm]");
    var currentCard = null;
    var opener = null;

    if (!modal || !description || !confirmButton) return;

    function getFocusableElements() {
        return Array.from(
            modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter(function (element) {
            return !element.disabled && element.offsetParent !== null;
        });
    }

    function getSessionName(card) {
        var title = card && card.querySelector("h2");
        return title ? title.textContent.trim() : "this job";
    }

    function openModal(trigger) {
        opener = trigger;
        currentCard = trigger.closest(".job-session-card");
        description.textContent = "Are you sure you want to cancel " + getSessionName(currentCard) + "?";
        modal.hidden = false;
        document.body.classList.add("has-job-cancel-modal");

        window.setTimeout(function () {
            var keepJobButton = modal.querySelector("button[data-job-cancel-close]");
            (keepJobButton || confirmButton).focus();
        }, 0);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("has-job-cancel-modal");
        currentCard = null;

        if (opener && document.contains(opener)) {
            opener.focus();
        }

        opener = null;
    }

    page.querySelectorAll("[data-job-cancel-open]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            openModal(button);
        });
    });

    modal.querySelectorAll("[data-job-cancel-close]").forEach(function (closeButton) {
        closeButton.addEventListener("click", closeModal);
    });

    confirmButton.addEventListener("click", function () {
        if (currentCard) {
            currentCard.remove();
        }

        closeModal();
    });

    modal.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            event.preventDefault();
            closeModal();
            return;
        }

        if (event.key !== "Tab") return;

        var focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        var firstElement = focusableElements[0];
        var lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    });
})();
