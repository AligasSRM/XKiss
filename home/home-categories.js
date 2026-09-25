document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const HOME = window.XKissHome;

  if (!HOME) {
    console.warn("XKiss Home Categories: Home Core not loaded.");
    return;
  }

  function setActiveChip(chip) {
    const group = chip.closest(".chips");

    if (!group) return;

    group.querySelectorAll(".chip").forEach(item => {
      item.classList.remove("active");
    });

    chip.classList.add("active");
  }

  function getCategoryName(chip) {
    return chip.textContent.trim();
  }

  function filterVideoCards(category) {
    const cards = document.querySelectorAll(
      ".videos-grid .video-card:not(.coming-card)"
    );

    cards.forEach(card => {
      const tags = [
        ...card.querySelectorAll(".video-tags span")
      ].map(tag =>
        tag.textContent.trim().toLowerCase()
      );

      const title =
        card.querySelector(".video-title")?.textContent
          .trim()
          .toLowerCase() || "";

      const normalizedCategory = category.toLowerCase();

      if (
        normalizedCategory === "all" ||
        normalizedCategory === "new" ||
        normalizedCategory === "trending" ||
        normalizedCategory === "popular" ||
        tags.includes(normalizedCategory) ||
        title.includes(normalizedCategory)
      ) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  }

  function bindCategoryChips() {
    document.querySelectorAll(".chips .chip").forEach(chip => {
      if (chip.dataset.homeCategoryBound === "true") return;

      chip.dataset.homeCategoryBound = "true";

      chip.addEventListener("click", () => {
        const category = getCategoryName(chip);

        setActiveChip(chip);

        if (chip.closest("#categories")) {
          filterVideoCards(category);
        }
      });
    });
  }

  window.XKissHomeCategories = {
    bindCategoryChips,
    filterVideoCards,
    getCategoryName
  };

  bindCategoryChips();

  console.log("XKiss Home Categories loaded.");
});
