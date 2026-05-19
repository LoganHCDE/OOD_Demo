(function () {
    "use strict";

    var roots = document.querySelectorAll("[data-partition-usage-gauge]");
    if (!roots.length) return;

    var base = document.body.getAttribute("data-app-base") || "";
    var apiUrl = base + "/api/cluster-usage-stats";

    function tierForUsage(usagePct, tier) {
        return usagePct >= 75 ? "high" : tier;
    }

    function updateGaugeIcon(svg, gauge, circumference) {
        if (!svg || !gauge) return;

        var usagePct = gauge.usage_pct;
        var style = tierForUsage(usagePct, gauge.tier);
        var arcLen = Math.round(circumference * usagePct / 100 * 100) / 100;
        var remLen = Math.round(circumference * (100 - usagePct) / 100 * 100) / 100;

        var usedArc = svg.querySelector("circle.cluster-usage-gauge__arc");
        var availArc = svg.querySelector(".cluster-usage-gauge__arc--available-ring");
        var label = svg.querySelector(".cluster-usage-gauge__percent");

        if (usedArc) {
            usedArc.setAttribute("stroke-dasharray", arcLen + " " + circumference);
            usedArc.setAttribute("class", "cluster-usage-gauge__arc cluster-usage-gauge__arc--" + style);
            usedArc.hidden = arcLen <= 0;
        }

        if (availArc) {
            availArc.setAttribute("stroke-dasharray", remLen + " " + circumference);
            availArc.setAttribute("stroke-dashoffset", "-" + arcLen);
            availArc.hidden = remLen <= 0;
        }

        if (label) {
            label.textContent = usagePct + "%";
            label.setAttribute("class", "cluster-usage-gauge__percent cluster-usage-gauge__percent--" + style);
        }
    }

    fetch(apiUrl, { credentials: "same-origin" })
        .then(function (response) {
            if (!response.ok) throw new Error("Failed to load cluster usage stats");
            return response.json();
        })
        .then(function (data) {
            var circumference = data.gauge_circumference;
            roots.forEach(function (root) {
                var gaugeId = root.getAttribute("data-gauge-id") || "nodes";
                var gauge = (data.gauges || []).find(function (entry) {
                    return entry.id === gaugeId;
                });
                if (!gauge) return;
                updateGaugeIcon(root.querySelector(".cluster-usage-gauge-icon"), gauge, circumference);
            });
        })
        .catch(function () {
            /* Keep server-rendered values when the API is unavailable. */
        });
})();
