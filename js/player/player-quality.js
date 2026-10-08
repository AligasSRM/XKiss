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
      videoData = getXKissVideo(requestedId) || getXKissVideo("video-001");
    } else if (typeof XKISS_VIDEOS !== "undefined") {
      videoData = XKISS_VIDEOS[requestedId] || XKISS_VIDEOS["video-001"];
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

    const adaptiveManifest = videoData.delivery?.hlsManifest || "";
    let currentQualityValue = videoData.quality?.default === "auto" ? "Auto" : "720p";
    let hls = null;

    function updateQualityDisplay(value = currentQualityValue) {
      currentQualityValue = value;
      if (qualityBtn) qualityBtn.textContent = value;
      if (currentQuality) currentQuality.textContent = value;
    }

    function preservePlayback() {
      return {
        playing: !video.paused,
        position: Number.isFinite(video.currentTime) ? video.currentTime : 0
      };
    }

    function loadProgressive(quality, autoPlay = false) {
      if (!QUALITY.includes(quality)) return;

      const source = sources[quality];
      if (!source) {
        alert(quality + " is not configured yet.");
        return;
      }

      if (hls) {
        hls.destroy();
        hls = null;
      }

      const state = preservePlayback();
      videoSource.src = source;
      videoSource.type = "video/mp4";
      video.load();

      updateQualityDisplay(quality);

      video.addEventListener("loadedmetadata", function restore() {
        video.removeEventListener("loadedmetadata", restore);
        if (state.position < video.duration) video.currentTime = state.position;
        if (autoPlay || state.playing) video.play().catch(() => {});
      });
    }

    function populateAdaptiveMenu() {
      if (!qualityMenu) return;
      qualityMenu.innerHTML = "";

      const auto = document.createElement("button");
      auto.type = "button";
      auto.dataset.quality = "auto";
      auto.textContent = "Auto";
      qualityMenu.appendChild(auto);

      if (hls && Array.isArray(hls.levels)) {
        const levels = hls.levels
          .map((level, index) => ({ index, height: Number(level.height) }))
          .filter(level => Number.isFinite(level.height) && level.height > 0)
          .sort((a, b) => a.height - b.height);

        const seen = new Set();
        levels.forEach(level => {
          const label = level.height + "p";
          if (seen.has(label)) return;
          seen.add(label);

          const button = document.createElement("button");
          button.type = "button";
          button.dataset.hlsLevel = String(level.index);
          button.textContent = label;
          qualityMenu.appendChild(button);
        });
      }

      QUALITY.forEach(q => {
        if (!sources[q]) return;
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.quality = q;
        button.textContent = q;
        qualityMenu.appendChild(button);
      });

      qualityMenu.querySelectorAll("[data-hls-level]").forEach(button => {
        button.addEventListener("click", () => {
          if (!hls) return;
          hls.currentLevel = Number(button.dataset.hlsLevel);
          updateQualityDisplay(button.textContent);
          qualityMenu.classList.remove("show");
        });
      });

      qualityMenu.querySelectorAll("[data-quality]").forEach(button => {
        button.addEventListener("click", () => {
          if (button.dataset.quality === "auto" && hls) {
            hls.currentLevel = -1;
            updateQualityDisplay("Auto");
            qualityMenu.classList.remove("show");
            return;
          }

          loadProgressive(button.dataset.quality, !video.paused);
          qualityMenu.classList.remove("show");
        });
      });
    }

    function loadAdaptive() {
      if (!adaptiveManifest) return false;

      const state = preservePlayback();

      if (window.Hls && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          capLevelToPlayerSize: true,
          startLevel: -1
        });

        hls.attachMedia(video);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(adaptiveManifest);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          hls.currentLevel = -1;
          populateAdaptiveMenu();
          updateQualityDisplay("Auto");

          if (state.position > 0 && Number.isFinite(state.position)) {
            try { video.currentTime = state.position; } catch (_) {}
          }

          if (state.playing) video.play().catch(() => {});
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          if (data && Number.isInteger(data.level) && hls.levels[data.level]) {
            updateQualityDisplay(
              Number.isFinite(hls.levels[data.level].height)
                ? hls.levels[data.level].height + "p"
                : "Auto"
            );
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!data || !data.fatal) return;
          console.error("XKiss HLS fatal error:", data);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        });

        return true;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        videoSource.src = adaptiveManifest;
        videoSource.type = "application/vnd.apple.mpegurl";
        video.load();
        updateQualityDisplay("Auto");
        if (state.playing) video.play().catch(() => {});
        return true;
      }

      return false;
    }

    updateQualityDisplay();

    const adaptiveStarted = loadAdaptive();

    if (!adaptiveStarted) {
      const defaultQuality = QUALITY.includes(videoData.quality?.default)
        ? videoData.quality.default
        : QUALITY.find(q => sources[q]);

      if (defaultQuality) loadProgressive(defaultQuality);
    }

    if (qualityBtn && qualityMenu) {
      qualityBtn.addEventListener("click", e => {
        e.stopPropagation();
        qualityMenu.classList.toggle("show");
        document.getElementById("speedMenu")?.classList.remove("show");
        document.getElementById("settingsMenu")?.classList.remove("show");
      });
    }

    if (adaptiveStarted) populateAdaptiveMenu();

    window.XKissPlayerCore?.registerModule("quality", currentQualityValue);
    console.log("XKiss Player Quality loaded:", currentQualityValue, adaptiveStarted ? "adaptive" : "progressive");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();