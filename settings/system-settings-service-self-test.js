import {
  getSystemSettingsServiceCoreStatus,
  validateSystemSettingsServiceCore,
  evaluateSystemSettingsServiceRequest
} from "./system-settings-service-core.js";

export function runSystemSettingsServiceSelfCheck() {
  const status = getSystemSettingsServiceCoreStatus();
  const validation = validateSystemSettingsServiceCore();

  const invalidOperation = evaluateSystemSettingsServiceRequest({
    operation: "delete_settings",
    backendConnected: true
  });

  const frontendWrite = evaluateSystemSettingsServiceRequest({
    operation: "write_setting",
    fromFrontend: true,
    backendConnected: true,
    authorizationProviderConnected: true
  });

  const writeWithoutAuthorization = evaluateSystemSettingsServiceRequest({
    operation: "write_setting",
    backendConnected: true,
    authorizationProviderConnected: false
  });

  const sensitiveWriteWithoutAudit = evaluateSystemSettingsServiceRequest({
    operation: "write_setting",
    sensitive: true,
    backendConnected: true,
    authorizationProviderConnected: true,
    auditProviderConnected: false
  });

  const validRead = evaluateSystemSettingsServiceRequest({
    operation: "read_settings",
    backendConnected: true
  });

  const validWrite = evaluateSystemSettingsServiceRequest({
    operation: "write_setting",
    sensitive: false,
    backendConnected: true,
    authorizationProviderConnected: true,
    auditProviderConnected: true
  });

  const checks = {
    stage: status.stage === "15.7",
    coreConnected: status.coreConnected === true,
    rulesConnected: status.rulesConnected === true,
    serviceReady: status.serviceReady === true,
    invalidOperationDenied: invalidOperation.allowed === false,
    frontendWriteDenied: frontendWrite.allowed === false,
    authorizationGateDenied: writeWithoutAuthorization.allowed === false,
    sensitiveAuditDenied: sensitiveWriteWithoutAudit.allowed === false,
    validReadAccepted: validRead.allowed === true,
    validWriteBackendGated:
      validWrite.allowed === true &&
      validWrite.activationAllowed === false
  };

  return {
    ok: Object.values(checks).every(Boolean) && validation.ok === true,
    stage: "15.7",
    checks,
    activationAllowed: false,
    reason:
      "15.7 service rules, read/write separation, authorization gating, sensitive audit gating, frontend isolation, and fail-closed behavior passed. Real backend activation remains required."
  };
}
