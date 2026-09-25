import {
  getSystemSettingsAuditStorageCoreStatus,
  validateSystemSettingsAuditStorageCore,
  evaluateSystemSettingsAuditStorageRequest
} from "./system-settings-audit-storage-core.js";

export function runSystemSettingsAuditStorageSelfCheck() {
  const status = getSystemSettingsAuditStorageCoreStatus();
  const validation = validateSystemSettingsAuditStorageCore();

  const invalidOperation = evaluateSystemSettingsAuditStorageRequest({
    operation: "delete_audit",
    backendConnected: true
  });

  const frontendWrite = evaluateSystemSettingsAuditStorageRequest({
    operation: "append_audit_event",
    fromFrontend: true,
    appendOnly: true,
    backendConnected: true
  });

  const nonAppendOnly = evaluateSystemSettingsAuditStorageRequest({
    operation: "append_audit_event",
    appendOnly: false,
    backendConnected: true
  });

  const unverifiedRetention = evaluateSystemSettingsAuditStorageRequest({
    operation: "validate_retention",
    retentionPolicyVerified: false,
    backendConnected: true
  });

  const noBackend = evaluateSystemSettingsAuditStorageRequest({
    operation: "append_audit_event",
    appendOnly: true,
    backendConnected: false
  });

  const validAppend = evaluateSystemSettingsAuditStorageRequest({
    operation: "append_audit_event",
    appendOnly: true,
    backendConnected: true
  });

  const validRead = evaluateSystemSettingsAuditStorageRequest({
    operation: "read_audit_history",
    backendConnected: true
  });

  const checks = {
    stage: status.stage === "15.10",
    coreConnected: status.coreConnected === true,
    rulesConnected: status.rulesConnected === true,
    storageReady: status.storageReady === true,
    invalidOperationDenied: invalidOperation.allowed === false,
    frontendWriteDenied: frontendWrite.allowed === false,
    appendOnlyEnforced: nonAppendOnly.allowed === false,
    retentionVerificationRequired: unverifiedRetention.allowed === false,
    backendRequired: noBackend.allowed === false,
    validAppendAccepted: validAppend.allowed === true,
    validReadAccepted: validRead.allowed === true,
    activationBlocked: validAppend.activationAllowed === false
  };

  return {
    ok: Object.values(checks).every(Boolean) && validation.ok === true,
    stage: "15.10",
    test: "System Settings Audit Storage self-check",
    checks,
    activationAllowed: false
  };
}
