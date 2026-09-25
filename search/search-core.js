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

  function getCategories() {
    const categories = new Set(["All"]);

    state.allVideos.forEach(video => {
      const category = clean(video.category);
      if (category) categories.add(category);

      (Array.isArray(video.tags) ? video.tags : []).forEach(tag => {
        const value = clean(tag);
        if (value) categories.add(value);
      });
    });

    return [...categories];
  }

  function matches(video) {
    const selectedCategory = clean(state.category).toLowerCase();
    const query = clean(state.query).toLowerCase();

    if (selectedCategory && selectedCategory !== "all") {
      const category = clean(video.category).toLowerCase();
      const tags = (video.tags || []).map(tag => clean(tag).toLowerCase());

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
    state.results = state.allVideos.filter(matches);
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