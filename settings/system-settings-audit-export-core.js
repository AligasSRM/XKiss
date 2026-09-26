import {
  SYSTEM_SETTINGS_AUDIT_EXPORT_RULES,
  validateSystemSettingsAuditExportRequest
} from "./system-settings-audit-export-rules.js";

export const SYSTEM_SETTINGS_AUDIT_EXPORT_CORE = {
  section: "15.14",
  name: "System Settings Audit Export Core",
  status: "ready",
  enabled: false,
  controls: {
    backendOnlyExport: true,
    authorizationGate: true,
    retentionGate: true,
    holdGate: true,
    reviewGate: true,
    secretProtection: true,
    readOnlyExport: true,
    failClosed: true
  },
  frontendCannotExportDirectly: true,
  frontendCannotModifyAudit: true,
  activationRequiresBackend: true
};

export function getSystemSettingsAuditExportCoreStatus() {
  return {
    ok: true,
    stage: "15.14",
    coreConnected: true,
    rulesConnected: true,
    exportReady: true,
    authorizationGateReady: true,
    retentionGateReady: true,
    holdGateReady: true,
    reviewGateReady: true,
    secretProtectionReady: true,
    readOnly: true,
    activationAllowed: false,
    failClosed: true
  };
}

export function validateSystemSettingsAuditExportCore() {
  const s = getSystemSettingsAuditExportCoreStatus();
  return {
    ok: s.coreConnected && s.rulesConnected && s.exportReady &&
      s.authorizationGateReady && s.retentionGateReady && s.holdGateReady &&
      s.reviewGateReady && s.secretProtectionReady && s.readOnly &&
      s.activationAllowed === false && s.failClosed,
    stage: "15.14",
    rulesVersion: SYSTEM_SETTINGS_AUDIT_EXPORT_RULES.version,
    controls: SYSTEM_SETTINGS_AUDIT_EXPORT_CORE.controls
  };
}

export function evaluateSystemSettingsAuditExportRequest(input = {}) {
  const result = validateSystemSettingsAuditExportRequest(input);
  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    reason: result.reason,
    activationAllowed: false
  };
}
