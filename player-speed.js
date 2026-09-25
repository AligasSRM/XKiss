(function () {
  "use strict";

  function init() {
    const video = document.getElementById("video");
    const speedBtn = document.getElementById("speedBtn");
    const speedMenu = document.getElementById("speedMenu");
    const settingsMenu = document.getElementById("settingsMenu");

    if (!video) {
      console.error("XKiss: Speed system video element not found.");
      return;
    }

    const params = new URLSearchParams(location.search);
    const requestedId = params.get("id") || "video-001";

    let videoData = null;

    if (typeof getXKissVideo === "function") {
      videoData =
        getXKissVideo(requestedId) ||
        getXKissVideo("video-001");
    } else if (typeof XKISS_VIDEOS !== "undefined") {
      videoData =
        XKISS_VIDEOS[requestedId] ||
        XKISS_VIDEOS["video-001"];
    }

    const speeds =
      Array.isArray(videoData?.player?.availableSpeeds)
        ? videoData.player.availableSpeeds
            .map(Number)
            .filter(Number.isFinite)
        : [0.5, 0.75, 1, 1.25, 1.5, 2];

    let currentSpeed =
      Number.isFinite(Number(videoData?.player?.defaultSpeed))
        ? Number(videoData.player.defaultSpeed)
        : 1;

    if (!speeds.includes(currentSpeed)) {
      currentSpeed = 1;
    }

    function updateSpeedButton() {
      if (speedBtn) {
        speedBtn.textContent = currentSpeed + "x";
      }
    }

    function setSpeed(speed) {
      speed = Number(speed);

      if (!Number.isFinite(speed)) return;
      if (!speeds.includes(speed)) return;

      currentSpeed = speed;
      video.playbackRate = speed;

      updateSpeedButton();

      speedMenu?.classList.remove("show");
    }

    if (speedBtn && speedMenu) {
      speedBtn.addEventListener("click", e => {
        e.stopPropagation();

        speedMenu.classList.toggle("show");

        document
          .getElementById("qualityMenu")
          ?.classList.remove("show");

        settingsMenu?.classList.remove("show");
      });
    }

    speedMenu?.querySelectorAll("[data-speed]").forEach(btn => {
      const speed = Number(btn.dataset.speed);

      if (!speeds.includes(speed)) {
        btn.style.display = "none";
        return;
      }

      btn.addEventListener("click", () => {
        setSpeed(speed);
      });
    });

    video.playbackRate = currentSpeed;
    updateSpeedButton();

    console.log(
      "XKiss Player Speed loaded:",
      currentSpeed
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
