(() => {
  "use strict";

  function getRoomId() {
    return new URLSearchParams(window.location.search).get("id") || "";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initialize() {
    const roomId = getRoomId();
    const rooms = Array.isArray(window.XKISS_LIVE?.liveRooms)
      ? window.XKISS_LIVE.liveRooms
      : [];
    const room = rooms.find(item => item && item.id === roomId);

    const title = document.getElementById("room-title");
    const status = document.getElementById("room-status");
    const creator = document.getElementById("room-creator");
    const id = document.getElementById("room-id");
    const state = document.getElementById("room-state");
    const viewers = document.getElementById("room-viewers");

    if (!room) {
      if (title) title.textContent = "Live Room";
      if (status) status.textContent = "This live room is not currently available.";
      if (creator) creator.textContent = "XKiss Live";
      if (id) id.textContent = roomId || "—";
      if (state) state.textContent = "Unavailable";
      if (viewers) viewers.textContent = "0";
      return;
    }

    if (title) title.textContent = room.title || "Live Room";
    if (status) status.textContent = "Live room shell loaded. Real-time stream provider is not connected.";
    if (creator) creator.textContent = room.creator || "XKiss Creator";
    if (id) id.textContent = escapeHtml(room.id);
    if (state) state.textContent = "Ready";
    if (viewers) viewers.textContent = Number(room.viewers || 0).toLocaleString();
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
