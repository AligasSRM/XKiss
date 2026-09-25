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

  function openCreator(creatorId, creatorName) {
    if (creatorId) {
      window.location.href =
        `creator.html?id=${encodeURIComponent(creatorId)}`;
      return;
    }

    console.info(
      "XKiss Home Creators: Creator profile is not connected yet.",
      creatorName
    );
  }

  function bindCreatorCards() {
    document.querySelectorAll(
      ".creator-card, .video-creator-row"
    ).forEach(card => {
      if (card.dataset.homeCreatorsBound === "true") return;

      card.dataset.homeCreatorsBound = "true";

      const creatorName = getCreatorName(card);
      const creatorId = getCreatorId(card);

      const creatorElements = card.querySelectorAll(
        ".creator-name, .video-creator-name, .creator-avatar"
      );

      creatorElements.forEach(element => {
        element.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();

          openCreator(creatorId, creatorName);
        });
      });
    });
  }

  function bindFollowButtons() {
    document.querySelectorAll(
      ".mini-follow, .follow-btn"
    ).forEach(button => {
      if (button.dataset.homeCreatorFollowBound === "true") {
        return;
      }

      button.dataset.homeCreatorFollowBound = "true";

      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        const creator =
          button.closest(".video-card, .creator-card");

        const creatorName = creator
          ? getCreatorName(creator)
          : "XKiss Creator";

        if (typeof window.showMessage === "function") {
          window.showMessage(
            `Follow system for ${creatorName} will be connected later.`
          );
        } else {
          console.info(
            "XKiss Home Creators: Follow system not connected.",
            creatorName
          );
        }
      });
    });
  }

  window.XKissHomeCreators = {
    bindCreatorCards,
    bindFollowButtons,
    getCreatorName,
    getCreatorId,
    openCreator
  };

  bindCreatorCards();
  bindFollowButtons();

  console.log("XKiss Home Creators loaded.");
});
