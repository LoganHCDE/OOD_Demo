(function () {
    "use strict";

    var storage = window.PnnlUserSettingsStorage;
    if (!storage) return;

    var modal = document.querySelector("[data-user-settings-modal]");
    var form = document.querySelector("[data-user-settings-form]");
    var emailInput = document.querySelector("[data-user-settings-email]");
    var billingList = document.querySelector("[data-user-settings-billing-list]");
    var addBillingButton = document.querySelector("[data-user-settings-add-billing]");
    var billingSection = document.querySelector("[data-user-settings-section-billing]");

    if (!modal || !form || !emailInput || !billingList || !addBillingButton) return;

    var opener = null;

    function accountName(account) {
        if (!account) return "";
        return String(account.label || account.id || "").trim();
    }

    function getFocusableElements() {
        return Array.from(
            modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter(function (element) {
            return !element.disabled && element.offsetParent !== null;
        });
    }

    function createBillingRow(account, isDefault, isOnlyRow) {
        var row = document.createElement("div");
        row.className = "user-settings-billing-row";
        row.setAttribute("data-user-settings-billing-row", "");

        row.innerHTML =
            '<div class="user-settings-billing-row__default">' +
            '<input type="radio" name="default_billing_account" value="" aria-label="Default billing account">' +
            "</div>" +
            '<div class="user-settings-billing-row__fields">' +
            '<div class="user-settings-billing-row__field">' +
            "<label>Account Name</label>" +
            '<input type="text" data-user-settings-billing-label autocomplete="off" required>' +
            "</div>" +
            "</div>" +
            '<button type="button" class="user-settings-billing-row__remove" data-user-settings-remove-billing aria-label="Remove billing account">' +
            '<i class="fas fa-trash-can" aria-hidden="true"></i>' +
            "</button>";

        var radio = row.querySelector('input[type="radio"]');
        var nameInput = row.querySelector("[data-user-settings-billing-label]");
        var removeButton = row.querySelector("[data-user-settings-remove-billing]");

        nameInput.value = accountName(account);
        radio.checked = Boolean(isDefault);
        removeButton.disabled = isOnlyRow;

        removeButton.addEventListener("click", function () {
            if (billingList.querySelectorAll("[data-user-settings-billing-row]").length <= 1) return;
            var wasDefault = radio.checked;
            row.remove();
            updateRemoveButtons();
            if (wasDefault) {
                var firstRadio = billingList.querySelector('input[type="radio"]');
                if (firstRadio) firstRadio.checked = true;
            }
        });

        radio.addEventListener("change", function () {
            if (radio.checked) {
                radio.value = nameInput.value.trim() || "row-" + Date.now();
            }
        });

        nameInput.addEventListener("input", function () {
            if (radio.checked) {
                radio.value = nameInput.value.trim();
            }
        });

        return row;
    }

    function updateRemoveButtons() {
        var rows = billingList.querySelectorAll("[data-user-settings-billing-row]");
        var onlyOne = rows.length <= 1;
        rows.forEach(function (row) {
            var removeButton = row.querySelector("[data-user-settings-remove-billing]");
            if (removeButton) removeButton.disabled = onlyOne;
        });
    }

    function isDefaultAccount(account, settings, index) {
        var name = accountName(account);
        var defaultId = String(settings.default_billing_account_id || "").trim();
        if (defaultId && (name === defaultId || account.id === defaultId || account.label === defaultId)) {
            return true;
        }
        return index === 0 && !defaultId;
    }

    function renderBillingAccounts(settings) {
        billingList.innerHTML = "";
        var accounts = settings.billing_accounts || [];
        if (accounts.length === 0) {
            accounts = [{ id: "", label: "" }];
        }

        accounts.forEach(function (account, index) {
            var isDefault = isDefaultAccount(account, settings, index);
            billingList.appendChild(createBillingRow(account, isDefault, accounts.length === 1));
        });
        updateRemoveButtons();
        syncDefaultRadioValues();
    }

    function syncDefaultRadioValues() {
        billingList.querySelectorAll("[data-user-settings-billing-row]").forEach(function (row) {
            var radio = row.querySelector('input[type="radio"]');
            var nameInput = row.querySelector("[data-user-settings-billing-label]");
            if (radio && nameInput) {
                radio.value = nameInput.value.trim() || "pending-" + Math.random().toString(36).slice(2);
            }
        });
    }

    function populateForm(settings) {
        emailInput.value = settings.user_email || "";
        renderBillingAccounts(settings);
    }

    function collectBillingAccounts() {
        var accounts = [];
        var defaultId = "";

        billingList.querySelectorAll("[data-user-settings-billing-row]").forEach(function (row) {
            var nameInput = row.querySelector("[data-user-settings-billing-label]");
            var radio = row.querySelector('input[type="radio"]');
            if (!nameInput) return;

            var name = nameInput.value.trim();
            if (!name) return;

            accounts.push({ id: name, label: name });
            if (radio && radio.checked) {
                defaultId = name;
            }
        });

        return { accounts: accounts, defaultId: defaultId };
    }

    function validateForm() {
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        if (!emailInput.checkValidity()) {
            emailInput.reportValidity();
            return false;
        }

        var billing = collectBillingAccounts();
        if (billing.accounts.length === 0) {
            var firstName = billingList.querySelector("[data-user-settings-billing-label]");
            if (firstName) {
                firstName.setCustomValidity("Add at least one billing account with an account name.");
                firstName.reportValidity();
                firstName.setCustomValidity("");
            }
            return false;
        }

        var names = billing.accounts.map(function (account) {
            return account.id;
        });
        var uniqueNames = names.filter(function (name, index) {
            return names.indexOf(name) === index;
        });
        if (uniqueNames.length !== names.length) {
            var duplicateName = billingList.querySelector("[data-user-settings-billing-label]");
            if (duplicateName) {
                duplicateName.setCustomValidity("Billing account names must be unique.");
                duplicateName.reportValidity();
                duplicateName.setCustomValidity("");
            }
            return false;
        }

        if (!billing.defaultId) {
            var firstRadio = billingList.querySelector('input[type="radio"]');
            if (firstRadio) firstRadio.checked = true;
            billing.defaultId = billing.accounts[0].id;
        }

        return true;
    }

    function readForm() {
        var billing = collectBillingAccounts();
        return {
            user_email: emailInput.value.trim(),
            billing_accounts: billing.accounts,
            default_billing_account_id:
                billing.defaultId || (billing.accounts[0] ? billing.accounts[0].id : ""),
        };
    }

    function openModal(options) {
        options = options || {};
        opener = options.trigger || null;
        populateForm(storage.load());
        modal.hidden = false;
        document.body.classList.add("has-user-settings-modal");

        window.setTimeout(function () {
            if (options.section === "billing" && billingSection) {
                billingSection.scrollIntoView({ block: "nearest" });
                var firstBillingInput = billingList.querySelector("[data-user-settings-billing-label]");
                if (firstBillingInput) {
                    firstBillingInput.focus();
                    return;
                }
            }
            emailInput.focus();
            emailInput.select();
        }, 0);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("has-user-settings-modal");
        if (opener) {
            opener.focus();
            opener = null;
        }
    }

    function saveSettings() {
        if (!validateForm()) return;
        storage.save(readForm());
        closeModal();
    }

    addBillingButton.addEventListener("click", function () {
        billingList.appendChild(createBillingRow({ id: "", label: "" }, false, false));
        updateRemoveButtons();
        var lastRow = billingList.querySelector("[data-user-settings-billing-row]:last-child");
        if (lastRow) {
            var nameInput = lastRow.querySelector("[data-user-settings-billing-label]");
            if (nameInput) nameInput.focus();
        }
    });

    document.querySelectorAll("[data-user-settings-open]").forEach(function (trigger) {
        trigger.addEventListener("click", function (event) {
            event.preventDefault();
            openModal({
                trigger: trigger,
                section: trigger.getAttribute("data-user-settings-section") || "",
            });
        });
    });

    modal.querySelectorAll("[data-user-settings-close]").forEach(function (closeButton) {
        closeButton.addEventListener("click", closeModal);
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        saveSettings();
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

    window.PnnlUserSettings = {
        open: openModal,
        close: closeModal,
        load: storage.load,
    };
})();
