(function () {
    "use strict";

    var charts = Array.from(document.querySelectorAll("[data-job-usage-visualization]"));
    if (!charts.length) return;

    var resources = {
        nodes: {
            label: "Nodes",
            points: [
                [0, 0],
                [10, 0],
                [12, 6],
                [16, 18],
                [20, 16],
                [26, 36],
                [30, 34],
                [35, 44],
                [47, 45],
                [50, 6],
                [60, 5],
                [66, 7],
                [76, 6],
                [92, 6],
                [112, 7],
                [120, 8]
            ],
            events: [
                { type: "waiting", label: "Waiting", startMinute: 0, endMinute: 12 },
                { type: "error", label: "Error", startMinute: 46, endMinute: 50 }
            ]
        },
        cores: {
            label: "Cores",
            points: [
                [0, 0],
                [8, 2],
                [14, 18],
                [20, 30],
                [30, 50],
                [40, 46],
                [50, 58],
                [62, 70],
                [68, 78],
                [74, 58],
                [80, 28],
                [84, 12],
                [96, 11],
                [110, 12],
                [120, 13]
            ],
            events: [
                { type: "waiting", label: "Waiting", startMinute: 0, endMinute: 10 },
                { type: "error", label: "Error", startMinute: 72, endMinute: 78 }
            ]
        },
        gpus: {
            label: "GPUs",
            points: [
                [0, 0],
                [12, 0],
                [18, 10],
                [24, 22],
                [34, 38],
                [42, 30],
                [50, 36],
                [56, 18],
                [60, 8],
                [72, 7],
                [88, 8],
                [104, 7],
                [120, 8]
            ],
            events: [
                { type: "waiting", label: "Waiting", startMinute: 0, endMinute: 14 },
                { type: "error", label: "Error", startMinute: 56, endMinute: 62 }
            ]
        }
    };

    var chartBounds = {
        left: 110,
        top: 40,
        right: 718,
        bottom: 340,
        minutes: 120,
        percent: 100
    };

    function pointToSvg(point) {
        var x = chartBounds.left + ((chartBounds.right - chartBounds.left) * point[0]) / chartBounds.minutes;
        var y = chartBounds.bottom - ((chartBounds.bottom - chartBounds.top) * point[1]) / chartBounds.percent;

        return [Math.round(x), Math.round(y)];
    }

    function lineForPoints(points) {
        return points
            .map(function (point, index) {
                var svgPoint = pointToSvg(point);
                return (index === 0 ? "M " : "L ") + svgPoint[0] + " " + svgPoint[1];
            })
            .join(" ");
    }

    function areaForPoints(points) {
        var line = lineForPoints(points);
        var first = pointToSvg(points[0]);
        var last = pointToSvg(points[points.length - 1]);

        return line + " L " + last[0] + " " + chartBounds.bottom + " L " + first[0] + " " + chartBounds.bottom + " Z";
    }

    function createSvgElement(name) {
        return document.createElementNS("http://www.w3.org/2000/svg", name);
    }

    function minuteToX(minute) {
        return chartBounds.left + ((chartBounds.right - chartBounds.left) * minute) / chartBounds.minutes;
    }

    function formatMinute(minute) {
        var hours = Math.floor(minute / 60);
        var minutes = minute % 60;

        return hours + ":" + String(minutes).padStart(2, "0");
    }

    function eventDescription(event) {
        return event.label + " from " + formatMinute(event.startMinute) + " to " + formatMinute(event.endMinute);
    }

    function renderEvents(eventsGroup, events) {
        eventsGroup.replaceChildren();

        events.forEach(function (event) {
            var startX = Math.round(minuteToX(event.startMinute));
            var endX = Math.round(minuteToX(event.endMinute));
            var width = Math.max(endX - startX, 4);
            var band = createSvgElement("rect");
            var label = createSvgElement("text");

            band.setAttribute("class", "job-usage-chart__status-band job-usage-chart__status-band--" + event.type);
            band.setAttribute("x", String(startX));
            band.setAttribute("y", String(chartBounds.top));
            band.setAttribute("width", String(width));
            band.setAttribute("height", String(chartBounds.bottom - chartBounds.top));
            band.setAttribute("rx", "3");
            eventsGroup.appendChild(band);

            label.setAttribute("class", "job-usage-chart__status-label job-usage-chart__status-label--" + event.type);
            label.setAttribute("x", String(startX + Math.max(width / 2, 8)));
            label.setAttribute("y", String(chartBounds.top + 18));
            label.setAttribute("text-anchor", "middle");
            label.textContent = event.label;
            eventsGroup.appendChild(label);
        });
    }

    function describeEvents(events) {
        return events.map(eventDescription).join("; ");
    }

    function setActiveResource(chartParts, resourceKey) {
        var resource = resources[resourceKey] || resources.nodes;

        chartParts.areaPath.setAttribute("d", areaForPoints(resource.points));
        chartParts.linePath.setAttribute("d", lineForPoints(resource.points));
        chartParts.areaPath.setAttribute(
            "class",
            "job-usage-chart__area job-usage-chart__area--" + resourceKey
        );
        chartParts.linePath.setAttribute(
            "class",
            "job-usage-chart__line job-usage-chart__line--" + resourceKey
        );
        renderEvents(chartParts.eventsGroup, resource.events);

        chartParts.description.textContent =
            resource.label + " usage over two hours. Status periods shown: " + describeEvents(resource.events) + ".";

        chartParts.buttons.forEach(function (button) {
            var isSelected = button.dataset.jobUsageResource === resourceKey;
            button.classList.toggle("is-selected", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));
        });
    }

    charts.forEach(function (chart) {
        var chartParts = {
            buttons: Array.from(chart.querySelectorAll("[data-job-usage-resource]")),
            areaPath: chart.querySelector("[data-job-usage-area]"),
            linePath: chart.querySelector("[data-job-usage-line]"),
            eventsGroup: chart.querySelector("[data-job-usage-events]"),
            description: chart.querySelector("[data-job-usage-description]")
        };

        if (
            !chartParts.buttons.length ||
            !chartParts.areaPath ||
            !chartParts.linePath ||
            !chartParts.eventsGroup ||
            !chartParts.description
        ) {
            return;
        }

        chartParts.buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                setActiveResource(chartParts, button.dataset.jobUsageResource);
            });
        });

        setActiveResource(chartParts, "nodes");
    });
})();
