(() => {
  "use strict";

  const state = { liveRooms: [], upcoming: [] };

  function getLiveData() {
    return window.XKISS_LIVE || { liveRooms: [], upcoming: [] };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderLiveRooms() {
    const grid = document.getElementById("live-now-grid");
    const empty = document.getElementById("live-empty");
    const count = document.getElementById("live-result-count");
    if (!grid || !empty || !count) return;

    grid.innerHTML = "";

    if (!state.liveRooms.length) {
      empty.hidden = false;
      count.textContent = "0 live rooms";
      return;
    }

    empty.hidden = true;
    count.textContent = state.liveRooms.length + " live room" + (state.liveRooms.length === 1 ? "" : "s");

    state.liveRooms.forEach(room => {
      const card = document.createElement("article");
      card.className = "live-card";
      card.dataset.liveRoomId = room.id;
      card.innerHTML =
        '<div class="live-room">' +
          '<div class="live-room-brand">X</div>' +
          '<div class="live-badge"><span class="status-dot"></span> LIVE</div>' +
          '<div class="viewer-count">' + Number(room.viewers || 0).toLocaleString() + ' watching</div>' +
        '</div>' +
        '<div class="live-info">' +
          '<div class="live-title">' + escapeHtml(room.title) + '</div>' +
          '<div class="live-creator">' + escapeHtml(room.creator) + '</div>' +
          '<div class="live-actions">' +
            '<button class="primary" type="button" data-live-open="' + escapeHtml(room.id) + '">Join Live</button>' +
            '<button type="button" data-live-profile="' + escapeHtml(room.creatorId || "") + '">Creator</button>' +
          '</div>' +
        '</div>';
      grid.appendChild(card);
    });
  }

  function renderUpcoming() {
    const grid = document.getElementById("live-upcoming-grid");
    if (!grid) return;

    grid.innerHTML = "";

    state.upcoming.forEach(item => {
      const card = document.createElement("article");
      card.className = "upcoming-card";
      card.dataset.upcomingId = item.id;
      card.innerHTML =
        '<div class="upcoming-date">' + escapeHtml(item.dateLabel) + '</div>' +
        '<div class="upcoming-title">' + escapeHtml(item.title) + '</div>' +
        '<div class="upcoming-creator">' + escapeHtml(item.creator) + '</div>' +
        '<button class="reminder-btn" type="button" data-live-reminder="' + escapeHtml(item.id) + '">Set Reminder</button>';
      grid.appendChild(card);
    });
  }

  function initialize() {
    const data = getLiveData();

    state.liveRooms = Array.isArray(data.liveRooms)
      ? data.liveRooms.filter(room => room && room.id)
      : [];

    state.upcoming = Array.isArray(data.upcoming)
      ? data.upcoming.filter(item => item && item.id)
      : [];

    renderLiveRooms();
    renderUpcoming();

    window.XKissLive = {
      getState: () => ({
        liveRooms: [...state.liveRooms],
        upcoming: [...state.upcoming]
      }),
      renderLiveRooms,
      renderUpcoming
    };

    document.dispatchEvent(new CustomEvent("xkiss:live-ready"));
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
