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
        window.location.href = "index.html#creators";
      });
    });

    document.querySelectorAll("[data-live-reminder]").forEach(button => {
      if (button.dataset.liveReminderBound === "true") return;
      button.dataset.liveReminderBound = "true";

      button.addEventListener("click", () => {
        button.textContent = "Reminder Set";
        button.disabled = true;
        try {
          const id = button.dataset.liveReminder;
          const reminders = JSON.parse(localStorage.getItem("xkiss_live_reminders") || "[]");
          if (id && !reminders.includes(id)) {
            reminders.push(id);
            localStorage.setItem("xkiss_live_reminders", JSON.stringify(reminders));
          }
        } catch (_) {}
      });
    });
  }

  document.addEventListener("xkiss:live-ready", bindLiveActions);
  window.addEventListener("DOMContentLoaded", bindLiveActions);

  window.XKissLiveNavigation = { bindLiveActions };
})();
