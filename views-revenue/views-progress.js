(() => {
  "use strict";

  const API_BASE = "https://xkiss.srourr-ali73.workers.dev";
  const REPORT_INTERVAL_SECONDS = 10;

  async function sendWatchProgress(event) {
    try {
      const response = await fetch(
        API_BASE + "/api/views/event/pipeline-check",
        {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(event)
        }
      );

      const data = await response.json();
      console.log("XKiss Watch Progress:", data);
    } catch (error) {
      console.error("XKiss: Watch progress check failed:", error);
    }
  }

  function createProgressEvent(videoData, video) {
    const duration = Number(video.duration);
    const currentTime = Number(video.currentTime);

    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !Number.isFinite(currentTime) ||
      currentTime < 0
    ) {
      return null;
    }

    const watchPercent = Math.min(
      100,
      Math.max(0, (currentTime / duration) * 100)
    );

    return {
      eventId: crypto.randomUUID(),
      eventType: "view",
      videoId: String(videoData.id || ""),
      creatorId: String(videoData.creatorId || ""),
      playbackSignal: "playing",
      viewerSessionId: window.XKissViews
        ? window.XKissViews.getViewerSessionId()
        : "",
      watchSeconds: currentTime,
      watchPercent,
      videoDurationSeconds: duration,
      occurredAt: new Date().toISOString()
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const state = window.XKissPlayer;

    if (
      !state ||
      !state.video ||
      !state.data
    ) {
      console.error("XKiss: Watch progress module could not find player state.");
      return;
    }

    const video = state.video;
    const videoData = state.data;

    let lastReportedSeconds = -REPORT_INTERVAL_SECONDS;
    let started = false;

    video.addEventListener("playing", () => {
      started = true;
    });

    video.addEventListener("timeupdate", () => {
      if (!started) {
        return;
      }

      const currentTime = Number(video.currentTime);

      if (
        !Number.isFinite(currentTime) ||
        currentTime < 0 ||
        currentTime - lastReportedSeconds < REPORT_INTERVAL_SECONDS
      ) {
        return;
      }

      const event = createProgressEvent(videoData, video);

      if (!event) {
        return;
      }

      lastReportedSeconds = currentTime;
      sendWatchProgress(event);
    });

    video.addEventListener("ended", () => {
      const event = createProgressEvent(videoData, video);

      if (event) {
        sendWatchProgress(event);
      }
    });
  });
})();
