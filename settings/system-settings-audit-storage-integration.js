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
  validateSystemSettingsAuditCore
} from "./system-settings-audit-core.js";
import {
  getSystemSettingsAuditStorageCoreStatus,
  validateSystemSettingsAuditStorageCore,
  evaluateSystemSettingsAuditStorageRequest
} from "./system-settings-audit-storage-core.js";

export const SYSTEM_SETTINGS_AUDIT_STORAGE_INTEGRATION = {
  section: "15.10",
  name: "System Settings Audit Storage Integration",
  status: "ready",
  enabled: false,
  preservesCoreGate: true,
  preservesProviderGate: true,
  preservesStorageGate: true,
  preservesServiceGate: true,
  preservesApiGate: true,
  preservesAuditGate: true,
  activationRequiresBackend: true
};

export function getSystemSettingsAuditStorageIntegrationStatus() {
  const core = getSystemSettingsCoreStatus();
  const provider = getSystemSettingsProviderCoreStatus();
  const storage = getSystemSettingsStorageCoreStatus();
  const service = getSystemSettingsServiceCoreStatus();
  const api = getSystemSettingsApiCoreStatus();
  const audit = getSystemSettingsAuditCoreStatus();
  const auditStorage = getSystemSettingsAuditStorageCoreStatus();

  return {
    ok: true,
    stage: "15.10",
    integrationConnected: true,
    core15_4Connected: core.ok === true,
    provider15_5Connected: provider.ok === true,
    storage15_6Connected: storage.ok === true,
    service15_7Connected: service.ok === true,
    api15_8Connected: api.ok === true,
    audit15_9Connected: audit.ok === true,
    auditStorage15_10Connected: auditStorage.ok === true,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    preservesApiGate: true,
    preservesAuditGate: true,
    activationAllowed: false
  };
}

export function validateSystemSettingsAuditStorageIntegration() {
  const core = validateSystemSettingsCore();
  const provider = validateSystemSettingsProviderCore();
  const storage = validateSystemSettingsStorageCore();
  const service = validateSystemSettingsServiceCore();
  const api = validateSystemSettingsApiCore();
  const audit = validateSystemSettingsAuditCore();
  const auditStorage = validateSystemSettingsAuditStorageCore();
  const status = getSystemSettingsAuditStorageIntegrationStatus();

  return {
    ok:
      core.ok === true &&
      provider.ok === true &&
      storage.ok === true &&
      service.ok === true &&
      api.ok === true &&
      audit.ok === true &&
      auditStorage.ok === true &&
      status.integrationConnected === true &&
      status.core15_4Connected === true &&
      status.provider15_5Connected === true &&
      status.storage15_6Connected === true &&
      status.service15_7Connected === true &&
      status.api15_8Connected === true &&
      status.audit15_9Connected === true &&
      status.auditStorage15_10Connected === true &&
      status.preservesCoreGate === true &&
      status.preservesProviderGate === true &&
      status.preservesStorageGate === true &&
      status.preservesServiceGate === true &&
      status.preservesApiGate === true &&
      status.preservesAuditGate === true &&
      status.activationAllowed === false,
    stage: "15.10",
    activationAllowed: false
  };
}

export function evaluateSystemSettingsAuditStorageIntegration(input = {}) {
  const result = evaluateSystemSettingsAuditStorageRequest(input);
  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    auditStorage15_10: result,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    preservesApiGate: true,
    preservesAuditGate: true,
    activationAllowed: false
  };
}
