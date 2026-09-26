import { validateXKissModuleSecurityRules } from "./xkiss-module-security-rules.js";

export function createXKissModuleSecurity(core) {
  if (!core || !core.moduleLifecycle || !core.moduleContracts) {
    throw new Error("XKiss Module Security requires lifecycle and contract controls.");
  }

  const rules = validateXKissModuleSecurityRules();
  const events = [];
  const rateBuckets = new Map();
  let integritySnapshot = null;

  function event(type, detail = {}) {
    const record = Object.freeze({
      id: "SEC-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      type: rules.safeText(type, 80),
      detail: Object.freeze({
        module: rules.safeText(detail.module, 80),
        action: rules.safeText(detail.action, 80),
        reason: rules.safeText(detail.reason, 160)
      }),
      time: Date.now()
    });
    events.push(record);
    if (events.length > 100) events.shift();
    return record;
  }

  function authorize(action, moduleName, requiredCapability = null) {
    if (!rules.validAction(action)) {
      event("authorization-denied", { module: moduleName, action, reason: "invalid-action" });
      return { ok: false, error: "invalid-action" };
    }

    if (!rules.validModuleName(moduleName)) {
      event("authorization-denied", { module: moduleName, action, reason: "invalid-module" });
      return { ok: false, error: "invalid-module" };
    }

    const status = core.moduleLifecycle.getStatus(moduleName);
    const contract = core.moduleContracts.get(moduleName);

    if (!status || !contract) {
      event("authorization-denied", { module: moduleName, action, reason: "unknown-module" });
      return { ok: false, error: "unknown-module" };
    }

    if (status.state !== "active" && action !== "diagnostic") {
      event("authorization-denied", { module: moduleName, action, reason: "module-not-active" });
      return { ok: false, error: "module-not-active" };
    }

    if (requiredCapability && !contract.capabilities.includes(requiredCapability)) {
      event("authorization-denied", { module: moduleName, action, reason: "capability-denied" });
      return { ok: false, error: "capability-denied" };
    }

    return { ok: true, module: moduleName, action };
  }

  function validateInput(value, options = {}) {
    const type = options.type || "string";
    const maxLength = Number.isInteger(options.maxLength) ? options.maxLength : 2000;

    if (type === "string") {
      if (typeof value !== "string") return { ok: false, error: "invalid-type" };
      if (value.length > maxLength) return { ok: false, error: "input-too-large" };
      if (/[
\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F
]/.test(value)) return { ok: false, error: "control-character" };
      return { ok: true, value };
    }

    if (type === "number") {
      if (!Number.isFinite(value)) return { ok: false, error: "invalid-number" };
      return { ok: true, value };
    }

    if (type === "object") {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { ok: false, error: "invalid-object" };
      }
      return { ok: true, value };
    }

    return { ok: false, error: "unsupported-validation-type" };
  }

  function allowRate(key, limit = rules.defaultRateLimit.limit, windowMs = rules.defaultRateLimit.windowMs) {
    const cleanKey = rules.safeText(key, 120);
    if (!cleanKey) return { ok: false, error: "invalid-rate-key" };

    const now = Date.now();
    const current = rateBuckets.get(cleanKey) || { start: now, count: 0 };

    if (now - current.start >= windowMs) {
      current.start = now;
      current.count = 0;
    }

    current.count += 1;
    rateBuckets.set(cleanKey, current);

    if (current.count > limit) {
      event("rate-limit-blocked", { reason: cleanKey });
      return { ok: false, error: "rate-limit-exceeded", retryAfterMs: Math.max(0, windowMs - (now - current.start)) };
    }

    return { ok: true, remaining: Math.max(0, limit - current.count) };
  }

  function captureIntegritySnapshot() {
    const lifecycle = core.moduleLifecycle.getStatus();
    const contracts = core.moduleContracts.list ? core.moduleContracts.list() : {};
    integritySnapshot = JSON.stringify({ lifecycle, contracts });
    return { ok: true, snapshot: integritySnapshot };
  }

  function checkIntegrity() {
    if (integritySnapshot === null) {
      captureIntegritySnapshot();
      return { ok: true, changed: false };
    }

    const lifecycle = core.moduleLifecycle.getStatus();
    const contracts = core.moduleContracts.list ? core.moduleContracts.list() : {};
    const current = JSON.stringify({ lifecycle, contracts });
    const changed = current !== integritySnapshot;

    if (changed) {
      event("integrity-change-detected", { reason: "runtime-state-changed" });
    }

    return { ok: !changed, changed };
  }

  function lockModule(moduleName, reason = "security-fault") {
    if (!rules.validModuleName(moduleName)) return { ok: false, error: "invalid-module" };

    const status = core.moduleLifecycle.getStatus(moduleName);
    if (!status) return { ok: false, error: "module-not-found" };

    let deactivated = false;
    if (status.state === "active") {
      const result = core.moduleLifecycle.deactivate(moduleName);
      if (!result.ok) return { ok: false, error: "deactivation-failed" };
      deactivated = true;
    }

    event("module-locked", { module: moduleName, reason });
    return { ok: true, module: moduleName, locked: true, deactivated };
  }

  function getHealth() {
    const statuses = core.moduleLifecycle.getStatus();
    const values = Object.values(statuses);
    const faultEvents = events.filter(e =>
      ["authorization-denied", "rate-limit-blocked", "integrity-change-detected", "module-locked"].includes(e.type)
    );

    return {
      stage: "15.27",
      status: faultEvents.length ? "warning" : "healthy",
      modules: {
        total: values.length,
        active: values.filter(v => v.state === "active").length,
        inactive: values.filter(v => v.state === "inactive").length,
        destroyed: values.filter(v => v.state === "destroyed").length
      },
      securityEvents: faultEvents.length
    };
  }

  function getEvents() {
    return events.map(item => ({
      id: item.id,
      type: item.type,
      detail: { ...item.detail },
      time: item.time
    }));
  }

  return Object.freeze({
    stage: "15.27",
    rules,
    authorize,
    validateInput,
    allowRate,
    captureIntegritySnapshot,
    checkIntegrity,
    lockModule,
    getHealth,
    getEvents
  });
}
