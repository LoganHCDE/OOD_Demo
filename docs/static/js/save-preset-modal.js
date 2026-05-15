(function () {
    "use strict";

    var page = document.querySelector(".jupyter-submit-page");
    if (!page) return;

    var sessionForm = page.querySelector("#jupyter-session-form");
    var jobNameInput = page.querySelector("#job_name");
    var openButton = page.querySelector("[data-save-preset-open]");
    var launchButton = page.querySelector("[data-launch-job]");
    var modal = page.querySelector("[data-save-preset-modal]");
    var modalForm = page.querySelector("[data-save-preset-form]");
    var modalJobNameInput = page.querySelector("[data-save-preset-job-name]");
    var saveAndLaunchButton = page.querySelector("[data-save-preset-save-launch]");
    var opener = null;

    if (!sessionForm || !jobNameInput || !openButton || !launchButton || !modal || !modalForm || !modalJobNameInput || !saveAndLaunchButton) return;

    function getFocusableElements() {
        return Array.from(
            modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter(function (element) {
            return !element.disabled && element.offsetParent !== null;
        });
    }

    function syncModalFromForm() {
        modalJobNameInput.value = jobNameInput.value;
    }

    function syncFormFromModal() {
        jobNameInput.value = modalJobNameInput.value;
    }

    function openModal(trigger) {
        opener = trigger;
        syncModalFromForm();
        modal.hidden = false;
        document.body.classList.add("has-save-preset-modal");

        window.setTimeout(function () {
            modalJobNameInput.focus();
            modalJobNameInput.select();
        }, 0);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("has-save-preset-modal");

        if (opener) {
            opener.focus();
            opener = null;
        }
    }

    function canLaunch() {
        if (!jobNameInput.checkValidity()) {
            jobNameInput.reportValidity();
            return false;
        }

        return true;
    }

    function launchJob() {
        if (!canLaunch()) return;
        var m = document.querySelector('meta[name="app-root"]');
        var root = (m && m.getAttribute("content")) || "/";
        if (root.slice(-1) !== "/") {
            root += "/";
        }
        window.location.href = new URL("job-status/", window.location.origin + root).href;
    }

    openButton.addEventListener("click", function () {
        openModal(openButton);
    });

    launchButton.addEventListener("click", function (event) {
        event.preventDefault();
        launchJob();
    });

    sessionForm.addEventListener("submit", function (event) {
        event.preventDefault();
        launchJob();
    });

    modal.querySelectorAll("[data-save-preset-close]").forEach(function (closeButton) {
        closeButton.addEventListener("click", closeModal);
    });

    modalForm.addEventListener("submit", function (event) {
        event.preventDefault();
        syncFormFromModal();

        if (!jobNameInput.checkValidity()) {
            modalJobNameInput.reportValidity();
            return;
        }

        closeModal();
    });

    saveAndLaunchButton.addEventListener("click", function () {
        syncFormFromModal();

        if (!jobNameInput.checkValidity()) {
            modalJobNameInput.reportValidity();
            return;
        }

        launchJob();
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
