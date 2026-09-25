document.addEventListener("xkiss:search-ready", () => {
  "use strict";

  const API = window.XKissSearch;
  const input = document.getElementById("search-input");
  const categoryList = document.getElementById("category-list");
  const resultsGrid = document.getElementById("results-grid");
  const resultCount = document.getElementById("result-count");
  const emptyState = document.getElementById("empty-state");
  const clearButton = document.getElementById("clear-search");
  const shareButton = document.getElementById("share-search");
  const shareStatus = document.getElementById("share-status");

  if (!API || !input || !categoryList || !resultsGrid || !resultCount || !emptyState || !clearButton || !shareButton || !shareStatus) {
    console.error("XKiss Search: UI could not initialize.");
    return;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function highlight(value, query) {
    const text = String(value ?? "");
    const cleanQuery = String(query ?? "").trim();

    if (!cleanQuery) return escapeHtml(text);

    const escapedQuery = cleanQuery.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
    const matcher = new RegExp("(" + escapedQuery + ")", "ig");
    const parts = text.split(matcher);

    return parts.map(part => {
      if (part.toLowerCase() === cleanQuery.toLowerCase()) {
        return "<mark class=\"search-highlight\">" + escapeHtml(part) + "</mark>";
      }
      return escapeHtml(part);
    }).join("");
  }

  function getInitial(value) {
    const text = String(value || "X").trim();
    return text ? text.charAt(0).toUpperCase() : "X";
  }

  function renderCategories() {
    const active = API.getState().category;

    categoryList.innerHTML = API.getCategories().map(category => {
      const selected = category.toLowerCase() === active.toLowerCase() ? " active" : "";
      const pressed = selected ? "true" : "false";

      return "<button class=\"category-btn" + selected + "\" type=\"button\" aria-pressed=\"" + pressed + "\" data-category=\"" + escapeHtml(category) + "\">" + escapeHtml(category) + "</button>";
    }).join("");

    categoryList.querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => {
        API.setCategory(button.dataset.category);
        renderCategories();
        renderResults();
      });
    });
  }

  function renderResults() {
    const { results, query, category } = API.getState();

    resultsGrid.innerHTML = results.map(video => {
      const quality =
        video.quality?.default ||
        (video.sources?.["1080p"] ? "1080p" :
        video.sources?.["720p"] ? "720p" :
        video.sources?.["460p"] ? "460p" :
        video.sources?.["340p"] ? "340p" : "—");

      const views = Number(video.statistics?.views ?? video.views ?? 0);

      return "<article class=\"result-card\"><div class=\"result-thumb\"><div class=\"thumb-brand\"><span class=\"thumb-x\">X</span><span class=\"thumb-kiss\">kiss</span></div><span class=\"quality\">" + escapeHtml(quality) + "</span></div><div class=\"result-info\"><h3>" + highlight(video.title, query) + "</h3><div class=\"creator\"><span class=\"avatar\">" + getInitial(video.creator) + "</span><span>" + highlight(video.creator || "XKiss Creator", query) + "</span></div><p>" + escapeHtml(video.duration || "—") + " · " + views.toLocaleString() + " views</p><a class=\"watch\" href=\"player.html?id=" + encodeURIComponent(video.id) + "\">Watch Now</a></div></article>";
    }).join("");

    const hasFilter = Boolean(query.trim()) || category.toLowerCase() !== "all";
    resultCount.textContent = results.length + " " + (results.length === 1 ? "video" : "videos") + (hasFilter ? " found" : "");
    emptyState.hidden = results.length !== 0;
  }

  function syncInput() {
    input.value = API.getState().query;
  }

  function refreshFromUrl() {
    syncInput();
    renderCategories();
    renderResults();
  }

  function showShareStatus(message) {
    shareStatus.textContent = message;
    window.clearTimeout(showShareStatus.timer);
    showShareStatus.timer = window.setTimeout(() => {
      shareStatus.textContent = "";
    }, 2500);
  }

  async function shareSearch() {
    const url = API.getSearchShareUrl();

    try {
      if (navigator.share) {
        await navigator.share({
          title: "XKiss Search",
          text: "XKiss Search & Categories",
          url
        });
        showShareStatus("Share sheet opened.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showShareStatus("Search link copied.");
        return;
      }

      showShareStatus("Copy is not available on this device.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        showShareStatus("Could not share the search link.");
      }
    }
  }

  function clearSearch() {
    API.clear();
    syncInput();
    renderCategories();
    renderResults();
    input.focus();
  }

  input.addEventListener("input", () => {
    API.setQuery(input.value);
    renderResults();
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      clearSearch();
    }
  });

  clearButton.addEventListener("click", clearSearch);
  shareButton.addEventListener("click", shareSearch);
  document.addEventListener("xkiss:search-state-changed", refreshFromUrl);

  syncInput();
  renderCategories();
  renderResults();
});