(() => {
  "use strict";

  const API_BASE = "https://xkiss.srourr-ali73.workers.dev";

  function setSystemStatus(online) {
    const status = document.getElementById("system-status");
    status.innerHTML = "<span></span>" + (online ? "Core online" : "Core unavailable");
    const dot = status.querySelector("span");
    if (dot) dot.style.background = online ? "#4bd27a" : "#d66";
  }

  async function checkSystem() {
    try {
      const response = await fetch(API_BASE + "/api/health", {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Worker unavailable.");
      setSystemStatus(data.status === "online");
    } catch {
      setSystemStatus(false);
    }
  }

  async function loadMonetizationRules() {
    const message = document.getElementById("rules-message");

    try {
      const response = await fetch(API_BASE + "/api/monetization/status", {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error("Monetization status unavailable.");
      }

      document.getElementById("rule-version").textContent = data.version || "—";
      document.getElementById("rule-model").textContent = data.model || "—";
      document.getElementById("rule-state").textContent = data.enabled ? "Active" : "Draft";
      message.textContent = data.message || "Monetization rules are prepared but not active.";

      const state = document.getElementById("rule-state");
      state.classList.toggle("active", Boolean(data.enabled));
    } catch {
      message.textContent = "Server-side monetization rules could not be loaded.";
      document.getElementById("rule-state").textContent = "Unavailable";
    }

    try {
      const response = await fetch(API_BASE + "/api/monetization/rules", {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();

      if (response.ok && data.ok && data.rules) {
        document.getElementById("rule-currency").textContent = data.rules.currency || "—";
      }
    } catch {}
  }

  window.addEventListener("DOMContentLoaded", () => {
    checkSystem();
    loadMonetizationRules();
  });
})();