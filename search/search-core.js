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

    return Object.values(XKISS_VIDEOS).filter(
      video => video && video.id
    );
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function normalize(value) {
    return clean(value).toLowerCase();
  }

  function getCategories() {
    const configured =
      window.XKissSearchCategories?.getDefinitions?.() || [];

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
      const tags = (Array.isArray(video.tags) ? video.tags : [])
        .map(normalize);

      if (
        category !== selectedCategory &&
        !tags.includes(selectedCategory)
      ) {
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

  function setQuery(query) {
    state.query = clean(query);
    return apply();
  }

  function setCategory(category) {
    state.category = clean(category) || "All";
    return apply();
  }

  function clear() {
    state.query = "";
    state.category = "All";
    return apply();
  }

  function getState() {
    return {
      allVideos: [...state.allVideos],
      results: [...state.results],
      query: state.query,
      category: state.category
    };
  }

  function initialize() {
    state.allVideos = loadVideos();
    apply();

    window.XKissSearch = {
      getState,
      getCategories,
      setQuery,
      setCategory,
      clear
    };

    document.dispatchEvent(
      new CustomEvent("xkiss:search-ready")
    );
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();