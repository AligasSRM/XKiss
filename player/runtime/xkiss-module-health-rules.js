const VALID_STATUS = ["HEALTHY","WARNING","FAULT","OFFLINE","LOCKED"];
const VALID_SEVERITY = ["INFO","LOW","MEDIUM","HIGH","CRITICAL"];

export const XKISS_MODULE_HEALTH_RULES = Object.freeze({
  stage: "15.28",
  name: "XKiss Module Health & Fault Detection Rules",
  version: "1.0.0",
  statuses: VALID_STATUS,
  severities: VALID_SEVERITY,
  failClosed: true,
  requiredFields: ["module","status","severity","timestamp"]
});

export function validateXKissModuleHealthReport(report = {}) {
  if (!report || typeof report !== "object") return { ok: false, error: "invalid-report" };
  if (typeof report.module !== "string" || !/^[A-Za-z0-9._-]{1,80}$/.test(report.module)) return { ok: false, error: "invalid-module" };
  if (!VALID_STATUS.includes(report.status)) return { ok: false, error: "invalid-status" };
  if (!VALID_SEVERITY.includes(report.severity)) return { ok: false, error: "invalid-severity" };
  if (!Number.isFinite(report.timestamp)) return { ok: false, error: "invalid-timestamp" };
  return { ok: true };
}

export function severityForStatus(status) {
  if (status === "FAULT") return "HIGH";
  if (status === "WARNING") return "MEDIUM";
  if (status === "LOCKED") return "HIGH";
  if (status === "OFFLINE") return "CRITICAL";
  return "INFO";
}
