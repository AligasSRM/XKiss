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
  validateSystemSettingsAuditStorageCore
} from "./system-settings-audit-storage-core.js";
import {
  getSystemSettingsAuditRetentionCoreStatus,
  validateSystemSettingsAuditRetentionCore,
  evaluateSystemSettingsAuditRetentionRequest
} from "./system-settings-audit-retention-core.js";

export const SYSTEM_SETTINGS_AUDIT_RETENTION_INTEGRATION = {
  section: "15.11",
  name: "System Settings Audit Retention Integration",
  status: "ready",
  enabled: false,
  preservesCoreGate: true,
  preservesProviderGate: true,
  preservesStorageGate: true,
  preservesServiceGate: true,
  preservesApiGate: true,
  preservesAuditGate: true,
  preservesAuditStorageGate: true,
  activationRequiresBackend: true
};

export function getSystemSettingsAuditRetentionIntegrationStatus() {
  const core = getSystemSettingsCoreStatus();
  const provider = getSystemSettingsProviderCoreStatus();
  const storage = getSystemSettingsStorageCoreStatus();
  const service = getSystemSettingsServiceCoreStatus();
  const api = getSystemSettingsApiCoreStatus();
  const audit = getSystemSettingsAuditCoreStatus();
  const auditStorage = getSystemSettingsAuditStorageCoreStatus();
  const retention = getSystemSettingsAuditRetentionCoreStatus();

  return {
    ok: true,
    stage: "15.11",
    integrationConnected: true,
    core15_4Connected: core.ok === true,
    provider15_5Connected: provider.ok === true,
    storage15_6Connected: storage.ok === true,
    service15_7Connected: service.ok === true,
    api15_8Connected: api.ok === true,
    audit15_9Connected: audit.ok === true,
    auditStorage15_10Connected: auditStorage.ok === true,
    auditRetention15_11Connected: retention.ok === true,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    preservesApiGate: true,
    preservesAuditGate: true,
    preservesAuditStorageGate: true,
    activationAllowed: false
  };
}

export function validateSystemSettingsAuditRetentionIntegration() {
  const core = validateSystemSettingsCore();
  const provider = validateSystemSettingsProviderCore();
  const storage = validateSystemSettingsStorageCore();
  const service = validateSystemSettingsServiceCore();
  const api = validateSystemSettingsApiCore();
  const audit = validateSystemSettingsAuditCore();
  const auditStorage = validateSystemSettingsAuditStorageCore();
  const retention = validateSystemSettingsAuditRetentionCore();
  const status = getSystemSettingsAuditRetentionIntegrationStatus();

  return {
    ok: core.ok && provider.ok && storage.ok && service.ok && api.ok &&
      audit.ok && auditStorage.ok && retention.ok &&
      status.integrationConnected &&
      status.core15_4Connected &&
      status.provider15_5Connected &&
      status.storage15_6Connected &&
      status.service15_7Connected &&
      status.api15_8Connected &&
      status.audit15_9Connected &&
      status.auditStorage15_10Connected &&
      status.auditRetention15_11Connected &&
      status.preservesCoreGate &&
      status.preservesProviderGate &&
      status.preservesStorageGate &&
      status.preservesServiceGate &&
      status.preservesApiGate &&
      status.preservesAuditGate &&
      status.preservesAuditStorageGate &&
      status.activationAllowed === false,
    stage: "15.11",
    activationAllowed: false
  };
}

export function evaluateSystemSettingsAuditRetentionIntegration(input = {}) {
  const result = evaluateSystemSettingsAuditRetentionRequest(input);
  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    auditRetention15_11: result,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    preservesApiGate: true,
    preservesAuditGate: true,
    preservesAuditStorageGate: true,
    activationAllowed: false
  };
}
