import {
  getSystemSettingsApiCoreStatus,
  validateSystemSettingsApiCore,
  evaluateSystemSettingsApiRequest
} from "./system-settings-api-core.js";

export function runSystemSettingsApiSelfCheck() {
  const status = getSystemSettingsApiCoreStatus();
  const validation = validateSystemSettingsApiCore();

  const invalidOperation = evaluateSystemSettingsApiRequest({
    operation: "delete_settings",
    authenticated: true,
    role: "super_admin",
    serviceLayerConnected: true,
    backendConnected: true
  });

  const unauthenticated = evaluateSystemSettingsApiRequest({
    operation: "read_settings",
    authenticated: false,
    serviceLayerConnected: true,
    backendConnected: true
  });

  const nonAdminWrite = evaluateSystemSettingsApiRequest({
    operation: "write_setting",
    authenticated: true,
    role: "admin",
    serviceLayerConnected: true,
    backendConnected: true
  });

  const frontendWrite = evaluateSystemSettingsApiRequest({
    operation: "write_setting",
    authenticated: true,
    role: "super_admin",
    fromFrontend: true,
    serviceLayerConnected: true,
    backendConnected: true
  });

  const sensitiveWithoutAudit = evaluateSystemSettingsApiRequest({
    operation: "write_setting",
    authenticated: true,
    role: "super_admin",
    sensitive: true,
    serviceLayerConnected: true,
    backendConnected: true,
    auditProviderConnected: false
  });

  const serviceMissing = evaluateSystemSettingsApiRequest({
    operation: "read_settings",
    authenticated: true,
    serviceLayerConnected: false,
    backendConnected: true
  });

  const validRead = evaluateSystemSettingsApiRequest({
    operation: "read_settings",
    authenticated: true,
    role: "super_admin",
    serviceLayerConnected: true,
    backendConnected: true
  });

  const validWrite = evaluateSystemSettingsApiRequest({
    operation: "write_setting",
    authenticated: true,
    role: "super_admin",
    sensitive: false,
    serviceLayerConnected: true,
    backendConnected: true,
    auditProviderConnected: true
  });

  const checks = {
    stage: status.stage === "15.8",
    coreConnected: status.coreConnected === true,
    rulesConnected: status.rulesConnected === true,
    apiBoundaryReady: status.apiBoundaryReady === true,
    invalidOperationDenied: invalidOperation.allowed === false,
    unauthenticatedDenied: unauthenticated.allowed === false,
    nonAdminWriteDenied: nonAdminWrite.allowed === false,
    frontendWriteDenied: frontendWrite.allowed === false,
    sensitiveAuditDenied: sensitiveWithoutAudit.allowed === false,
    serviceLayerRequired: serviceMissing.allowed === false,
    validReadAccepted: validRead.allowed === true,
    validWriteBackendGated:
      validWrite.allowed === true &&
      validWrite.activationAllowed === false
  };

  return {
    ok: Object.values(checks).every(Boolean) && validation.ok === true,
    stage: "15.8",
    test: "System Settings API self-check",
    checks,
    activationAllowed: false,
    reason:
      "15.8 API boundary validation, authentication, authorization, operation allowlisting, audit gating, frontend isolation, and fail-closed behavior passed. Real backend activation remains required."
  };
}
