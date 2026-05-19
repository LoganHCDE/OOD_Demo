(function () {
    "use strict";

    var page = document.querySelector(".jupyter-submit-page");
    if (!page) return;

    var meters = Array.from(page.querySelectorAll("[data-resource-availability]"));
    var partitionSelect = page.querySelector("#partition_list");
    var partitionMeter = page.querySelector("[data-partition-availability]");
    var jobsRunning = page.querySelector("[data-jobs-running]");
    var jobsQueued = page.querySelector("[data-jobs-queued]");

    function randomPercent() {
        return Math.floor(Math.random() * 101);
    }

    function statusForPercent(percent) {
        if (percent <= 50) return "low";
        if (percent <= 75) return "medium";
        return "high";
    }

    function formatNumber(value) {
        return value.toLocaleString("en-US");
    }

    function randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    if (jobsRunning) {
        jobsRunning.textContent = formatNumber(randomInteger(1, 500));
    }

    if (jobsQueued) {
        jobsQueued.textContent = formatNumber(randomInteger(0, 20));
    }

    meters.forEach(function (meter) {
        var label = meter.dataset.resourceLabel;
        var total = Number(meter.dataset.resourceTotal);
        var fill = meter.querySelector("[data-resource-fill]");
        var count = meter.querySelector("[data-resource-count]");
        var percentLabel = meter.querySelector("[data-resource-percent]");
        var meterElement = meter.querySelector(".resource-availability__meter");

        if (!label || !Number.isFinite(total) || !fill || !count || !percentLabel || !meterElement) return;

        var percent = randomPercent();
        var available = Math.round((total * percent) / 100);
        var status = statusForPercent(percent);

        meter.dataset.resourceStatus = status;
        fill.style.width = percent + "%";
        count.textContent = label + " Available: " + formatNumber(available);
        percentLabel.textContent = percent + "%";
        meterElement.setAttribute("aria-valuenow", String(percent));
        meterElement.setAttribute("aria-valuetext", percent + "% available, " + formatNumber(available) + " " + label.toLowerCase() + " available");
    });

    if (!partitionSelect || !partitionMeter) return;

    var partitionFill = partitionMeter.querySelector("[data-partition-fill]");
    var partitionCount = partitionMeter.querySelector("[data-partition-count]");
    var partitionPercent = partitionMeter.querySelector("[data-partition-percent]");
    var partitionMeterElement = partitionMeter.querySelector(".resource-availability__meter");
    var partitionOptions = Array.from(partitionSelect.options);

    if (!partitionFill || !partitionCount || !partitionPercent || !partitionMeterElement || partitionOptions.length === 0) return;

    partitionOptions.forEach(function (option) {
        var name = option.dataset.partitionName || option.value || option.textContent.trim();
        var percent = randomPercent();

        option.dataset.partitionName = name;
        option.dataset.partitionPercent = String(percent);
        option.textContent = name + " (" + percent + "% full)";
    });

    function syncSelectedPartition() {
        var option = partitionSelect.selectedOptions[0];
        if (!option) return;

        var name = option.dataset.partitionName || option.value;
        var percent = Number(option.dataset.partitionPercent);
        if (!name || !Number.isFinite(percent)) return;

        var status = statusForPercent(percent);
        partitionMeter.dataset.resourceStatus = status;
        partitionFill.style.width = percent + "%";
        partitionCount.textContent = "Partition Usage: " + name;
        partitionPercent.textContent = percent + "%";
        partitionMeterElement.setAttribute("aria-valuenow", String(percent));
        partitionMeterElement.setAttribute("aria-valuetext", name + " partition is " + percent + "% full");
    }

    partitionSelect.addEventListener("change", syncSelectedPartition);
    syncSelectedPartition();
})();
