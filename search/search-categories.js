(() => {
  "use strict";

  const CATEGORY_DEFINITIONS = [
    { id: "all", label: "All" },
    { id: "entertainment", label: "Entertainment" },
    { id: "lifestyle", label: "Lifestyle" },
    { id: "music", label: "Music" },
    { id: "fitness", label: "Fitness" },
    { id: "comedy", label: "Comedy" },
    { id: "education", label: "Education" },
    { id: "gaming", label: "Gaming" },
    { id: "travel", label: "Travel" },
    { id: "test", label: "Test" }
  ];

  function clean(value) {
    return String(value || "").trim();
  }

  function getDefinitions() {
    return CATEGORY_DEFINITIONS.map(category => ({ ...category }));
  }

  function findCategory(value) {
    const normalized = clean(value).toLowerCase();

    return CATEGORY_DEFINITIONS.find(
      category =>
        category.id === normalized ||
        category.label.toLowerCase() === normalized
    ) || null;
  }

  window.XKissSearchCategories = {
    getDefinitions,
    findCategory
  };
})();