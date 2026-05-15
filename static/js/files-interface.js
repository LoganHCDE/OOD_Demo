(function () {
    const browser = document.querySelector("[data-files-interface]");
    if (!browser) return;

    const rows = Array.from(browser.querySelectorAll("[data-file-row]"));
    const rowCheckboxes = rows.map((row) => row.querySelector("[data-row-checkbox]"));
    const selectAll = browser.querySelector("[data-select-all]");
    const selectionCount = browser.querySelector("[data-selection-count]");
    const clearSelection = browser.querySelector("[data-clear-selection]");
    const selectionActions = Array.from(browser.querySelectorAll("[data-selection-action]"));
    const ownerToggle = browser.querySelector("[data-owner-toggle]");
    const ownerColumns = Array.from(browser.querySelectorAll("[data-owner-column]"));
    const ownerCells = Array.from(browser.querySelectorAll("[data-owner-cell]"));
    const dotfilesToggle = browser.querySelector("[data-dotfiles-toggle]");
    const filterInput = browser.querySelector("[data-files-filter]");
    const tableStatus = browser.querySelector("[data-table-status]");
    const toast = browser.querySelector("[data-files-toast]");
    const toastProgress = browser.querySelector("[data-files-toast-progress]");
    const toastDismiss = browser.querySelector("[data-toast-dismiss]");

    function isVisible(row) {
        return !row.hidden;
    }

    function updateSelection() {
        const selectedRows = rows.filter((row) => row.querySelector("[data-row-checkbox]")?.checked);
        const visibleRows = rows.filter(isVisible);
        const selectedVisibleRows = visibleRows.filter((row) => row.querySelector("[data-row-checkbox]")?.checked);

        rows.forEach((row) => {
            const checkbox = row.querySelector("[data-row-checkbox]");
            row.classList.toggle("is-selected", Boolean(checkbox?.checked));
        });

        selectionCount.textContent = `${selectedRows.length} selected`;
        clearSelection.hidden = selectedRows.length === 0;

        selectionActions.forEach((button) => {
            button.disabled = selectedRows.length === 0;
            button.classList.toggle("files-action--disabled", selectedRows.length === 0);
        });

        if (selectAll) {
            selectAll.checked = visibleRows.length > 0 && selectedVisibleRows.length === visibleRows.length;
            selectAll.indeterminate = selectedVisibleRows.length > 0 && selectedVisibleRows.length < visibleRows.length;
        }
    }

    function updateTableStatus() {
        const visibleCount = rows.filter(isVisible).length;
        tableStatus.textContent = visibleCount === 0
            ? "Showing 0 rows"
            : `Showing 1 to ${visibleCount} of ${visibleCount} rows`;
    }

    function applyVisibility() {
        const query = filterInput.value.trim().toLowerCase();
        const showDotfiles = dotfilesToggle.checked;

        rows.forEach((row) => {
            const matchesFilter = row.dataset.fileName.includes(query);
            const matchesDotfiles = showDotfiles || !row.hasAttribute("data-dotfile");
            row.hidden = !(matchesFilter && matchesDotfiles);
        });

        updateSelection();
        updateTableStatus();
    }

    rowCheckboxes.forEach((checkbox) => {
        checkbox?.addEventListener("change", updateSelection);
    });

    selectAll?.addEventListener("change", () => {
        rows.filter(isVisible).forEach((row) => {
            const checkbox = row.querySelector("[data-row-checkbox]");
            if (checkbox) checkbox.checked = selectAll.checked;
        });
        updateSelection();
    });

    clearSelection?.addEventListener("click", () => {
        rowCheckboxes.forEach((checkbox) => {
            if (checkbox) checkbox.checked = false;
        });
        updateSelection();
    });

    ownerToggle?.addEventListener("change", () => {
        const showOwner = ownerToggle.checked;
        ownerColumns.forEach((cell) => {
            cell.hidden = !showOwner;
        });
        ownerCells.forEach((cell) => {
            cell.hidden = !showOwner;
        });
    });

    dotfilesToggle?.addEventListener("change", applyVisibility);
    filterInput?.addEventListener("input", applyVisibility);

    function resetToastProgressForReuse() {
        if (!toastProgress) return;
        toastProgress.classList.remove("files-toast__progress--ended");
        toastProgress.style.transition = "none";
        toastProgress.style.transform = "scaleX(1)";
        void toastProgress.offsetWidth;
        toastProgress.style.transition = "";
        toastProgress.style.transform = "";
    }

    function finishToastHide() {
        if (!toast) return;
        toastProgress?.removeEventListener("transitionend", onProgressTransitionEnd);
        toast.hidden = true;
        toast.classList.remove("is-timing", "is-fading");
        resetToastProgressForReuse();
        toast.style.opacity = "";
    }

    function onToastFadeTransitionEnd(ev) {
        if (ev.target !== toast || ev.propertyName !== "opacity") return;
        finishToastHide();
    }

    function beginToastFadeOut() {
        if (!toast) return;
        toast.classList.add("is-fading");
        toast.addEventListener("transitionend", onToastFadeTransitionEnd, { once: true });
    }

    function dismissToast() {
        if (!toast) return;
        toastProgress?.removeEventListener("transitionend", onProgressTransitionEnd);
        if (toast.classList.contains("is-fading")) {
            finishToastHide();
            return;
        }
        toast.classList.remove("is-timing");
        if (toastProgress) {
            const computed = getComputedStyle(toastProgress).transform;
            toastProgress.style.transition = "none";
            toastProgress.style.transform = computed === "none" ? "scaleX(1)" : computed;
            void toastProgress.offsetWidth;
        }
        beginToastFadeOut();
    }

    function onProgressTransitionEnd(ev) {
        if (ev.target !== toastProgress || ev.propertyName !== "transform") return;
        toastProgress.removeEventListener("transitionend", onProgressTransitionEnd);
        if (!toast?.classList.contains("is-timing")) return;
        toastProgress.classList.add("files-toast__progress--ended");
        toast.classList.remove("is-timing");
        beginToastFadeOut();
    }

    function startToastCountdown() {
        if (!toast || !toastProgress || toast.hidden) return;
        toast.classList.remove("is-fading");
        toast.style.opacity = "";
        resetToastProgressForReuse();
        toastProgress.addEventListener("transitionend", onProgressTransitionEnd);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!toast.hidden) toast.classList.add("is-timing");
            });
        });
    }

    toastDismiss?.addEventListener("click", () => {
        dismissToast();
    });

    if (toast && !toast.hidden) {
        startToastCountdown();
    }

    applyVisibility();
})();
