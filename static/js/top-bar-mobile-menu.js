(function () {
    "use strict";

    var mq = window.matchMedia("(max-width: 760px)");
    var header = document.querySelector(".top-bar");
    var toggle = document.getElementById("top-bar-menu-toggle");
    var panel = document.getElementById("top-bar-menu-panel");
    var backdrop = document.getElementById("top-bar-menu-backdrop");

    if (!header || !toggle || !panel || !backdrop) return;

    function isMobileNav() {
        return mq.matches;
    }

    function syncPanelAria(open) {
        if (!isMobileNav()) {
            panel.removeAttribute("aria-hidden");
            return;
        }
        panel.setAttribute("aria-hidden", open ? "false" : "true");
    }

    function setBackdropVisible(visible) {
        if (visible) {
            backdrop.removeAttribute("hidden");
            backdrop.setAttribute("aria-hidden", "false");
        } else {
            backdrop.setAttribute("hidden", "");
            backdrop.setAttribute("aria-hidden", "true");
        }
    }

    function openMenu() {
        if (!isMobileNav()) return;
        header.classList.add("top-bar--menu-open");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close menu");
        setBackdropVisible(true);
        syncPanelAria(true);
        document.body.style.overflow = "hidden";
    }

    function closeMenu() {
        header.classList.remove("top-bar--menu-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        setBackdropVisible(false);
        syncPanelAria(false);
        document.body.style.overflow = "";
    }

    function syncBreakpoint() {
        if (!isMobileNav()) {
            header.classList.remove("top-bar--menu-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open menu");
            setBackdropVisible(false);
            document.body.style.overflow = "";
            panel.removeAttribute("aria-hidden");
        } else {
            syncPanelAria(header.classList.contains("top-bar--menu-open"));
        }
    }

    toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!isMobileNav()) return;
        if (header.classList.contains("top-bar--menu-open")) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    backdrop.addEventListener("click", function () {
        closeMenu();
    });

    panel.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a || !isMobileNav() || !header.classList.contains("top-bar--menu-open")) return;
        var href = a.getAttribute("href");
        if (href && href !== "#" && href.indexOf("javascript:") !== 0) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && header.classList.contains("top-bar--menu-open")) {
            closeMenu();
        }
    });

    mq.addEventListener("change", syncBreakpoint);
    syncBreakpoint();
})();
