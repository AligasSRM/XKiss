import {
  getSystemSettingsAuditCoreStatus,
  validateSystemSettingsAuditCore,
  evaluateSystemSettingsAuditEvent
} from "./system-settings-audit-core.js";

export function runSystemSettingsAuditSelfCheck() {
  const status = getSystemSettingsAuditCoreStatus();
  const validation = validateSystemSettingsAuditCore();

  const invalidEvent = evaluateSystemSettingsAuditEvent({
    eventType: "delete_all_audit",
    backendConnected: true,
    actorVerified: true,
    timestampVerified: true,
    actorId: "sa-1",
    actorRole: "super_admin",
    timestamp: "verified",
    operation: "write_setting",
    result: "denied"
  });

  const frontendAudit = evaluateSystemSettingsAuditEvent({
    eventType: "settings_written",
    fromFrontend: true,
    backendConnected: true,
    actorVerified: true,
    timestampVerified: true,
    actorId: "sa-1",
    actorRole: "super_admin",
    timestamp: "verified",
    operation: "write_setting",
    result: "success"
  });

  const missingActor = evaluateSystemSettingsAuditEvent({
    eventType: "settings_written",
    backendConnected: true,
    actorVerified: false,
    timestampVerified: true,
    actorRole: "super_admin",
    timestamp: "verified",
    operation: "write_setting",
    result: "success"
  });

  const missingTimestampVerification = evaluateSystemSettingsAuditEvent({
    eventType: "settings_written",
    backendConnected: true,
    actorVerified: true,
    timestampVerified: false,
    actorId: "sa-1",
    actorRole: "super_admin",
    timestamp: "unverified",
    operation: "write_setting",
    result: "success"
  });

  const missingField = evaluateSystemSettingsAuditEvent({
    eventType: "settings_written",
    backendConnected: true,
    actorVerified: true,
    timestampVerified: true,
    actorRole: "super_admin",
    timestamp: "verified",
    operation: "write_setting",
    result: "success"
  });

  const validEvent = evaluateSystemSettingsAuditEvent({
    eventType: "settings_written",
    backendConnected: true,
    actorVerified: true,
    timestampVerified: true,
    actorId: "sa-1",
    actorRole: "super_admin",
    timestamp: "verified",
    operation: "write_setting",
    result: "success"
  });

  const checks = {
    stage: status.stage === "15.9",
    coreConnected: status.coreConnected === true,
    rulesConnected: status.rulesConnected === true,
    auditReady: status.auditReady === true,
    invalidEventDenied: invalidEvent.allowed === false,
    frontendAuditDenied: frontendAudit.allowed === false,
    actorVerificationDenied: missingActor.allowed === false,
    timestampVerificationDenied: missingTimestampVerification.allowed === false,
    requiredFieldDenied: missingField.allowed === false,
    validEventAccepted: validEvent.allowed === true,
    activationBlocked: validEvent.activationAllowed === false
  };

  return {
    ok: Object.values(checks).every(Boolean) && validation.ok === true,
    stage: "15.9",
    test: "System Settings Audit self-check",
    checks,
    activationAllowed: false,
    reason:
      "15.9 audit validation, backend-only recording, actor attribution, timestamp verification, required fields, frontend isolation, and fail-closed behavior passed. Real backend audit activation remains required."
  };
}
