import {
  getSystemSettingsStorageCoreStatus,
  validateSystemSettingsStorageCore,
  evaluateSystemSettingsStorageChange
} from "./system-settings-storage-core.js";

export function runSystemSettingsStorageSelfCheck() {
  const status = getSystemSettingsStorageCoreStatus();
  const validation = validateSystemSettingsStorageCore();

  const invalidKey = evaluateSystemSettingsStorageChange({
    category: "platform",
    type: "string",
    backendConnected: true
  });

  const invalidType = evaluateSystemSettingsStorageChange({
    key: "site_name",
    category: "platform",
    type: "secret",
    backendConnected: true
  });

  const frontendWrite = evaluateSystemSettingsStorageChange({
    key: "site_name",
    category: "platform",
    type: "string",
    fromFrontend: true,
    backendConnected: true
  });

  const sensitiveWithoutAudit = evaluateSystemSettingsStorageChange({
    key: "api_keys",
    category: "security",
    type: "object",
    sensitive: true,
    backendConnected: true,
    auditProviderConnected: false
  });

  const validBackendChange = evaluateSystemSettingsStorageChange({
    key: "site_name",
    category: "platform",
    type: "string",
    backendConnected: true,
    auditProviderConnected: true
  });

  const checks = {
    stage: status.stage === "15.6",
    coreConnected: status.coreConnected === true,
    rulesConnected: status.rulesConnected === true,
    secureDefaults: status.failClosed === true,
    frontendWriteBlocked: frontendWrite.allowed === false,
    invalidKeyDenied: invalidKey.allowed === false,
    invalidTypeDenied: invalidType.allowed === false,
    sensitiveAuditBlocked: sensitiveWithoutAudit.allowed === false,
    validChangeBackendGated:
      validBackendChange.allowed === true &&
      validBackendChange.activationAllowed === false
  };

  return {
    ok: Object.values(checks).every(Boolean) && validation.ok === true,
    stage: "15.6",
    checks,
    activationAllowed: false,
    reason:
      "15.6 storage rules, schema validation, frontend isolation, sensitive audit gating, and fail-closed behavior passed. Real backend storage remains required."
  };
}
