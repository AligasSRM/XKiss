document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const player = document.getElementById("player");

  const speedBtn = document.getElementById("speedBtn");
  const speedMenu = document.getElementById("speedMenu");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsMenu = document.getElementById("settingsMenu");
  const pipBtn = document.getElementById("pipBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const ccBtn = document.getElementById("ccBtn");
  const resetSpeedBtn = document.getElementById("resetSpeedBtn");

  const videoTitle = document.getElementById("videoTitle");
  const videoDuration = document.getElementById("videoDuration");
  const creatorName = document.getElementById("creatorName");
  const videoTags = document.getElementById("videoTags");
  const views = document.getElementById("views");

  if (!video || !player) {
    console.error("XKiss: Player elements not found.");
    return;
  }

  /* Load modular player controls */
  const controlsScript = document.createElement("script");
  controlsScript.src = "js/player/player-controls.js";
  document.body.appendChild(controlsScript);

  /* Load modular player quality */
  const qualityScript = document.createElement("script");
  qualityScript.src = "js/player/player-quality.js";
  document.body.appendChild(qualityScript);

  /* Video ID */
  const params = new URLSearchParams(location.search);
  const requestedId = params.get("id") || "video-001";

  /* Video data */
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

  if (!videoData) {
    if (videoTitle) {
      videoTitle.textContent = "Video Not Found";
    }

    console.error("XKiss: Video data not found.");
    return;
  }

  /* Basic information */
  if (videoTitle) {
    videoTitle.textContent =
      videoData.title || "XKiss Video";
  }

  if (videoDuration) {
    videoDuration.textContent =
      videoData.duration || "00:00";
  }

  if (creatorName) {
    creatorName.textContent =
      videoData.creator || "XKiss Creator";
  }

  if (views) {
    const count =
      Number.isFinite(Number(videoData.statistics?.views))
        ? Number(videoData.statistics.views)
        : Number(videoData.views || 0);

    views.textContent = count;
  }

  /* Tags */
  if (videoTags) {
    videoTags.innerHTML = "";

    if (Array.isArray(videoData.tags)) {
      videoData.tags.forEach(tag => {
        const el = document.createElement("span");
        const text = String(tag);

        el.textContent =
          text.startsWith("#")
            ? text
            : "#" + text;

        videoTags.appendChild(el);
      });
    }
  }

  /* Speed */
  let currentSpeed =
    Number.isFinite(Number(videoData.player?.defaultSpeed))
      ? Number(videoData.player.defaultSpeed)
      : 1;

  const speeds =
    Array.isArray(videoData.player?.availableSpeeds)
      ? videoData.player.availableSpeeds
          .map(Number)
          .filter(Number.isFinite)
      : [0.5, 0.75, 1, 1.25, 1.5, 2];

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
      if (!Number.isFinite(speed)) return;

      currentSpeed = speed;
      video.playbackRate = speed;

      if (speedBtn) {
        speedBtn.textContent = speed + "x";
      }

      speedMenu.classList.remove("show");
    });
  });

  /* Settings */
  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener("click", e => {
      e.stopPropagation();

      settingsMenu.classList.toggle("show");

      document
        .getElementById("qualityMenu")
        ?.classList.remove("show");

      speedMenu?.classList.remove("show");
    });
  }

  /* CC */
  ccBtn?.addEventListener("click", () => {
    alert(
      videoData.captions?.available
        ? "Caption tracks are available for future integration."
        : "CC is ready for future subtitle integration."
    );
  });

  /* Reset speed */
  resetSpeedBtn?.addEventListener("click", () => {
    currentSpeed = 1;
    video.playbackRate = 1;

    if (speedBtn) {
      speedBtn.textContent = "1x";
    }

    settingsMenu?.classList.remove("show");
  });

  /* Picture in Picture */
  pipBtn?.addEventListener("click", async e => {
    e.stopPropagation();

    if (
      !document.pictureInPictureEnabled ||
      video.disablePictureInPicture
    ) {
      return;
    }

    try {
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error("XKiss PiP error:", error);
    }
  });

  video.addEventListener(
    "enterpictureinpicture",
    () => {
      pipBtn?.classList.add("active");
    }
  );

  video.addEventListener(
    "leavepictureinpicture",
    () => {
      pipBtn?.classList.remove("active");
    }
  );

  /* Fullscreen */
  function isFullscreen() {
    return Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement
    );
  }

  async function lockLandscape() {
    try {
      if (
        screen.orientation &&
        typeof screen.orientation.lock === "function"
      ) {
        await screen.orientation.lock("landscape");
      }
    } catch (error) {
      console.log(
        "XKiss: Landscape lock unavailable."
      );
    }
  }

  function unlockOrientation() {
    try {
      if (
        screen.orientation &&
        typeof screen.orientation.unlock === "function"
      ) {
        screen.orientation.unlock();
      }
    } catch (error) {}
  }

  async function enterFullscreen() {
    try {
      if (player.requestFullscreen) {
        await player.requestFullscreen();
      } else if (player.webkitRequestFullscreen) {
        player.webkitRequestFullscreen();
      } else {
        return;
      }

      await lockLandscape();
    } catch (error) {
      console.error(
        "XKiss fullscreen error:",
        error
      );
    }
  }

  async function exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (error) {
      console.error(
        "XKiss fullscreen exit error:",
        error
      );
    }

    unlockOrientation();
  }

  fullscreenBtn?.addEventListener(
    "click",
    async e => {
      e.stopPropagation();

      if (isFullscreen()) {
        await exitFullscreen();
      } else {
        await enterFullscreen();
      }
    }
  );

  function fullscreenChanged() {
    if (!isFullscreen()) {
      unlockOrientation();
    }
  }

  document.addEventListener(
    "fullscreenchange",
    fullscreenChanged
  );

  document.addEventListener(
    "webkitfullscreenchange",
    fullscreenChanged
  );

  /* Close menus */
  document.addEventListener("click", () => {
    document
      .getElementById("qualityMenu")
      ?.classList.remove("show");

    speedMenu?.classList.remove("show");
    settingsMenu?.classList.remove("show");
  });

  [
    document.getElementById("qualityMenu"),
    speedMenu,
    settingsMenu
  ].forEach(menu => {
    menu?.addEventListener("click", e => {
      e.stopPropagation();
    });
  });

  /* Initial state */
  video.volume = 1;
  video.muted = false;
  video.playbackRate = currentSpeed;

  if (speedBtn) {
    speedBtn.textContent =
      currentSpeed + "x";
  }

  console.log(
    "XKiss Player loaded:",
    videoData.id,
    videoData.title
  );
});
