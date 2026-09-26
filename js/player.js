document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const player = document.getElementById("player");
  const video = document.getElementById("video");

  const videoTitle = document.getElementById("videoTitle");
  const videoDuration = document.getElementById("videoDuration");
  const creatorName = document.getElementById("creatorName");
  const videoTags = document.getElementById("videoTags");
  const views = document.getElementById("views");

  const settingsBtn = document.getElementById("settingsBtn");
  const settingsMenu = document.getElementById("settingsMenu");
  const ccBtn = document.getElementById("ccBtn");
  const resetSpeedBtn = document.getElementById("resetSpeedBtn");

  if (!player || !video) {
    console.error("XKiss: Player elements not found.");
    return;
  }

  /*
   * XKiss Module Lifecycle Control — 15.24
   * Player Core remains the single lifecycle authority.
   */
  import("../player/runtime/xkiss-module-lifecycle-integration.js")
    .then(({ installXKissModuleLifecycle }) => {
      const result = installXKissModuleLifecycle(window.XKissPlayerCore);
      if (!result.ok) {
        console.error("XKiss: Module lifecycle installation failed:", result.error);
        return;
      }
      console.log("XKiss Module Lifecycle 15.24 ready.");
    })
    .catch(error => {
      console.error("XKiss: Module lifecycle load failed:", error);
    });

  /*
   * XKiss Module Contract Registry — 15.25
   * Player Core remains the single contract authority.
   */
  import("../player/runtime/xkiss-module-contract-integration.js")
    .then(({ installXKissModuleContractRegistry }) => {
      const result = installXKissModuleContractRegistry(window.XKissPlayerCore);
      if (!result.ok) {
        console.error("XKiss: Module contract registry installation failed:", result.error);
        return;
      }
      console.log("XKiss Module Contract Registry 15.25 ready.");
    })
    .catch(error => {
      console.error("XKiss: Module contract registry load failed:", error);
    });

  /*
   * Video ID
   */

  const params = new URLSearchParams(location.search);
  const requestedId = params.get("id") || "video-001";

  /*
   * Video data
   */

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

    console.error(
      "XKiss: Video data not found:",
      requestedId
    );

    return;
  }

  /*
   * Basic video information
   */

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

  /*
   * Views
   */

  if (views) {
    const count =
      Number.isFinite(
        Number(videoData.statistics?.views)
      )
        ? Number(videoData.statistics.views)
        : Number(videoData.views || 0);

    views.textContent = count;
  }

  /*
   * Tags
   */

  if (videoTags) {
    videoTags.innerHTML = "";

    if (Array.isArray(videoData.tags)) {
      videoData.tags.forEach(tag => {
        const element = document.createElement("span");
        const text = String(tag);

        element.textContent =
          text.startsWith("#")
            ? text
            : "#" + text;

        videoTags.appendChild(element);
      });
    }
  }

  /*
   * Settings
   */

  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener("click", e => {
      e.stopPropagation();

      settingsMenu.classList.toggle("show");

      document
        .getElementById("qualityMenu")
        ?.classList.remove("show");

      document
        .getElementById("speedMenu")
        ?.classList.remove("show");
    });
  }

  /*
   * Captions
   */

  ccBtn?.addEventListener("click", () => {
    if (videoData.captions?.available) {
      alert(
        "Caption tracks are available for integration."
      );
    } else {
      alert(
        "CC is ready for future subtitle integration."
      );
    }
  });

  /*
   * Reset playback speed
   */

  resetSpeedBtn?.addEventListener("click", () => {
    video.playbackRate = 1;

    const speedBtn =
      document.getElementById("speedBtn");

    if (speedBtn) {
      speedBtn.textContent = "1x";
    }

    settingsMenu?.classList.remove("show");
  });

  /*
   * Close menus
   */

  document.addEventListener("click", () => {
    document
      .getElementById("qualityMenu")
      ?.classList.remove("show");

    document
      .getElementById("speedMenu")
      ?.classList.remove("show");

    settingsMenu?.classList.remove("show");
  });

  [
    document.getElementById("qualityMenu"),
    document.getElementById("speedMenu"),
    settingsMenu
  ].forEach(menu => {
    menu?.addEventListener("click", e => {
      e.stopPropagation();
    });
  });

  /*
   * Views & Revenue — view event
   *
   * A view event is sent only after playback has genuinely started.
   * The Worker validates the event. It is not counted or persisted yet.
   */
  let viewEventSent = false;

  async function sendViewEventOnce() {
    if (viewEventSent || !window.XKissViews) {
      return;
    }

    viewEventSent = true;

    try {
      const event = window.XKissViews.createViewEvent(videoData.id, videoData.creatorId);
      const result = await window.XKissViews.validateViewEvent(event);

      console.log("XKiss View Event:", result);
    } catch (error) {
      viewEventSent = false;
      console.error("XKiss: View event failed:", error);
    }
  }

  video.addEventListener("error", () => {
    console.error("XKiss: Video runtime error:", {
      code: video.error?.code || null,
      message: video.error?.message || "",
      currentSrc: video.currentSrc || ""
    });
  });

  video.addEventListener("playing", sendViewEventOnce);

  /*
   * Public player state
   */

  window.XKissPlayer = {
    id: videoData.id,
    data: videoData,
    elements: {
      player,
      video
    }
  };

  console.log(
    "XKiss Player loaded:",
    videoData.id,
    videoData.title
  );
});
