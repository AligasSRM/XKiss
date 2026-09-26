import { createXKissModuleHealth } from "./xkiss-module-health-core.js";

export function runXKissModuleHealthSelfCheck() {
  const modules = { base: { state: "active" } };
  const core = {
    moduleLifecycle: {
      getStatus(name) { return name ? modules[name] || null : modules; },
      deactivate(name) { modules[name].state = "inactive"; return { ok: true }; }
    },
    moduleContracts: {
      has(name) { return name === "base"; },
      get() { return { base: { name: "base" } }; }
    },
    registerModule() {}
  };
  const health = createXKissModuleHealth(core);
  const scan = health.scan();
  const healthy = health.get("base");
  const invalid = health.report({ module: "base", status: "BROKEN", severity: "HIGH", timestamp: Date.now() });
  const custom = health.report({ module: "base", status: "FAULT", severity: "HIGH", timestamp: Date.now() });
  const faultState = health.get("base");
  const locked = health.lock("base", "self-test");
  const final = health.getHealth();
  const checks = {
    stage: health.stage === "15.28",
    scan: scan.base?.status === "HEALTHY",
    healthyReport: healthy?.status === "HEALTHY",
    invalidRejected: invalid.ok === false,
    faultAccepted: custom.ok === true && faultState?.status === "FAULT",
    lock: locked.ok === true && health.get("base")?.status === "LOCKED",
    healthSummary: final.status === "WARNING" && final.locked === 1
  };
  return { ok: Object.values(checks).every(Boolean), stage: "15.28", test: "Module Health & Fault Detection self-check", checks };
}
