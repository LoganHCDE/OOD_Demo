(function () {
    const page = document.querySelector(".jupyter-submit-page");
    if (!page) return;

    const hoursInput = page.querySelector("#jupyter-job-hours");
    const minutesInput = page.querySelector("#jupyter-job-minutes");
    if (!hoursInput || !minutesInput) return;

    const hoursSpan = hoursInput.closest("label")?.querySelector(".job-time-unit");
    const minutesSpan = minutesInput.closest("label")?.querySelector(".job-time-unit");
    if (!hoursSpan || !minutesSpan) return;

    function countFromInput(input) {
        const n = input.valueAsNumber;
        return Number.isFinite(n) ? n : 0;
    }

    function labelForCount(count, singular, plural) {
        return count === 1 ? singular : plural;
    }

    function sync(input, span) {
        const singular = span.dataset.singular;
        const plural = span.dataset.plural;
        if (!singular || !plural) return;
        const text = labelForCount(countFromInput(input), singular, plural);
        span.textContent = text;
        input.setAttribute("aria-label", text);
    }

    function syncAll() {
        sync(hoursInput, hoursSpan);
        sync(minutesInput, minutesSpan);
    }

    hoursInput.addEventListener("input", function () {
        sync(hoursInput, hoursSpan);
    });
    minutesInput.addEventListener("input", function () {
        sync(minutesInput, minutesSpan);
    });

    syncAll();
})();
