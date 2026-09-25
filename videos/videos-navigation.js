document.addEventListener("xkiss:videos-rendered", () => {
  "use strict";

  document.querySelectorAll("[data-video-id]").forEach(element => {
    if (element.dataset.videosNavigationBound === "true") return;

    const videoId = element.dataset.videoId;
    if (!videoId) return;

    element.dataset.videosNavigationBound = "true";

    element.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      window.location.href = `player.html?id=${encodeURIComponent(videoId)}`;
    });
  });
});
