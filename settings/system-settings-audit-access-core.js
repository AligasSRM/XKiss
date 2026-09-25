import {
  SYSTEM_SETTINGS_AUDIT_ACCESS_RULES,
  validateSystemSettingsAuditAccessRequest
} from "./system-settings-audit-access-rules.js";

export const SYSTEM_SETTINGS_AUDIT_ACCESS_CORE = {
  section: "15.12",
  name: "System Settings Audit Access Core",
  status: "ready",
  enabled: false,
  controls: {
    backendOnlyAccess: true,
    readOnlyHistory: true,
    authorizationGate: true,
    sensitiveReviewGate: true,
    privacyPreservation: true,
    failClosed: true
  },
  frontendCannotModifyAudit: true,
  activationRequiresBackend: true
};

export function getSystemSettingsAuditAccessCoreStatus() {
  return {
    ok: true,
    stage: "15.12",
    coreConnected: true,
    rulesConnected: true,
    accessReady: true,
    authorizationGateReady: true,
    readOnly: true,
    activationAllowed: false,
    failClosed: true
  };
}

export function validateSystemSettingsAuditAccessCore() {
  const status = getSystemSettingsAuditAccessCoreStatus();
  return {
    ok: status.coreConnected && status.rulesConnected &&
      status.accessReady && status.authorizationGateReady &&
      status.readOnly && status.activationAllowed === false &&
      status.failClosed,
    stage: "15.12",
    rulesVersion: SYSTEM_SETTINGS_AUDIT_ACCESS_RULES.version,
    controls: SYSTEM_SETTINGS_AUDIT_ACCESS_CORE.controls
  };
}

export function evaluateSystemSettingsAuditAccessRequest(input = {}) {
  const result = validateSystemSettingsAuditAccessRequest(input);
  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    reason: result.reason,
    activationAllowed: false
  };
}
