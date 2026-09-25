document.addEventListener("xkiss:videos-ready", () => {
  "use strict";

  const API = window.XKissVideos;
  const searchInput = document.getElementById("video-search");
  const filterContainer = document.getElementById("video-filters");
  const sortSelect = document.getElementById("video-sort");
  const clearButton = document.getElementById("clear-filters");

  if (!API || !searchInput || !filterContainer || !sortSelect) {
    console.error("XKiss Videos: filter UI could not initialize.");
    return;
  }

  function renderFilters() {
    filterContainer.innerHTML = "";
    API.getCategories().forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter";
      button.textContent = category;
      button.dataset.category = category;
      if (category === API.getState().category) button.classList.add("active");

      button.addEventListener("click", () => {
        API.setState({ category });
        API.applyFilters();
        renderFilters();
        document.dispatchEvent(new CustomEvent("xkiss:videos-filtered"));
      });

      filterContainer.appendChild(button);
    });
  }

  function handleSearch() {
    API.setState({ search: searchInput.value });
    API.applyFilters();
    document.dispatchEvent(new CustomEvent("xkiss:videos-filtered"));
  }

  searchInput.addEventListener("input", handleSearch);

  sortSelect.addEventListener("change", () => {
    API.setState({ sort: sortSelect.value });
    API.applyFilters();
    document.dispatchEvent(new CustomEvent("xkiss:videos-filtered"));
  });

  clearButton?.addEventListener("click", () => {
    searchInput.value = "";
    sortSelect.value = "latest";
    API.setState({ category: "All", search: "", sort: "latest" });
    API.applyFilters();
    renderFilters();
    document.dispatchEvent(new CustomEvent("xkiss:videos-filtered"));
  });

  renderFilters();
});
