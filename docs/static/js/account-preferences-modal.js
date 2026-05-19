(function () {
    "use strict";

    var page = document.querySelector(".jupyter-submit-page");
    var storage = window.PnnlUserSettingsStorage;
    if (!page || !storage) return;

    var billingDisplay = page.querySelector("[data-billing-account-display]");
    var accountInput = page.querySelector("#account");
    var emailDisplay = page.querySelector("[data-user-settings-email-display]");
    var emailInput = page.querySelector("#user_email");

    if (!accountInput || !emailInput) return;

    function findAccount(accounts, id) {
        var match = null;
        accounts.some(function (account) {
            if (account.id === id) {
                match = account;
                return true;
            }
            return false;
        });
        return match;
    }

    function applySettings(settings) {
        settings = settings || storage.load();
        var accounts = settings.billing_accounts || [];
        var defaultId =
            settings.default_billing_account_id || (accounts[0] ? accounts[0].id : "");
        var billingAccount = findAccount(accounts, defaultId) || accounts[0];

        if (billingAccount) {
            accountInput.value = billingAccount.id;
            if (billingDisplay) {
                billingDisplay.textContent = billingAccount.label;
            }
        } else {
            accountInput.value = "";
            if (billingDisplay) {
                billingDisplay.textContent = "";
            }
        }

        emailInput.value = settings.user_email || "";
        if (emailDisplay) {
            emailDisplay.textContent = settings.user_email || "";
        }
    }

    document.addEventListener(storage.CHANGE_EVENT, function (event) {
        applySettings(event.detail);
    });

    applySettings();
})();
