(function () {
    const notebookMode = document.getElementById("jupyter_mode_notebook");
    const labCheckbox = document.getElementById("mode_1");
    if (!notebookMode || !labCheckbox) return;

    function syncModeField() {
        notebookMode.disabled = labCheckbox.checked;
    }

    labCheckbox.addEventListener("change", syncModeField);
    syncModeField();
})();
