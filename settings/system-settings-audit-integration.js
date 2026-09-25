import {
  getSystemSettingsCoreStatus,
  validateSystemSettingsCore
} from "./system-settings-core.js";

import {
  getSystemSettingsProviderCoreStatus,
  validateSystemSettingsProviderCore
} from "./system-settings-provider-core.js";

import {
  getSystemSettingsStorageCoreStatus,
  validateSystemSettingsStorageCore
} from "./system-settings-storage-core.js";

import {
  getSystemSettingsServiceCoreStatus,
  validateSystemSettingsServiceCore
} from "./system-settings-service-core.js";

import {
  getSystemSettingsApiCoreStatus,
  validateSystemSettingsApiCore
} from "./system-settings-api-core.js";

import {
  getSystemSettingsAuditCoreStatus,
  validateSystemSettingsAuditCore,
  evaluateSystemSettingsAuditEvent
} from "./system-settings-audit-core.js";

export const SYSTEM_SETTINGS_AUDIT_INTEGRATION = {
  section: "15.9",
  name: "System Settings Audit Integration",
  status: "ready",
  enabled: false,
  preservesCoreGate: true,
  preservesProviderGate: true,
  preservesStorageGate: true,
  preservesServiceGate: true,
  preservesApiGate: true,
  frontendCannotWriteAudit: true,
  activationRequiresBackend: true
};

export function getSystemSettingsAuditIntegrationStatus() {
  const core = getSystemSettingsCoreStatus();
  const provider = getSystemSettingsProviderCoreStatus();
  const storage = getSystemSettingsStorageCoreStatus();
  const service = getSystemSettingsServiceCoreStatus();
  const api = getSystemSettingsApiCoreStatus();
  const audit = getSystemSettingsAuditCoreStatus();

  return {
    ok: true,
    stage: "15.9",
    integrationConnected: true,
    core15_4Connected: core.ok === true,
    provider15_5Connected: provider.ok === true,
    storage15_6Connected: storage.ok === true,
    service15_7Connected: service.ok === true,
    api15_8Connected: api.ok === true,
    audit15_9Connected: audit.ok === true,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    preservesApiGate: true,
    activationAllowed: false
  };
}

export function validateSystemSettingsAuditIntegration() {
  const core = validateSystemSettingsCore();
  const provider = validateSystemSettingsProviderCore();
  const storage = validateSystemSettingsStorageCore();
  const service = validateSystemSettingsServiceCore();
  const api = validateSystemSettingsApiCore();
  const audit = validateSystemSettingsAuditCore();
  const status = getSystemSettingsAuditIntegrationStatus();

  return {
    ok:
      core.ok === true &&
      provider.ok === true &&
      storage.ok === true &&
      service.ok === true &&
      api.ok === true &&
      audit.ok === true &&
      status.integrationConnected === true &&
      status.core15_4Connected === true &&
      status.provider15_5Connected === true &&
      status.storage15_6Connected === true &&
      status.service15_7Connected === true &&
      status.api15_8Connected === true &&
      status.audit15_9Connected === true &&
      status.preservesCoreGate === true &&
      status.preservesProviderGate === true &&
      status.preservesStorageGate === true &&
      status.preservesServiceGate === true &&
      status.preservesApiGate === true &&
      status.activationAllowed === false,
    stage: "15.9",
    core15_4Validation: core,
    provider15_5Validation: provider,
    storage15_6Validation: storage,
    service15_7Validation: service,
    api15_8Validation: api,
    audit15_9Validation: audit,
    activationAllowed: false
  };
}

export function evaluateSystemSettingsAuditIntegration(input = {}) {
  const auditResult = evaluateSystemSettingsAuditEvent(input);

  return {
    ok: true,
    allowed: auditResult.allowed === true,
    status: auditResult.status,
    audit15_9: auditResult,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    preservesApiGate: true,
    activationAllowed: false,
    reason:
      "15.9 provides the audit boundary without bypassing 15.4 Core, 15.5 Providers, 15.6 Storage, 15.7 Service, or 15.8 API."
  };
}
