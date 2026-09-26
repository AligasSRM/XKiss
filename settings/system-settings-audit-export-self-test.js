import {
  getSystemSettingsAuditExportCoreStatus,
  validateSystemSettingsAuditExportCore,
  evaluateSystemSettingsAuditExportRequest
} from "./system-settings-audit-export-core.js";

export function runSystemSettingsAuditExportSelfCheck() {
  const status = getSystemSettingsAuditExportCoreStatus();
  const validation = validateSystemSettingsAuditExportCore();
  const base = {
    authorizationVerified: true,
    retentionStateVerified: true,
    holdStateVerified: true,
    reviewStateVerified: true,
    backendConnected: true
  };

  const invalid = evaluateSystemSettingsAuditExportRequest({...base, operation:"delete_audit"});
  const frontend = evaluateSystemSettingsAuditExportRequest({...base, operation:"export_audit_history", fromFrontend:true});
  const noAuth = evaluateSystemSettingsAuditExportRequest({...base, operation:"export_audit_event", authorizationVerified:false});
  const noRetention = evaluateSystemSettingsAuditExportRequest({...base, operation:"export_audit_history", retentionStateVerified:false});
  const noHold = evaluateSystemSettingsAuditExportRequest({...base, operation:"export_audit_history", holdStateVerified:false});
  const noReview = evaluateSystemSettingsAuditExportRequest({...base, operation:"export_audit_history", reviewStateVerified:false});
  const secrets = evaluateSystemSettingsAuditExportRequest({...base, operation:"export_audit_event", exposesSecrets:true});
  const modify = evaluateSystemSettingsAuditExportRequest({...base, operation:"export_audit_event", modifiesAudit:true});
  const noBackend = evaluateSystemSettingsAuditExportRequest({...base, operation:"export_audit_summary", backendConnected:false});
  const validExport = evaluateSystemSettingsAuditExportRequest({...base, operation:"export_audit_history"});

  const checks = {
    stage: status.stage === "15.14",
    coreConnected: status.coreConnected === true,
    rulesConnected: status.rulesConnected === true,
    exportReady: status.exportReady === true,
    authorizationGateReady: status.authorizationGateReady === true,
    retentionGateReady: status.retentionGateReady === true,
    holdGateReady: status.holdGateReady === true,
    reviewGateReady: status.reviewGateReady === true,
    secretProtectionReady: status.secretProtectionReady === true,
    readOnly: status.readOnly === true,
    invalidOperationDenied: invalid.allowed === false,
    frontendExportDenied: frontend.allowed === false,
    authorizationRequired: noAuth.allowed === false,
    retentionVerificationRequired: noRetention.allowed === false,
    holdVerificationRequired: noHold.allowed === false,
    reviewVerificationRequired: noReview.allowed === false,
    secretExposureDenied: secrets.allowed === false,
    auditModificationDenied: modify.allowed === false,
    backendRequired: noBackend.allowed === false,
    validExportAccepted: validExport.allowed === true,
    activationBlocked: validExport.activationAllowed === false
  };

  return {
    ok: Object.values(checks).every(Boolean) && validation.ok === true,
    stage: "15.14",
    test: "System Settings Audit Export self-check",
    checks,
    activationAllowed: false
  };
}
