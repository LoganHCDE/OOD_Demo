(function () {
    "use strict";

    var STORAGE_KEY = "pnnl-ondemand-notifications-read-v2";

    var btn = document.getElementById("notifications-menu-button");
    var panel = document.getElementById("notifications-panel");
    var badge = btn && btn.querySelector(".notification-bell-badge");
    var root = btn && btn.closest(".top-bar-dropdown");

    if (!btn || !panel || !badge || !root) return;

    var UNREAD_COUNT = panel.querySelectorAll(".notification-item").length;

    function hasMarkedRead() {
        try {
            return window.localStorage.getItem(STORAGE_KEY) === "1";
        } catch (e) {
            return false;
        }
    }

    function markRead() {
        try {
            window.localStorage.setItem(STORAGE_KEY, "1");
        } catch (e) {
            /* ignore quota / private mode */
        }
    }

    function unreadCount() {
        return hasMarkedRead() ? 0 : UNREAD_COUNT;
    }

    function syncBell() {
        var n = unreadCount();
        if (n === 0) {
            badge.hidden = true;
            btn.setAttribute("aria-label", "System updates");
        } else {
            badge.hidden = false;
            badge.textContent = String(n);
            btn.setAttribute("aria-label", "System updates, " + n + " unread");
        }
    }

    function ensurePanelClosed() {
        panel.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        root.classList.remove("is-open");
    }

    ensurePanelClosed();
    syncBell();

    var observer = new MutationObserver(function () {
        if (panel.hidden) return;
        if (!hasMarkedRead()) {
            markRead();
            syncBell();
        }
    });
    observer.observe(panel, { attributes: true, attributeFilter: ["hidden"] });
})();
