import {
  SYSTEM_SETTINGS_SERVICE_RULES,
  validateSystemSettingsServiceRequest
} from "./system-settings-service-rules.js";

export const SYSTEM_SETTINGS_SERVICE_CORE = {
  section: "15.7",
  name: "System Settings Service Core",
  status: "ready",
  enabled: false,

  controls: {
    readService: true,
    writeService: true,
    authorizationGate: true,
    auditGate: true,
    versionAccess: true,
    failClosed: true
  },

  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

export function getSystemSettingsServiceCoreStatus() {
  return {
    ok: true,
    stage: "15.7",
    coreConnected: true,
    rulesConnected: true,
    serviceReady: true,
    activationAllowed: false,
    frontendCannotAuthorize: true,
    frontendCannotStoreSecrets: true,
    failClosed: true
  };
}

export function validateSystemSettingsServiceCore() {
  const status = getSystemSettingsServiceCoreStatus();

  return {
    ok:
      status.coreConnected === true &&
      status.rulesConnected === true &&
      status.serviceReady === true &&
      status.activationAllowed === false &&
      status.failClosed === true,
    stage: "15.7",
    rulesVersion: SYSTEM_SETTINGS_SERVICE_RULES.version,
    controls: SYSTEM_SETTINGS_SERVICE_CORE.controls
  };
}

export function evaluateSystemSettingsServiceRequest(input = {}) {
  const result = validateSystemSettingsServiceRequest(input);

  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    reason: result.reason,
    activationAllowed: false
  };
}
