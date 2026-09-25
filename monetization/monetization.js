(() => {
  "use strict";

  const API_BASE = "https://xkiss.srourr-ali73.workers.dev";

  async function checkSystem() {
    const status = document.getElementById("system-status");

    try {
      const response = await fetch(API_BASE + "/api/health", {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();

      if (!response.ok) throw new Error("Worker unavailable.");

      const online = data.status === "online";
      status.innerHTML = "<span></span>" + (online ? "Core online" : "Core unavailable");

      const dot = status.querySelector("span");
      if (dot) dot.style.background = online ? "#4bd27a" : "#d66";
    } catch {
      status.innerHTML = "<span></span>Core unavailable";
      const dot = status.querySelector("span");
      if (dot) dot.style.background = "#d66";
    }
  }

  window.addEventListener("DOMContentLoaded", checkSystem);
})();