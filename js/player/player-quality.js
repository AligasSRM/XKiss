(function () {
  "use strict";

  const QUALITY = ["340p", "460p", "720p", "1080p"];

  function init() {
    const video = document.getElementById("video");
    const videoSource = document.getElementById("videoSource");
    const qualityBtn = document.getElementById("qualityBtn");
    const qualityMenu = document.getElementById("qualityMenu");
    const currentQuality = document.getElementById("currentQuality");

    if (!video || !videoSource) {
      console.error("XKiss: Quality system elements not found.");
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

    if (!videoData) {
      console.error("XKiss: Video data not found.");
      return;
    }

    const sources = {
      "340p": videoData.sources?.["340p"] || "",
      "460p": videoData.sources?.["460p"] || "",
      "720p": videoData.sources?.["720p"] || "",
      "1080p": videoData.sources?.["1080p"] || ""
    };

    let currentQualityValue =
      QUALITY.includes(videoData.quality?.default)
        ? videoData.quality.default
        : "720p";

    if (!sources[currentQualityValue]) {
      const firstAvailable = QUALITY.find(q => sources[q]);

      if (firstAvailable) {
        currentQualityValue = firstAvailable;
      }
    }

    function updateQualityDisplay() {
      if (qualityBtn) {
        qualityBtn.textContent = currentQualityValue;
      }

      if (currentQuality) {
        currentQuality.textContent = currentQualityValue;
      }
    }

    function loadQuality(quality, autoPlay = false) {
      if (!QUALITY.includes(quality)) return;

      const source = sources[quality];

      if (!source) {
        alert(quality + " is not configured yet.");
        return;
      }

      const wasPlaying = autoPlay || !video.paused;
      const position = video.currentTime || 0;

      currentQualityValue = quality;
      updateQualityDisplay();

      videoSource.src = source;
      video.load();

      video.addEventListener("loadedmetadata", function restore() {
        video.removeEventListener("loadedmetadata", restore);

        if (
          Number.isFinite(position) &&
          position < video.duration
        ) {
          video.currentTime = position;
        }

        if (wasPlaying) {
          video.play().catch(() => {});
        }
      });
    }

    updateQualityDisplay();
    loadQuality(currentQualityValue);

    if (qualityBtn && qualityMenu) {
      qualityBtn.addEventListener("click", e => {
        e.stopPropagation();

        qualityMenu.classList.toggle("show");

        document
          .getElementById("speedMenu")
          ?.classList.remove("show");

        document
          .getElementById("settingsMenu")
          ?.classList.remove("show");
      });
    }

    qualityMenu?.querySelectorAll("[data-quality]").forEach(btn => {
      btn.addEventListener("click", () => {
        loadQuality(
          btn.dataset.quality,
          !video.paused
        );

        qualityMenu.classList.remove("show");
      });
    });

    console.log(
      "XKiss Player Quality loaded:",
      currentQualityValue
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
