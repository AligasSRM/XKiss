import {
  getSystemSettingsAuditRetentionCoreStatus,
  validateSystemSettingsAuditRetentionCore,
  evaluateSystemSettingsAuditRetentionRequest
} from "./system-settings-audit-retention-core.js";

export function runSystemSettingsAuditRetentionSelfCheck() {
  const status = getSystemSettingsAuditRetentionCoreStatus();
  const validation = validateSystemSettingsAuditRetentionCore();

  const invalid = evaluateSystemSettingsAuditRetentionRequest({
    operation: "delete_all_audit", backendConnected: true
  });
  const frontend = evaluateSystemSettingsAuditRetentionRequest({
    operation: "apply_retention_policy", fromFrontend: true,
    retentionPolicyVerified: true, holdStateVerified: true, backendConnected: true
  });
  const noPolicy = evaluateSystemSettingsAuditRetentionRequest({
    operation: "apply_retention_policy",
    retentionPolicyVerified: false, holdStateVerified: true, backendConnected: true
  });
  const noHoldVerification = evaluateSystemSettingsAuditRetentionRequest({
    operation: "apply_retention_policy",
    retentionPolicyVerified: true, holdStateVerified: false, backendConnected: true
  });
  const noBackend = evaluateSystemSettingsAuditRetentionRequest({
    operation: "apply_retention_policy",
    retentionPolicyVerified: true, holdStateVerified: true, backendConnected: false
  });
  const validApply = evaluateSystemSettingsAuditRetentionRequest({
    operation: "apply_retention_policy",
    retentionPolicyVerified: true, holdStateVerified: true, backendConnected: true
  });
  const validRead = evaluateSystemSettingsAuditRetentionRequest({
    operation: "read_retention_status", backendConnected: true
  });

  const checks = {
    stage: status.stage === "15.11",
    coreConnected: status.coreConnected === true,
    rulesConnected: status.rulesConnected === true,
    retentionReady: status.retentionReady === true,
    holdProtectionReady: status.holdProtectionReady === true,
    invalidOperationDenied: invalid.allowed === false,
    frontendChangeDenied: frontend.allowed === false,
    policyVerificationRequired: noPolicy.allowed === false,
    holdVerificationRequired: noHoldVerification.allowed === false,
    backendRequired: noBackend.allowed === false,
    validApplyAccepted: validApply.allowed === true,
    validReadAccepted: validRead.allowed === true,
    activationBlocked: validApply.activationAllowed === false
  };

  return {
    ok: Object.values(checks).every(Boolean) && validation.ok === true,
    stage: "15.11",
    test: "System Settings Audit Retention self-check",
    checks,
    activationAllowed: false
  };
}
