(() => {
  "use strict";

  function bindLiveActions() {
    document.querySelectorAll("[data-live-open]").forEach(button => {
      if (button.dataset.liveBound === "true") return;
      button.dataset.liveBound = "true";

      button.addEventListener("click", () => {
        const roomId = button.dataset.liveOpen;
        if (!roomId) return;
        window.location.href = "live-room.html?id=" + encodeURIComponent(roomId);
      });
    });

    document.querySelectorAll("[data-live-profile]").forEach(button => {
      if (button.dataset.liveProfileBound === "true") return;
      button.dataset.liveProfileBound = "true";

      button.addEventListener("click", () => {
        const creatorId = button.dataset.liveProfile;
        if (!creatorId) return;
        window.location.href = "creator.html?id=" + encodeURIComponent(creatorId);
      });
    });

    document.querySelectorAll("[data-live-reminder]").forEach(button => {
      if (button.dataset.liveReminderBound === "true") return;
      button.dataset.liveReminderBound = "true";

      button.addEventListener("click", () => {
        button.textContent = "Reminder Set";
        button.disabled = true;
      });
    });
  }

  document.addEventListener("xkiss:live-ready", bindLiveActions);
  window.addEventListener("DOMContentLoaded", bindLiveActions);

  window.XKissLiveNavigation = { bindLiveActions };
})();
