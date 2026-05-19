(function () {
    "use strict";

    var root = document.querySelector("[data-cluster-usage-page]");
    if (!root) return;

    var tooltip = document.getElementById("cluster-usage-tooltip");
    var partitionHoverIndex = null;

    function selectRole(role) {
        root.setAttribute("data-cluster-usage-mode", role);
        root.classList.toggle("cluster-usage-page--admin", role === "admin");

        root.querySelectorAll("[data-cluster-usage-role]").forEach(function (btn) {
            var match = btn.getAttribute("data-cluster-usage-role") === role;
            btn.classList.toggle("is-selected", match);
            btn.setAttribute("aria-pressed", match ? "true" : "false");
        });

        root.querySelectorAll("[data-cluster-usage-panel]").forEach(function (panel) {
            var match = panel.getAttribute("data-cluster-usage-panel") === role;
            panel.hidden = !match;
            panel.setAttribute("aria-hidden", match ? "false" : "true");
        });
    }

    root.addEventListener("click", function (evt) {
        var btn = evt.target.closest("[data-cluster-usage-role]");
        if (!btn || !root.contains(btn)) return;
        selectRole(btn.getAttribute("data-cluster-usage-role"));
    });

    if (!tooltip) return;

    function hideTooltip() {
        tooltip.hidden = true;
        tooltip.textContent = "";
        tooltip.removeAttribute("style");
    }

    function positionTooltip(clientX, clientY) {
        var pad = 10;
        var offset = 14;
        tooltip.style.position = "fixed";
        tooltip.style.left = clientX + offset + "px";
        tooltip.style.top = clientY + offset + "px";
        tooltip.style.zIndex = "10000";

        var rect = tooltip.getBoundingClientRect();
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var x = clientX + offset;
        var y = clientY + offset;

        if (x + rect.width > vw - pad) x = Math.max(pad, vw - rect.width - pad);
        if (y + rect.height > vh - pad) y = Math.max(pad, vh - rect.height - pad);
        if (x < pad) x = pad;
        if (y < pad) y = pad;

        tooltip.style.left = x + "px";
        tooltip.style.top = y + "px";
    }

    function showTooltip(text, clientX, clientY) {
        tooltip.textContent = text;
        tooltip.hidden = false;
        positionTooltip(clientX, clientY);
    }

    function tierLabel(tier) {
        if (tier === "high") return "high load";
        if (tier === "mid") return "moderate load";
        return "low load";
    }

    function gaugeTooltip(seg) {
        var title = seg.getAttribute("data-gauge-title") || "";
        var pct = seg.getAttribute("data-usage-pct") || "0";
        var avail = seg.getAttribute("data-available") || "";
        var fullParts = seg.getAttribute("data-full-partitions");
        var segKind = seg.getAttribute("data-segment");
        var p = parseInt(pct, 10);
        if (segKind === "used") {
            return title + ": " + pct + "% in use";
        }
        var rem = isNaN(p) ? 100 - Math.round(Number(pct)) : 100 - p;
        if (fullParts !== null && fullParts !== "") {
            var n = parseInt(fullParts, 10);
            var countStr = isNaN(n) ? fullParts : String(n);
            var word = n === 1 ? "partition" : "partitions";
            return title + ": " + rem + "% unused · " + countStr + " full " + word;
        }
        var left = avail ? avail + " left" : "amount unknown";
        return title + ": " + rem + "% unused · " + left;
    }

    function partitionTooltip(el) {
        var label = el.getAttribute("data-partition-label") || "";
        var pct = el.getAttribute("data-usage-pct") || "0";
        var tier = el.getAttribute("data-tier") || "low";
        return label + " — " + pct + "% used (" + tierLabel(tier) + ")";
    }

    function setPartitionRowHover(rowIndex, on) {
        root.querySelectorAll("[data-partition-row]").forEach(function (el) {
            if (el.getAttribute("data-partition-row") === String(rowIndex)) {
                el.classList.toggle("is-partition-row-hover", on);
            }
        });
    }

    var gaugeSection = root.querySelector(".cluster-usage-gauges");
    if (gaugeSection) {
        gaugeSection.addEventListener("pointerover", function (e) {
            var seg = e.target.closest(".cluster-usage-gauge__segment");
            if (!seg || !gaugeSection.contains(seg)) return;
            showTooltip(gaugeTooltip(seg), e.clientX, e.clientY);
        });
        gaugeSection.addEventListener("pointermove", function (e) {
            if (tooltip.hidden) return;
            if (e.target.closest(".cluster-usage-gauge__segment")) {
                positionTooltip(e.clientX, e.clientY);
            }
        });
        gaugeSection.addEventListener("pointerleave", function () {
            hideTooltip();
        });
    }

    var bars = root.querySelector(".cluster-usage-bars");
    if (bars) {
        bars.addEventListener("pointerover", function (e) {
            var el = e.target.closest("[data-partition-row]");
            if (!el || !bars.contains(el)) return;
            var idx = el.getAttribute("data-partition-row");
            if (partitionHoverIndex !== null && partitionHoverIndex !== idx) {
                setPartitionRowHover(partitionHoverIndex, false);
            }
            partitionHoverIndex = idx;
            setPartitionRowHover(idx, true);
            showTooltip(partitionTooltip(el), e.clientX, e.clientY);
        });
        bars.addEventListener("pointermove", function (e) {
            if (tooltip.hidden || partitionHoverIndex === null) return;
            if (e.target.closest("[data-partition-row]")) {
                positionTooltip(e.clientX, e.clientY);
            }
        });
        bars.addEventListener("pointerleave", function () {
            if (partitionHoverIndex !== null) {
                setPartitionRowHover(partitionHoverIndex, false);
                partitionHoverIndex = null;
            }
            hideTooltip();
        });
    }

    root.querySelectorAll(".cluster-usage-bars__row").forEach(function (row) {
        row.addEventListener("focus", function () {
            var idx = row.getAttribute("data-partition-row");
            if (partitionHoverIndex !== null && partitionHoverIndex !== idx) {
                setPartitionRowHover(partitionHoverIndex, false);
            }
            partitionHoverIndex = idx;
            setPartitionRowHover(idx, true);
            var r = row.getBoundingClientRect();
            showTooltip(partitionTooltip(row), r.left + r.width / 2, r.bottom + 8);
        });
        row.addEventListener("blur", function () {
            var idx = row.getAttribute("data-partition-row");
            setPartitionRowHover(idx, false);
            if (partitionHoverIndex === idx) partitionHoverIndex = null;
            hideTooltip();
        });
    });
})();
