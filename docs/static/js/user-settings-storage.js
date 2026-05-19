(function () {
    "use strict";

    var STORAGE_KEY = "pnnl-ondemand-user-settings";
    var CHANGE_EVENT = "pnnl-user-settings-changed";

    function readDefaultsElement() {
        var el = document.getElementById("pnnl-user-settings-defaults");
        if (!el || !el.textContent) {
            return {
                user_email: "",
                billing_accounts: [],
                default_billing_account_id: "",
            };
        }

        try {
            return JSON.parse(el.textContent);
        } catch (e) {
            return {
                user_email: "",
                billing_accounts: [],
                default_billing_account_id: "",
            };
        }
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normalizeBillingAccount(account) {
        if (!account || typeof account !== "object") return null;
        var name = String(account.label || account.id || "").trim();
        if (!name) return null;
        return { id: name, label: name };
    }

    function rawAccountMatchesDefault(account, defaultId) {
        if (!account || typeof account !== "object" || !defaultId) return false;
        var id = String(account.id || "").trim();
        var label = String(account.label || "").trim();
        var name = label || id;
        return defaultId === id || defaultId === label || defaultId === name;
    }

    function resolveDefaultBillingAccountId(rawAccounts, billingAccounts, defaultId) {
        if (!defaultId) {
            return billingAccounts.length > 0 ? billingAccounts[0].id : "";
        }

        var matchedRaw = rawAccounts.find(function (account) {
            return rawAccountMatchesDefault(account, defaultId);
        });
        if (matchedRaw) {
            var normalizedMatch = normalizeBillingAccount(matchedRaw);
            if (normalizedMatch) return normalizedMatch.id;
        }

        var defaultAccount = billingAccounts.find(function (account) {
            return account.id === defaultId;
        });
        if (defaultAccount) return defaultAccount.id;

        return billingAccounts.length > 0 ? billingAccounts[0].id : "";
    }

    function normalize(settings) {
        var defaults = readDefaultsElement();
        var source = settings && typeof settings === "object" ? settings : defaults;
        var rawAccounts = Array.isArray(source.billing_accounts) ? source.billing_accounts : [];
        var billingAccounts = rawAccounts.map(normalizeBillingAccount).filter(Boolean);

        if (billingAccounts.length === 0) {
            rawAccounts = defaults.billing_accounts || [];
            billingAccounts = rawAccounts.map(normalizeBillingAccount).filter(Boolean);
        }

        var defaultId = String(source.default_billing_account_id || "").trim();
        defaultId = resolveDefaultBillingAccountId(rawAccounts, billingAccounts, defaultId);

        var userEmail = String(source.user_email || defaults.user_email || "").trim();
        if (!userEmail) {
            userEmail = String(defaults.user_email || "").trim();
        }

        return {
            user_email: userEmail,
            billing_accounts: billingAccounts,
            default_billing_account_id: defaultId,
        };
    }

    function load() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return normalize(readDefaultsElement());
            }
            return normalize(JSON.parse(raw));
        } catch (e) {
            return normalize(readDefaultsElement());
        }
    }

    function save(settings) {
        var normalized = normalize(settings);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        dispatchChangeEvent(normalized);
        return normalized;
    }

    function dispatchChangeEvent(detail) {
        document.dispatchEvent(
            new CustomEvent(CHANGE_EVENT, {
                detail: detail || load(),
            })
        );
    }

    window.PnnlUserSettingsStorage = {
        STORAGE_KEY: STORAGE_KEY,
        CHANGE_EVENT: CHANGE_EVENT,
        getDefaults: function () {
            return normalize(readDefaultsElement());
        },
        load: load,
        save: save,
        dispatchChangeEvent: dispatchChangeEvent,
        normalize: normalize,
    };
})();
