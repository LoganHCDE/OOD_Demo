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
            "<label>Account ID</label>" +
            '<input type="text" data-user-settings-billing-id autocomplete="off" required>' +
            "</div>" +
            '<div class="user-settings-billing-row__field">' +
            "<label>Display name</label>" +
            '<input type="text" data-user-settings-billing-label autocomplete="off" required>' +
            "</div>" +
            "</div>" +
            '<button type="button" class="user-settings-billing-row__remove" data-user-settings-remove-billing aria-label="Remove billing account">' +
            '<i class="fas fa-trash-can" aria-hidden="true"></i>' +
            "</button>";

        var radio = row.querySelector('input[type="radio"]');
        var idInput = row.querySelector("[data-user-settings-billing-id]");
        var labelInput = row.querySelector("[data-user-settings-billing-label]");
        var removeButton = row.querySelector("[data-user-settings-remove-billing]");

        idInput.value = account && account.id ? account.id : "";
        labelInput.value = account && account.label ? account.label : "";
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
                radio.value = idInput.value.trim() || "row-" + Date.now();
            }
        });

        idInput.addEventListener("input", function () {
            if (radio.checked) {
                radio.value = idInput.value.trim();
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

    function renderBillingAccounts(settings) {
        billingList.innerHTML = "";
        var accounts = settings.billing_accounts || [];
        if (accounts.length === 0) {
            accounts = [{ id: "", label: "" }];
        }

        accounts.forEach(function (account, index) {
            var isDefault =
                account.id === settings.default_billing_account_id ||
                (index === 0 && !settings.default_billing_account_id);
            billingList.appendChild(createBillingRow(account, isDefault, accounts.length === 1));
        });
        updateRemoveButtons();
        syncDefaultRadioValues();
    }

    function syncDefaultRadioValues() {
        billingList.querySelectorAll("[data-user-settings-billing-row]").forEach(function (row) {
            var radio = row.querySelector('input[type="radio"]');
            var idInput = row.querySelector("[data-user-settings-billing-id]");
            if (radio && idInput) {
                radio.value = idInput.value.trim() || "pending-" + Math.random().toString(36).slice(2);
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
            var idInput = row.querySelector("[data-user-settings-billing-id]");
            var labelInput = row.querySelector("[data-user-settings-billing-label]");
            var radio = row.querySelector('input[type="radio"]');
            if (!idInput || !labelInput) return;

            var id = idInput.value.trim();
            var label = labelInput.value.trim();
            if (!id || !label) return;

            accounts.push({ id: id, label: label });
            if (radio && radio.checked) {
                defaultId = id;
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
            var firstId = billingList.querySelector("[data-user-settings-billing-id]");
            if (firstId) {
                firstId.setCustomValidity("Add at least one billing account with an account ID and display name.");
                firstId.reportValidity();
                firstId.setCustomValidity("");
            }
            return false;
        }

        var ids = billing.accounts.map(function (account) {
            return account.id;
        });
        var uniqueIds = ids.filter(function (id, index) {
            return ids.indexOf(id) === index;
        });
        if (uniqueIds.length !== ids.length) {
            var duplicateId = billingList.querySelector("[data-user-settings-billing-id]");
            if (duplicateId) {
                duplicateId.setCustomValidity("Billing account IDs must be unique.");
                duplicateId.reportValidity();
                duplicateId.setCustomValidity("");
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
                var firstBillingInput = billingList.querySelector("[data-user-settings-billing-id]");
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
            var idInput = lastRow.querySelector("[data-user-settings-billing-id]");
            if (idInput) idInput.focus();
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
