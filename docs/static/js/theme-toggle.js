(function () {
    "use strict";

    var STORAGE_KEY = "pnnl-ondemand-theme";

    function getStoredTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function isDarkTheme() {
        return getStoredTheme() === "dark";
    }

    function applyTheme(dark) {
        document.documentElement.classList.toggle("dark", dark);
        try {
            localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
        } catch (e) { /* ignore */ }
    }

    function syncFromStorage() {
        applyTheme(isDarkTheme());
    }

    function isEditableTarget(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }
        var tag = el.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
            return true;
        }
        if (el.isContentEditable) {
            return true;
        }
        if (el.getAttribute("contenteditable") === "true") {
            return true;
        }
        return false;
    }

    function editableTargetFromEventTarget(target) {
        if (!target || target.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }
        var el = target;
        if (isEditableTarget(el)) {
            return el;
        }
        return el.closest("input, textarea, select, [contenteditable='true']");
    }

    document.addEventListener("keydown", function (event) {
        var isShortcut = event.shiftKey && (event.key === "d" || event.key === "D");
        if (!isShortcut) {
            return;
        }
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }
        if (editableTargetFromEventTarget(event.target)) {
            return;
        }
        event.preventDefault();
        applyTheme(!document.documentElement.classList.contains("dark"));
    });

    window.addEventListener("storage", function (event) {
        if (event.key !== STORAGE_KEY) {
            return;
        }
        syncFromStorage();
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", syncFromStorage);
    } else {
        syncFromStorage();
    }
})();
