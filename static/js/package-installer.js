(function () {
    const installer = document.querySelector(".package-installer");
    if (!installer) return;

    const searchInput = installer.querySelector("#package-search");
    const chipList = installer.querySelector("#package-chip-list");
    const optionsList = installer.querySelector(".package-options");
    let packageOptions = Array.from(installer.querySelectorAll(".package-option"));
    if (!chipList || !optionsList || packageOptions.length === 0) return;

    const noResultsOption = document.createElement("div");
    noResultsOption.className = "package-add-option";
    noResultsOption.hidden = true;

    const noResultsText = document.createElement("span");
    noResultsText.className = "package-add-option__text";

    const addPackageButton = document.createElement("button");
    addPackageButton.type = "button";
    addPackageButton.className = "package-add-option__button";
    addPackageButton.textContent = "Add Package";

    noResultsOption.append(noResultsText, addPackageButton);
    optionsList.appendChild(noResultsOption);

    packageOptions.forEach(function (option, index) {
        option.dataset.packageOrder = String(index);
    });

    function getCheckbox(option) {
        return option.querySelector('input[type="checkbox"][name="packages"]');
    }

    function getLabel(option) {
        return option.querySelector("label");
    }

    function getPackageName(option) {
        return getLabel(option)?.textContent.trim() || "";
    }

    function getPackageValue(option) {
        return getCheckbox(option)?.value || "";
    }

    function getPackageQuery() {
        return searchInput?.value.trim() || "";
    }

    function getSearchablePackageName(option) {
        return getPackageName(option).toLowerCase();
    }

    function getPackageId(value) {
        const slug = value
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        return `package-${slug || "custom"}-${Date.now()}`;
    }

    function isFavorited(option) {
        return option.querySelector(".package-favorite")?.getAttribute("aria-pressed") === "true";
    }

    function orderPackageOptions(query) {
        const options = packageOptions.slice();

        if (query === "") {
            options.sort(function (first, second) {
                const favoriteDifference = Number(isFavorited(second)) - Number(isFavorited(first));
                if (favoriteDifference !== 0) return favoriteDifference;

                return Number(first.dataset.packageOrder) - Number(second.dataset.packageOrder);
            });
        }

        options.forEach(function (option) {
            optionsList.insertBefore(option, noResultsOption);
        });
    }

    function syncChipList() {
        chipList.replaceChildren();

        packageOptions.forEach(function (option) {
            const checkbox = getCheckbox(option);
            if (!checkbox || !checkbox.checked) return;

            const name = getPackageName(option);
            const value = getPackageValue(option);
            const chip = document.createElement("span");
            chip.className = "package-chip";
            chip.dataset.packageValue = value;

            const text = document.createElement("span");
            text.textContent = name;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.setAttribute("aria-label", `Remove ${name}`);
            removeButton.textContent = "\u00d7";

            chip.append(text, removeButton);
            chipList.appendChild(chip);
        });
    }

    function setFavoriteState(button, favorited) {
        const option = button.closest(".package-option");
        const name = option ? getPackageName(option) : "package";
        const icon = button.querySelector("i.fa-star");

        button.classList.toggle("is-active", favorited);
        button.setAttribute("aria-pressed", favorited ? "true" : "false");
        button.setAttribute("aria-label", favorited ? `${name} is favorited` : `Favorite ${name}`);

        if (icon) {
            icon.classList.toggle("fas", favorited);
            icon.classList.toggle("far", !favorited);
        }
    }

    function showAddPackageOption(query) {
        noResultsText.textContent = `Add package "${query}"`;
        addPackageButton.dataset.packageValue = query;
        noResultsOption.hidden = false;
    }

    function hideAddPackageOption() {
        addPackageButton.dataset.packageValue = "";
        noResultsOption.hidden = true;
    }

    function filterPackages() {
        const query = getPackageQuery();
        const normalizedQuery = query.toLowerCase();
        let visibleCount = 0;

        orderPackageOptions(query);

        packageOptions.forEach(function (option) {
            const matchesQuery = normalizedQuery === "" || getSearchablePackageName(option).includes(normalizedQuery);
            option.hidden = !matchesQuery;

            if (matchesQuery) {
                visibleCount += 1;
            }
        });

        if (query !== "" && visibleCount === 0) {
            showAddPackageOption(query);
        } else {
            hideAddPackageOption();
        }
    }

    function createPackageOption(value) {
        const id = getPackageId(value);
        const option = document.createElement("div");
        option.className = "package-option";
        option.dataset.packageOrder = String(packageOptions.length);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "packages";
        checkbox.id = id;
        checkbox.value = value;
        checkbox.checked = true;
        checkbox.setAttribute("form", "jupyter-session-form");

        const label = document.createElement("label");
        label.setAttribute("for", id);
        label.textContent = value;

        const favoriteButton = document.createElement("button");
        favoriteButton.type = "button";
        favoriteButton.className = "package-favorite";
        favoriteButton.setAttribute("aria-pressed", "false");

        const starIcon = document.createElement("i");
        starIcon.className = "far fa-star";
        starIcon.setAttribute("aria-hidden", "true");

        favoriteButton.appendChild(starIcon);
        option.append(checkbox, label, favoriteButton);
        optionsList.insertBefore(option, noResultsOption);
        packageOptions.push(option);
        setFavoriteState(favoriteButton, false);

        return option;
    }

    function findPackageByValue(value) {
        return packageOptions.find(function (option) {
            return getPackageValue(option).toLowerCase() === value.toLowerCase();
        });
    }

    function addPackageFromSearch() {
        const value = addPackageButton.dataset.packageValue?.trim();
        if (!value) return;

        const existingPackage = findPackageByValue(value);
        const option = existingPackage || createPackageOption(value);
        const checkbox = getCheckbox(option);

        if (checkbox) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        }

        if (searchInput) {
            searchInput.value = "";
            searchInput.focus();
        }

        filterPackages();
    }

    installer.addEventListener("change", function (event) {
        if (!event.target.matches('input[type="checkbox"][name="packages"]')) return;
        syncChipList();
    });

    installer.addEventListener("click", function (event) {
        const removeButton = event.target.closest(".package-chip button");
        if (removeButton) {
            const value = removeButton.closest(".package-chip")?.dataset.packageValue;
            const checkbox = packageOptions
                .map(getCheckbox)
                .find(function (input) {
                    return input && input.value === value;
                });

            if (checkbox) {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event("change", { bubbles: true }));
            }
            return;
        }

        const addButton = event.target.closest(".package-add-option__button");
        if (addButton) {
            addPackageFromSearch();
            return;
        }

        const favoriteButton = event.target.closest(".package-favorite");
        if (!favoriteButton) return;

        const isFavorited = favoriteButton.getAttribute("aria-pressed") === "true";
        setFavoriteState(favoriteButton, !isFavorited);
        filterPackages();
    });

    searchInput?.addEventListener("input", filterPackages);

    installer.querySelectorAll(".package-favorite").forEach(function (button) {
        setFavoriteState(button, button.classList.contains("is-active"));
    });
    syncChipList();
    filterPackages();
})();
