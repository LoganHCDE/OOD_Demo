(function () {
    "use strict";

    var selectors = {
        root: ".top-bar-dropdown",
        trigger: ".top-bar-dropdown-trigger",
        panel: ".top-bar-dropdown-panel",
        hoverable: ".top-bar-dropdown--hoverable",
    };

    var hoverLeaveTimers = new WeakMap();

    function clearHoverLeaveTimer(root) {
        var t = hoverLeaveTimers.get(root);
        if (t) {
            clearTimeout(t);
            hoverLeaveTimers.delete(root);
        }
    }

    function closeAll(exceptRoot) {
        document.querySelectorAll(selectors.root).forEach(function (root) {
            if (exceptRoot && root === exceptRoot) return;
            clearHoverLeaveTimer(root);
            var trigger = root.querySelector(selectors.trigger);
            var panel = root.querySelector(selectors.panel);
            if (!trigger || !panel) return;
            panel.hidden = true;
            trigger.setAttribute("aria-expanded", "false");
            root.classList.remove("is-open");
        });
    }

    function openDropdown(root) {
        var trigger = root.querySelector(selectors.trigger);
        var panel = root.querySelector(selectors.panel);
        if (!trigger || !panel) return;
        clearHoverLeaveTimer(root);
        closeAll(root);
        panel.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        root.classList.add("is-open");
    }

    function scheduleCloseHoverable(root) {
        clearHoverLeaveTimer(root);
        hoverLeaveTimers.set(
            root,
            setTimeout(function () {
                hoverLeaveTimers.delete(root);
                var trigger = root.querySelector(selectors.trigger);
                var panel = root.querySelector(selectors.panel);
                if (!trigger || !panel) return;
                panel.hidden = true;
                trigger.setAttribute("aria-expanded", "false");
                root.classList.remove("is-open");
            }, 150)
        );
    }

    function toggle(root) {
        var trigger = root.querySelector(selectors.trigger);
        var panel = root.querySelector(selectors.panel);
        if (!trigger || !panel) return;
        var willOpen = panel.hidden;
        clearHoverLeaveTimer(root);
        closeAll(willOpen ? root : null);
        if (!willOpen) {
            panel.hidden = true;
            trigger.setAttribute("aria-expanded", "false");
            root.classList.remove("is-open");
            return;
        }
        panel.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        root.classList.add("is-open");
    }

    document.querySelectorAll(selectors.root).forEach(function (root) {
        var trigger = root.querySelector(selectors.trigger);
        var panel = root.querySelector(selectors.panel);
        if (!trigger || !panel) return;

        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            toggle(root);
        });

        panel.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        panel.querySelectorAll('[role="menuitem"]').forEach(function (item) {
            item.addEventListener("click", function (evt) {
                closeAll();
                if (item.tagName === "A" && item.getAttribute("href") === "#") {
                    evt.preventDefault();
                }
            });
        });
    });

    document.addEventListener("click", function () {
        closeAll();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeAll();
    });

    document.querySelectorAll(selectors.root + selectors.hoverable).forEach(function (root) {
        root.addEventListener("mouseenter", function () {
            openDropdown(root);
        });
        root.addEventListener("mouseleave", function () {
            scheduleCloseHoverable(root);
        });
    });
})();
