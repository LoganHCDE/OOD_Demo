(function () {
    "use strict";

    var page = document.querySelector(".jupyter-submit-page");
    if (!page) return;

    var modal = page.querySelector("[data-account-preference-modal]");
    var form = page.querySelector("[data-account-preference-form]");
    var input = page.querySelector("[data-account-preference-input]");
    var title = page.querySelector("#account-preference-modal-title");
    var label = page.querySelector("#account-preference-modal-label");
    var help = page.querySelector("#account-preference-modal-help");
    var triggers = Array.from(page.querySelectorAll("[data-account-preference-trigger]"));
    var activeField = null;
    var opener = null;

    var fieldConfig = {
        account: {
            title: "Change Billing Account",
            label: "Replacement Billing Account",
            help: "Enter the billing account that should be used for this Jupyter session.",
            inputType: "text",
            autocomplete: "off",
        },
        user_email: {
            title: "Change Email",
            label: "Replacement Email",
            help: "Enter the email address that should receive session notifications.",
            inputType: "email",
            autocomplete: "email",
        },
    };

    if (!modal || !form || !input || !title || !label || !help || triggers.length === 0) return;

    function getFocusableElements() {
        return Array.from(
            modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter(function (element) {
            return !element.disabled && element.offsetParent !== null;
        });
    }

    function setModalContent(fieldName) {
        var config = fieldConfig[fieldName];
        var hiddenInput = page.querySelector("#" + fieldName);
        if (!config || !hiddenInput) return false;

        title.textContent = config.title;
        label.textContent = config.label;
        help.textContent = config.help;
        input.type = config.inputType;
        input.autocomplete = config.autocomplete;
        input.value = hiddenInput.value;
        activeField = fieldName;
        return true;
    }

    function openModal(fieldName, trigger) {
        if (!setModalContent(fieldName)) return;

        opener = trigger;
        modal.hidden = false;
        document.body.classList.add("has-account-preference-modal");
        window.setTimeout(function () {
            input.focus();
            input.select();
        }, 0);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("has-account-preference-modal");
        activeField = null;

        if (opener) {
            opener.focus();
            opener = null;
        }
    }

    function savePreference() {
        if (!activeField) return;

        var hiddenInput = page.querySelector("#" + activeField);
        var display = page.querySelector('[data-account-preference-display="' + activeField + '"]');
        var value = input.value.trim();

        if (!hiddenInput || !display) return;
        if (value === "") {
            input.value = "";
            input.reportValidity();
            return;
        }

        hiddenInput.value = value;
        display.textContent = value;
        closeModal();
    }

    triggers.forEach(function (trigger) {
        trigger.addEventListener("click", function () {
            openModal(trigger.dataset.accountPreferenceTrigger, trigger);
        });
    });

    modal.querySelectorAll("[data-account-preference-close]").forEach(function (closeButton) {
        closeButton.addEventListener("click", closeModal);
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        savePreference();
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
