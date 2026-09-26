document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const HOME = window.XKissHome;

  if (!HOME) {
    console.warn("XKiss Home Creators: Home Core not loaded.");
    return;
  }

  function getCreatorName(card) {
    return (
      card.querySelector(".video-creator-name")?.textContent.trim() ||
      card.querySelector(".creator-name")?.textContent.trim() ||
      "XKiss Creator"
    );
  }

  function getCreatorId(card) {
    return (
      card.dataset.creatorId ||
      card.querySelector("[data-creator-id]")?.dataset.creatorId ||
      null
    );
  }

  function bindCreatorCards() {
    document.querySelectorAll(".creator-card, .video-creator-row").forEach(card => {
      if (card.dataset.homeCreatorsBound === "true") return;

      card.dataset.homeCreatorsBound = "true";
      card.dataset.creatorName = getCreatorName(card);

      const creatorId = getCreatorId(card);
      if (creatorId) {
        card.dataset.creatorId = creatorId;
      }
    });
  }

  window.XKissHomeCreators = {
    bindCreatorCards,
    getCreatorName,
    getCreatorId
  };

  bindCreatorCards();

  console.log("XKiss Home Creators loaded.");
});
