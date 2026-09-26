import { getSystemSettingsRuntimeActivationStatus, evaluateSystemSettingsRuntimeActivation } from "./system-settings-runtime-activation-core.js";

export function runSystemSettingsRuntimeActivationSelfCheck() {
  const status = getSystemSettingsRuntimeActivationStatus();
  const deniedFrontend = evaluateSystemSettingsRuntimeActivation({
    operation: "activate_runtime",
    backendConnected: true,
    providersVerified: true,
    authorizationVerified: true,
    auditVerified: true,
    fromFrontend: true
  });
  const deniedBackend = evaluateSystemSettingsRuntimeActivation({
    operation: "activate_runtime",
    backendConnected: false,
    providersVerified: true,
    authorizationVerified: true,
    auditVerified: true
  });
  const validGate = evaluateSystemSettingsRuntimeActivation({
    operation: "validate_activation",
    backendConnected: true,
    providersVerified: true,
    authorizationVerified: true,
    auditVerified: true
  });
  const checks = {
    stage: status.stage === "15.15",
    backendOnly: status.backendOnly === true,
    activationBlocked: status.activationAllowed === false,
    frontendDenied: deniedFrontend.allowed === false,
    backendRequired: deniedBackend.allowed === false,
    validGateAccepted: validGate.allowed === true
  };
  return { ok: Object.values(checks).every(Boolean), stage: "15.15", test: "System Settings Runtime Activation self-check", checks };
}