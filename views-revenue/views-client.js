(() => {
  "use strict";

  const API_BASE = "https://xkiss.srourr-ali73.workers.dev";
  const SESSION_KEY = "xkiss_viewer_session_id";

  function getViewerSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);

    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }

    return id;
  }

  function createViewEvent(videoId, creatorId) {
    return {
      eventId: crypto.randomUUID(),
      eventType: "view",
      videoId: String(videoId || ""),
      creatorId: String(creatorId || ""),
      playbackSignal: "playing",
      viewerSessionId: getViewerSessionId(),
      occurredAt: new Date().toISOString()
    };
  }

  async function validateViewEvent(event) {
    const response = await fetch(API_BASE + "/api/views/event/validate", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(event)
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = {
        ok: false,
        message: "Invalid view validation response."
      };
    }

    if (!response.ok) {
      throw new Error(data.message || "View validation failed.");
    }

    return data;
  }

  window.XKissViews = {
    getViewerSessionId,
    createViewEvent,
    validateViewEvent
  };
})();
