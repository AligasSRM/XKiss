import {
  SYSTEM_SETTINGS_AUDIT_STORAGE_RULES,
  validateSystemSettingsAuditStorageRequest
} from "./system-settings-audit-storage-rules.js";

export const SYSTEM_SETTINGS_AUDIT_STORAGE_CORE = {
  section: "15.10",
  name: "System Settings Audit Storage Core",
  status: "ready",
  enabled: false,
  controls: {
    backendOnlyStorage: true,
    appendOnlyRecords: true,
    immutableHistory: true,
    retentionPolicy: true,
    readWriteSeparation: true,
    failClosed: true
  },
  frontendCannotWriteDirectly: true,
  frontendCannotDeleteAudit: true,
  frontendCannotAlterAudit: true,
  activationRequiresBackend: true
};

export function getSystemSettingsAuditStorageCoreStatus() {
  return {
    ok: true,
    stage: "15.10",
    coreConnected: true,
    rulesConnected: true,
    storageReady: true,
    appendOnly: true,
    immutableHistory: true,
    activationAllowed: false,
    failClosed: true
  };
}

export function validateSystemSettingsAuditStorageCore() {
  const status = getSystemSettingsAuditStorageCoreStatus();
  return {
    ok:
      status.coreConnected === true &&
      status.rulesConnected === true &&
      status.storageReady === true &&
      status.appendOnly === true &&
      status.immutableHistory === true &&
      status.activationAllowed === false &&
      status.failClosed === true,
    stage: "15.10",
    rulesVersion: SYSTEM_SETTINGS_AUDIT_STORAGE_RULES.version,
    controls: SYSTEM_SETTINGS_AUDIT_STORAGE_CORE.controls
  };
}

export function evaluateSystemSettingsAuditStorageRequest(input = {}) {
  const result = validateSystemSettingsAuditStorageRequest(input);
  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    reason: result.reason,
    activationAllowed: false
  };
}
