document.addEventListener("xkiss:videos-ready", () => {
  "use strict";

  const API = window.XKissVideos;
  const grid = document.getElementById("videos-grid");
  const emptyState = document.getElementById("videos-empty");
  const resultCount = document.getElementById("video-result-count");

  if (!API || !grid || !emptyState || !resultCount) {
    console.error("XKiss Videos: render UI could not initialize.");
    return;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getInitial(value) {
    const text = String(value || "X").trim();
    return text ? text.charAt(0).toUpperCase() : "X";
  }

  function render() {
    const { filteredVideos } = API.getState();

    grid.innerHTML = filteredVideos.map(video => {
      const tags = (video.tags || [])
        .slice(0, 5)
        .map(tag => `<span>${escapeHtml(tag)}</span>`)
        .join("");

      const quality = video.quality?.default ||
        (video.sources?.["1080p"] ? "1080p" :
        video.sources?.["720p"] ? "720p" :
        video.sources?.["460p"] ? "460p" :
        video.sources?.["340p"] ? "340p" : "—");

      const views = Number(video.statistics?.views ?? video.views ?? 0);

      return `
        <article class="video-card">
          <div class="video-thumb">
            <div>
              <div class="thumb-brand-x">X</div>
              <div class="thumb-brand-kiss">kiss</div>
            </div>
            <button class="play-circle" type="button" data-video-id="${escapeHtml(video.id)}" aria-label="Play ${escapeHtml(video.title)}">▶</button>
            <div class="thumb-quality">${escapeHtml(quality)}</div>
          </div>
          <div class="video-info">
            <div class="video-title">${escapeHtml(video.title)}</div>
            <div class="video-creator">
              <div class="creator-avatar">${getInitial(video.creator)}</div>
              <div class="creator-name">${escapeHtml(video.creator || "XKiss Creator")}</div>
            </div>
            <div class="video-meta">${escapeHtml(video.duration || "—")} · ${views.toLocaleString()} views</div>
            <div class="video-tags">${tags}</div>
            <button class="watch-btn" type="button" data-video-id="${escapeHtml(video.id)}">Watch Now</button>
          </div>
        </article>
      `;
    }).join("");

    resultCount.textContent = `${filteredVideos.length} ${filteredVideos.length === 1 ? "video" : "videos"}`;
    emptyState.hidden = filteredVideos.length !== 0;
    document.dispatchEvent(new CustomEvent("xkiss:videos-rendered"));
  }

  render();
  document.addEventListener("xkiss:videos-filtered", render);
});
