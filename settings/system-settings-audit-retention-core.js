import {
  SYSTEM_SETTINGS_AUDIT_RETENTION_RULES,
  validateSystemSettingsAuditRetentionRequest
} from "./system-settings-audit-retention-rules.js";

export const SYSTEM_SETTINGS_AUDIT_RETENTION_CORE = {
  section: "15.11",
  name: "System Settings Audit Retention Core",
  status: "ready",
  enabled: false,
  controls: {
    policyValidation: true,
    backendOnlyRetention: true,
    holdProtection: true,
    immutableHistory: true,
    failClosed: true
  },
  frontendCannotApplyRetention: true,
  frontendCannotDeleteAudit: true,
  activationRequiresBackend: true
};

export function getSystemSettingsAuditRetentionCoreStatus() {
  return {
    ok: true,
    stage: "15.11",
    coreConnected: true,
    rulesConnected: true,
    retentionReady: true,
    holdProtectionReady: true,
    activationAllowed: false,
    failClosed: true
  };
}

export function validateSystemSettingsAuditRetentionCore() {
  const status = getSystemSettingsAuditRetentionCoreStatus();
  return {
    ok: status.coreConnected && status.rulesConnected &&
      status.retentionReady && status.holdProtectionReady &&
      status.activationAllowed === false && status.failClosed,
    stage: "15.11",
    rulesVersion: SYSTEM_SETTINGS_AUDIT_RETENTION_RULES.version,
    controls: SYSTEM_SETTINGS_AUDIT_RETENTION_CORE.controls
  };
}

export function evaluateSystemSettingsAuditRetentionRequest(input = {}) {
  const result = validateSystemSettingsAuditRetentionRequest(input);
  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    reason: result.reason,
    activationAllowed: false
  };
}
