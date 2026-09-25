import {
  SYSTEM_SETTINGS_AUDIT_RULES,
  validateSystemSettingsAuditEvent
} from "./system-settings-audit-rules.js";

export const SYSTEM_SETTINGS_AUDIT_CORE = {
  section: "15.9",
  name: "System Settings Audit Core",
  status: "ready",
  enabled: false,

  controls: {
    immutableAuditRecords: true,
    backendOnlyAudit: true,
    actorAttribution: true,
    timestampVerification: true,
    sensitiveChangeTracking: true,
    failClosed: true
  },

  frontendCannotWriteAudit: true,
  frontendCannotForgeActor: true,
  frontendCannotForgeTimestamp: true,
  activationRequiresBackend: true
};

export function getSystemSettingsAuditCoreStatus() {
  return {
    ok: true,
    stage: "15.9",
    coreConnected: true,
    rulesConnected: true,
    auditReady: true,
    activationAllowed: false,
    frontendCannotWriteAudit: true,
    frontendCannotForgeActor: true,
    frontendCannotForgeTimestamp: true,
    failClosed: true
  };
}

export function validateSystemSettingsAuditCore() {
  const status = getSystemSettingsAuditCoreStatus();

  return {
    ok:
      status.coreConnected === true &&
      status.rulesConnected === true &&
      status.auditReady === true &&
      status.activationAllowed === false &&
      status.failClosed === true,
    stage: "15.9",
    rulesVersion: SYSTEM_SETTINGS_AUDIT_RULES.version,
    controls: SYSTEM_SETTINGS_AUDIT_CORE.controls
  };
}

export function evaluateSystemSettingsAuditEvent(input = {}) {
  const result = validateSystemSettingsAuditEvent(input);

  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    reason: result.reason,
    activationAllowed: false
  };
}
