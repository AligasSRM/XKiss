import {
  SYSTEM_SETTINGS_API_RULES,
  validateSystemSettingsApiRequest
} from "./system-settings-api-rules.js";

export const SYSTEM_SETTINGS_API_CORE = {
  section: "15.8",
  name: "System Settings API Core",
  status: "ready",
  enabled: false,

  controls: {
    requestValidation: true,
    authenticationGate: true,
    authorizationGate: true,
    operationAllowlist: true,
    auditGate: true,
    failClosed: true
  },

  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

export function getSystemSettingsApiCoreStatus() {
  return {
    ok: true,
    stage: "15.8",
    coreConnected: true,
    rulesConnected: true,
    apiBoundaryReady: true,
    activationAllowed: false,
    frontendCannotAuthorize: true,
    frontendCannotStoreSecrets: true,
    failClosed: true
  };
}

export function validateSystemSettingsApiCore() {
  const status = getSystemSettingsApiCoreStatus();

  return {
    ok:
      status.coreConnected === true &&
      status.rulesConnected === true &&
      status.apiBoundaryReady === true &&
      status.activationAllowed === false &&
      status.failClosed === true,
    stage: "15.8",
    rulesVersion: SYSTEM_SETTINGS_API_RULES.version,
    controls: SYSTEM_SETTINGS_API_CORE.controls
  };
}

export function evaluateSystemSettingsApiRequest(input = {}) {
  const result = validateSystemSettingsApiRequest(input);

  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    reason: result.reason,
    activationAllowed: false
  };
}
