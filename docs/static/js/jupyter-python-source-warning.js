(function () {
    "use strict";

    var page = document.querySelector(".jupyter-submit-page");
    var pyOption = page && page.querySelector("#py_option");
    var note = page && page.querySelector("#py-option-package-note");
    if (!pyOption || !note) return;

    function hasSelectedPackages() {
        return page.querySelectorAll('input[name="packages"]:checked').length > 0;
    }

    function showNote() {
        note.hidden = false;
    }

    function hideNote() {
        note.hidden = true;
    }

    pyOption.addEventListener("change", function () {
        if (hasSelectedPackages()) {
            showNote();
        } else {
            hideNote();
        }
    });

    page.addEventListener("change", function (event) {
        if (!event.target.matches('input[name="packages"]')) return;
        if (!hasSelectedPackages()) {
            hideNote();
        }
    });
})();
