import { XKISS_MODULE_HEALTH_RULES, validateXKissModuleHealthReport, severityForStatus } from "./xkiss-module-health-rules.js";

export function createXKissModuleHealth(core) {
  if (!core || !core.moduleLifecycle || !core.moduleContracts) {
    throw new Error("XKiss Module Health requires Core lifecycle and contracts.");
  }

  const lifecycle = core.moduleLifecycle;
  const contracts = core.moduleContracts;
  const reports = new Map();
  const events = [];

  function emit(type, detail = {}) {
    const event = { id: "health-" + (events.length + 1), type, timestamp: Date.now(), detail };
    events.push(event);
    if (events.length > 100) events.shift();
    return event;
  }

  function deriveStatus(name, record) {
    if (!record) return "OFFLINE";
    if (record.state === "destroyed") return "OFFLINE";
    if (record.state === "active") return "HEALTHY";
    if (record.state === "inactive") return "WARNING";
    if (record.state === "initialized") return "WARNING";
    if (record.state === "registered") return "WARNING";
    return "FAULT";
  }

  function scan() {
    const statuses = lifecycle.getStatus();
    const coreStatuses = typeof core.getModuleStatus === "function" ? core.getModuleStatus() : {};
    const names = new Set([...Object.keys(statuses), ...Object.keys(coreStatuses), ...Object.keys(contracts.get())]);
    const result = {};
    for (const name of names) {
      const record = statuses[name] || coreStatuses[name] || null;
      const existing = reports.get(name);
      const status = existing?.status === "LOCKED" ? "LOCKED" : deriveStatus(name, record);
      const report = { module: name, status, severity: severityForStatus(status), timestamp: Date.now() };
      reports.set(name, report);
      result[name] = { ...report };
    }
    return result;
  }

  function report(report) {
    const validation = validateXKissModuleHealthReport(report);
    if (!validation.ok) return { ok: false, ...validation };
    reports.set(report.module, { ...report });
    emit("health-report", { module: report.module, status: report.status, severity: report.severity });
    return { ok: true, report: { ...report } };
  }

  function lock(name, reason = "health-fault") {
    if (!contracts.has(name)) return { ok: false, error: "unknown-module" };
    reports.set(name, { module: name, status: "LOCKED", severity: "HIGH", timestamp: Date.now(), reason: String(reason).slice(0, 200) });
    try {
      const status = lifecycle.getStatus(name);
      if (status?.state === "active") lifecycle.deactivate(name);
    } catch (_) {}
    emit("module-locked", { module: name, reason: String(reason).slice(0, 200) });
    return { ok: true, module: name, locked: true };
  }

  function get(name) {
    if (name) return reports.get(name) ? { ...reports.get(name) } : null;
    return Object.fromEntries([...reports].map(([key, value]) => [key, { ...value }]));
  }

  function getFaults() {
    return Object.values(get()).filter(item => item.status === "FAULT" || item.status === "OFFLINE" || item.status === "LOCKED");
  }

  function getHealth() {
    const all = Object.values(get());
    const faults = getFaults();
    return {
      stage: "15.28",
      status: faults.length ? "WARNING" : "HEALTHY",
      modules: all.length,
      healthy: all.filter(item => item.status === "HEALTHY").length,
      warnings: all.filter(item => item.status === "WARNING").length,
      faults: faults.length,
      locked: all.filter(item => item.status === "LOCKED").length
    };
  }

  scan();

  return Object.freeze({
    stage: "15.28",
    rules: XKISS_MODULE_HEALTH_RULES,
    scan,
    report,
    lock,
    get,
    getFaults,
    getHealth,
    getEvents: () => events.map(event => ({ ...event, detail: { ...event.detail } }))
  });
}
