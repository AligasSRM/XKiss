(() => {
  "use strict";

  const API_BASE = "https://xkiss.srourr-ali73.workers.dev";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  async function loadLibrary() {
    const count = document.getElementById("library-count");
    const grid = document.getElementById("library-grid");
    const empty = document.getElementById("library-empty");

    try {
      const response = await fetch(API_BASE + "/api/creator/videos", {
        headers: {"Accept":"application/json"}
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Library request failed.");

      const videos = Array.isArray(data.videos) ? data.videos : [];
      count.textContent = videos.length + " video" + (videos.length === 1 ? "" : "s");

      if (!videos.length) {
        grid.innerHTML = "";
        empty.hidden = false;
        return;
      }

      empty.hidden = true;
      grid.innerHTML = videos.map(video => (
        '<article class="video-card">' +
          '<div class="thumb">X</div>' +
          '<div class="video-body">' +
            '<div class="video-title">' + escapeHtml(video.title) + '</div>' +
            '<div class="video-meta">' +
              escapeHtml(video.category || "Uncategorized") + '<br>' +
              escapeHtml(video.visibility || "private") + ' · ' +
              escapeHtml(video.downloadPolicy || "disabled") +
            '</div>' +
            '<div class="badges">' +
              '<span class="badge ready">' + escapeHtml(video.status || "Ready") + '</span>' +
              '<span class="badge">' + escapeHtml(video.storage || "Storage pending") + '</span>' +
            '</div>' +
          '</div>' +
        '</article>'
      )).join("");
    } catch (error) {
      count.textContent = "Library unavailable";
      grid.innerHTML = "";
      empty.hidden = false;
    }
  }

  window.addEventListener("DOMContentLoaded", loadLibrary);
})();
