document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const HOME = window.XKissHome;

  if (!HOME) {
    console.warn("XKiss Home Videos: Home Core not loaded.");
    return;
  }

  function getVideoIdFromCard(card) {
    return (
      card.dataset.videoId ||
      card.querySelector("[data-video-id]")?.dataset.videoId ||
      null
    );
  }

  function openVideo(videoId, fallbackTitle = "XKiss Video") {
    if (videoId) {
      window.location.href =
        `player.html?id=${encodeURIComponent(videoId)}`;
      return;
    }

    console.warn(
      "XKiss Home Videos: Video ID not found.",
      fallbackTitle
    );
  }

  function bindVideoCards() {
    document.querySelectorAll(".video-card").forEach(card => {
      if (card.classList.contains("coming-card")) return;
      if (card.dataset.homeVideosBound === "true") return;

      const videoId = getVideoIdFromCard(card);

      if (!videoId) {
        return;
      }

      card.dataset.homeVideosBound = "true";

      card.querySelectorAll(
        ".play-circle, .watch-btn"
      ).forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();

          const title =
            card.querySelector(".video-title")?.textContent.trim() ||
            "XKiss Video";

          openVideo(videoId, title);
        });
      });
    });
  }

  function bindVideoLinks() {
    document.querySelectorAll(
      'a[data-video-id], [data-xkiss-video]'
    ).forEach(element => {
      if (element.dataset.homeVideoLinkBound === "true") return;

      const videoId =
        element.dataset.videoId ||
        element.dataset.xkissVideo;

      if (!videoId) return;

      element.dataset.homeVideoLinkBound = "true";

      element.addEventListener("click", event => {
        event.preventDefault();
        openVideo(videoId);
      });
    });
  }

  function getPlayerUrl(videoId) {
    if (!videoId) return "player.html";

    return `player.html?id=${encodeURIComponent(videoId)}`;
  }

  window.XKissHomeVideos = {
    bindVideoCards,
    bindVideoLinks,
    openVideo,
    getPlayerUrl
  };

  bindVideoCards();
  bindVideoLinks();

  console.log("XKiss Home Videos loaded.");
});
