(function () {
    const STORAGE_KEY = "pnnl-ood-dashboard-favorites-v2";
    const LEGACY_STORAGE_KEY = "pnnl-ood-dashboard-favorites";
    const DEFAULT_FAVORITES = ["jupyter", "rstudio"];

    function dedupeStringIds(arr) {
        const seen = new Set();
        const out = [];
        for (const id of arr) {
            if (typeof id !== "string" || seen.has(id)) continue;
            seen.add(id);
            out.push(id);
        }
        return out;
    }

    function tryParseFavoriteIds(raw) {
        if (raw == null || raw === "") return null;
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return null;
            return dedupeStringIds(parsed);
        } catch {
            return null;
        }
    }

    /** One-time v2 key: migrate non-empty legacy list, else prototype defaults (legacy [] or missing). */
    function bootstrapFavoritesStorage() {
        if (localStorage.getItem(STORAGE_KEY) !== null) return;
        let next = DEFAULT_FAVORITES.slice();
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        const legacyIds = tryParseFavoriteIds(legacyRaw);
        if (legacyIds && legacyIds.length > 0) {
            next = legacyIds;
        }
        writeFavorites(next);
    }

    function readFavorites() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw === null) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return dedupeStringIds(parsed);
        } catch {
            return [];
        }
    }

    function writeFavorites(ids) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }

    function escapeId(id) {
        return typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id.replace(/"/g, '\\"');
    }

    function getAppName(card) {
        const el = card.querySelector(".app-name");
        return el ? el.textContent.trim() : "";
    }

    function applyPinState(button, favorited) {
        const name = getAppName(button.closest(".app-card"));
        button.classList.toggle("is-filled", favorited);
        button.setAttribute("aria-pressed", favorited ? "true" : "false");
        button.setAttribute(
            "aria-label",
            favorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`
        );
        const icon = button.querySelector("i.fa-star");
        if (icon) {
            icon.classList.remove("fas", "far");
            icon.classList.add(favorited ? "fas" : "far");
        }
    }

    function setAllPinsForApp(appId, favorited) {
        document.querySelectorAll('.app-card[data-app-id="' + escapeId(appId) + '"] .pin').forEach(function (pin) {
            applyPinState(pin, favorited);
        });
    }

    function syncFavoritesSectionVisibility(favoritesSection, favoritesGrid) {
        if (!favoritesSection || !favoritesGrid) return;
        favoritesSection.hidden = favoritesGrid.children.length === 0;
    }

    function getOriginalCard(appId) {
        return document.querySelector(
            '.app-card[data-app-id="' + escapeId(appId) + '"]:not([data-favorite-clone])'
        );
    }

    function getFavoriteClone(appId, favoritesGrid) {
        return favoritesGrid.querySelector(
            '.app-card[data-app-id="' + escapeId(appId) + '"][data-favorite-clone]'
        );
    }

    function buildFavoriteClone(original) {
        const c = original.cloneNode(true);
        c.setAttribute("data-favorite-clone", "true");
        c.removeAttribute("data-section-id");
        return c;
    }

    function ensureFavoriteClone(appId, favoritesGrid) {
        if (!favoritesGrid || !readFavorites().includes(appId)) return;
        if (getFavoriteClone(appId, favoritesGrid)) return;
        const original = getOriginalCard(appId);
        if (!original) return;
        favoritesGrid.appendChild(buildFavoriteClone(original));
    }

    function removeFavoriteClone(appId, favoritesGrid) {
        const clone = getFavoriteClone(appId, favoritesGrid);
        if (clone) clone.remove();
    }

    function init() {
        const favoritesSection = document.getElementById("dashboard-favorites");
        const favoritesGrid = document.getElementById("favorites-grid");
        if (!favoritesSection || !favoritesGrid) return;

        bootstrapFavoritesStorage();
        const ids = readFavorites();
        for (const id of ids) {
            const original = getOriginalCard(id);
            if (!original) continue;
            setAllPinsForApp(id, true);
            ensureFavoriteClone(id, favoritesGrid);
        }
        syncFavoritesSectionVisibility(favoritesSection, favoritesGrid);

        document.querySelector(".dashboard-shell")?.addEventListener("click", function (e) {
            const pin = e.target.closest(".app-card .pin");
            if (!pin) return;
            e.preventDefault();
            e.stopPropagation();

            const card = pin.closest(".app-card");
            if (!card || !favoritesGrid) return;

            const appId = card.dataset.appId;
            if (!appId) return;

            const wasFavorite = pin.getAttribute("aria-pressed") === "true";
            const nowFavorite = !wasFavorite;

            let list = readFavorites();
            if (nowFavorite) {
                if (!list.includes(appId)) list = list.concat(appId);
            } else {
                list = list.filter(function (x) {
                    return x !== appId;
                });
            }
            writeFavorites(list);

            setAllPinsForApp(appId, nowFavorite);

            if (nowFavorite) {
                ensureFavoriteClone(appId, favoritesGrid);
            } else {
                removeFavoriteClone(appId, favoritesGrid);
            }

            syncFavoritesSectionVisibility(favoritesSection, favoritesGrid);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
