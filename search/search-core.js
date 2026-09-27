(() => {
  "use strict";

  const state = {
    allVideos: [],
    results: [],
    query: "",
    category: "All"
  };

  function loadVideos() {
    if (typeof XKISS_VIDEOS !== "object" || XKISS_VIDEOS === null) {
      console.error("XKiss Search: video data is unavailable.");
      return [];
    }
    return Object.values(XKISS_VIDEOS).filter(video => video && video.id);
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function normalize(value) {
    return clean(value).toLowerCase();
  }

  function getCategories() {
    const configured = window.XKissSearchCategories?.getDefinitions?.() || [];
    const categories = configured.map(category => category.label);
    const known = new Set(categories.map(category => normalize(category)));

    state.allVideos.forEach(video => {
      const category = clean(video.category);
      if (category && !known.has(normalize(category))) {
        categories.push(category);
        known.add(normalize(category));
      }
    });

    return categories.length ? categories : ["All"];
  }

  function getSearchScore(video, query) {
    if (!query) return 0;

    const title = normalize(video.title);
    const creator = normalize(video.creator);
    const category = normalize(video.category);
    const tags = (Array.isArray(video.tags) ? video.tags : [])
      .map(normalize)
      .filter(Boolean);

    let score = 0;

    if (title === query) score += 100;
    else if (title.startsWith(query)) score += 70;
    else if (title.includes(query)) score += 50;

    if (creator === query) score += 45;
    else if (creator.startsWith(query)) score += 30;
    else if (creator.includes(query)) score += 20;

    if (category === query) score += 35;
    else if (category.includes(query)) score += 15;

    if (tags.includes(query)) score += 40;
    else if (tags.some(tag => tag.includes(query))) score += 18;

    return score;
  }

  function matches(video) {
    const selectedCategory = normalize(state.category);
    const query = normalize(state.query);

    if (selectedCategory && selectedCategory !== "all") {
      const category = normalize(video.category);
      const tags = (Array.isArray(video.tags) ? video.tags : []).map(normalize);

      if (category !== selectedCategory && !tags.includes(selectedCategory)) {
        return false;
      }
    }

    if (!query) return true;

    const searchable = [
      video.title,
      video.creator,
      video.category,
      ...(Array.isArray(video.tags) ? video.tags : [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  }

  function apply() {
    const filtered = state.allVideos.filter(matches);
    const query = normalize(state.query);

    if (!query) {
      state.results = filtered;
      return getState();
    }

    state.results = filtered
      .map((video, index) => ({
        video,
        index,
        score: getSearchScore(video, query)
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(item => item.video);

    return getState();
  }

  function updateUrl() {
    const params = new URLSearchParams();

    if (state.query) {
      params.set("q", state.query);
    }

    if (state.category && normalize(state.category) !== "all") {
      params.set("category", state.category);
    }

    const queryString = params.toString();
    const url =
      window.location.pathname +
      (queryString ? "?" + queryString : "") +
      window.location.hash;

    window.history.replaceState(null, "", url);
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);

    state.query = clean(params.get("q"));
    state.category = clean(params.get("category")) || "All";

    const validCategory = getCategories().find(
      category => normalize(category) === normalize(state.category)
    );

    state.category = validCategory || "All";
  }

  function getSearchShareUrl() {
    return window.location.href;
  }

  function setQuery(query) {
    state.query = clean(query);
    updateUrl();
    return apply();
  }

  function setCategory(category) {
    state.category = clean(category) || "All";
    updateUrl();
    return apply();
  }

  function clear() {
    state.query = "";
    state.category = "All";
    updateUrl();
    return apply();
  }

  function syncFromUrl() {
    readUrlState();
    apply();

    document.dispatchEvent(
      new CustomEvent("xkiss:search-state-changed")
    );

    return getState();
  }

  function getState() {
    return {
      allVideos: [...state.allVideos],
      results: [...state.results],
      query: state.query,
      category: state.category,
      shareUrl: getSearchShareUrl()
    };
  }

  function runSelfTest() {
    const originalQuery = state.query;
    const originalCategory = state.category;
    const originalResults = [...state.results];

    const checks = [];
    state.query = "";
    state.category = "All";
    apply();
    checks.push({ name: "all_results", ok: state.results.length === state.allVideos.length });

    if (state.allVideos.length > 0) {
      const sample = state.allVideos[0];
      const titleToken = clean(sample.title).split(/\s+/).find(Boolean);
      if (titleToken) {
        state.query = titleToken;
        state.category = "All";
        apply();
        checks.push({
          name: "title_search",
          ok: state.results.some(video => video.id === sample.id)
        });
      } else {
        checks.push({ name: "title_search", ok: false });
      }

      const sampleCategory = clean(sample.category);
      if (sampleCategory) {
        state.query = "";
        state.category = sampleCategory;
        apply();
        checks.push({
          name: "category_filter",
          ok: state.results.every(video =>
            normalize(video.category) === normalize(sampleCategory) ||
            (Array.isArray(video.tags) &&
              video.tags.map(normalize).includes(normalize(sampleCategory)))
          )
        });
      } else {
        checks.push({ name: "category_filter", ok: true, skipped: true });
      }
    } else {
      checks.push({ name: "title_search", ok: true, skipped: true });
      checks.push({ name: "category_filter", ok: true, skipped: true });
    }

    state.query = originalQuery;
    state.category = originalCategory;
    state.results = originalResults;

    return {
      ok: checks.every(check => check.ok),
      service: "XKiss Search & Categories",
      version: "1.0",
      status: "connected",
      checks,
      restoredState: true
    };
  }

  function initialize() {
    state.allVideos = loadVideos();
    readUrlState();
    apply();

    window.XKissSearch = {
      getState,
      getCategories,
      getSearchShareUrl,
      setQuery,
      setCategory,
      clear,
      syncFromUrl,
      runSelfTest
    };

    window.addEventListener("popstate", syncFromUrl);

    document.dispatchEvent(
      new CustomEvent("xkiss:search-ready")
    );
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();