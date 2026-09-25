(function () {
  "use strict";

  const DEFAULT_VIDEO_ID = "video-001";

  function getVideoId() {
    const params = new URLSearchParams(location.search);
    return params.get("id") || DEFAULT_VIDEO_ID;
  }

  function getVideoData(videoId) {
    if (typeof getXKissVideo === "function") {
      return (
        getXKissVideo(videoId) ||
        getXKissVideo(DEFAULT_VIDEO_ID)
      );
    }

    if (typeof XKISS_VIDEOS !== "undefined") {
      return (
        XKISS_VIDEOS[videoId] ||
        XKISS_VIDEOS[DEFAULT_VIDEO_ID] ||
        null
      );
    }

    return null;
  }

  function getPlayerElements() {
    return {
      video: document.getElementById("video"),
      player: document.getElementById("player"),
      source: document.getElementById("videoSource")
    };
  }

  function getInitialState(videoData) {
    const playerData = videoData?.player || {};

    return {
      autoplay: Boolean(playerData.autoplay),
      muted: Boolean(playerData.muted),
      loop: Boolean(playerData.loop),
      preload: playerData.preload || "metadata",
      defaultSpeed:
        Number.isFinite(Number(playerData.defaultSpeed))
          ? Number(playerData.defaultSpeed)
          : 1,
      fullscreen: playerData.fullscreen !== false,
      pictureInPicture:
        playerData.pictureInPicture !== false,
      captions: playerData.captions !== false
    };
  }

  function applyInitialState(video, state) {
    if (!video) return;

    video.autoplay = state.autoplay;
    video.muted = state.muted;
    video.loop = state.loop;
    video.preload = state.preload;
    video.playbackRate = state.defaultSpeed;

    if (state.autoplay) {
      video.setAttribute("autoplay", "");
    } else {
      video.removeAttribute("autoplay");
    }

    if (state.muted) {
      video.setAttribute("muted", "");
    } else {
      video.removeAttribute("muted");
    }

    if (state.loop) {
      video.setAttribute("loop", "");
    } else {
      video.removeAttribute("loop");
    }
  }

  function init() {
    const elements = getPlayerElements();

    if (!elements.video) {
      console.error("XKiss: Core video element not found.");
      return;
    }

    const videoId = getVideoId();
    const videoData = getVideoData(videoId);

    if (!videoData) {
      console.error(
        "XKiss: Core video data not found:",
        videoId
      );
      return;
    }

    const state = getInitialState(videoData);

    applyInitialState(elements.video, state);

    window.XKissPlayerCore = {
      videoId,
      videoData,
      state,
      elements,
      getVideoId,
      getVideoData,
      getPlayerElements,
      getInitialState
    };

    console.log(
      "XKiss Player Core loaded:",
      videoId
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
