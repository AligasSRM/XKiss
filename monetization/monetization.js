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

  async function loadEligibilityRules() {
    try {
      const response = await fetch(API_BASE + "/api/monetization/eligibility/rules", {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();

      if (!response.ok || !data.ok || !data.rules) {
        throw new Error("Eligibility rules unavailable.");
      }

      const rules = data.rules;
      document.getElementById("eligibility-age").textContent = rules.minimumAge + "+";
      document.getElementById("eligibility-verification").textContent =
        rules.verificationRequired ? "Required" : "Not required";
      document.getElementById("eligibility-policy").textContent =
        rules.policyAcceptanceRequired ? "Required" : "Not required";
      document.getElementById("eligibility-status").textContent =
        rules.monetizationEnabled ? "Active" : "Not active";
      document.getElementById("eligibility-message").textContent =
        rules.monetizationEnabled
          ? "Eligibility checks are active."
          : "Eligibility rules are prepared and waiting for monetization activation.";
    } catch {
      document.getElementById("eligibility-message").textContent =
        "Creator eligibility rules could not be loaded.";
      document.getElementById("eligibility-status").textContent = "Unavailable";
    }
  }

  async function loadPolicyRules() {
    try {
      const response = await fetch(API_BASE + "/api/monetization/policy/rules", {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();

      if (!response.ok || !data.ok || !data.rules) {
        throw new Error("Policy rules unavailable.");
      }

      const rules = data.rules;
      document.getElementById("policy-acceptance").textContent =
        rules.policyAcceptanceRequired ? "Required" : "Not required";
      document.getElementById("policy-verification").textContent =
        rules.verificationRequired ? "Required" : "Not required";
      document.getElementById("policy-fraud").textContent =
        rules.fraudReview ? "Enabled" : "Disabled";
      document.getElementById("policy-audit").textContent =
        rules.auditTrailRequired ? "Required" : "Not required";
      document.getElementById("policy-message").textContent =
        "Policy controls are prepared and remain server-side.";
    } catch {
      document.getElementById("policy-message").textContent =
        "Monetization policy controls could not be loaded.";
    }
  }

  async function loadActivationRules() {
    try {
      const response = await fetch(API_BASE + "/api/monetization/activation/rules", {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();

      if (!response.ok || !data.ok || !data.rules) {
        throw new Error("Activation rules unavailable.");
      }

      const rules = data.rules;
      document.getElementById("activation-status").textContent =
        rules.enabled ? "Ready" : "Not active";
      document.getElementById("activation-message").textContent =
        rules.enabled
          ? "Creator activation requirements are enabled."
          : "Activation flow is prepared but monetization is not active yet.";
    } catch {
      document.getElementById("activation-status").textContent = "Unavailable";
      document.getElementById("activation-message").textContent =
        "Creator activation rules could not be loaded.";
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
    loadEligibilityRules();
    loadPolicyRules();
    loadActivationRules();
  });
})();