import { validateSystemSettingsCore } from "./system-settings-core.js";
import { validateSystemSettingsProviderCore } from "./system-settings-provider-core.js";
import { validateSystemSettingsStorageCore } from "./system-settings-storage-core.js";
import { validateSystemSettingsServiceCore } from "./system-settings-service-core.js";
import { validateSystemSettingsApiCore } from "./system-settings-api-core.js";
import { validateSystemSettingsAuditCore } from "./system-settings-audit-core.js";
import { validateSystemSettingsAuditStorageCore } from "./system-settings-audit-storage-core.js";
import { validateSystemSettingsAuditRetentionCore } from "./system-settings-audit-retention-core.js";
import { validateSystemSettingsAuditAccessCore } from "./system-settings-audit-access-core.js";
import { validateSystemSettingsAuditReviewCore } from "./system-settings-audit-review-core.js";
import {
  getSystemSettingsAuditExportCoreStatus,
  validateSystemSettingsAuditExportCore,
  evaluateSystemSettingsAuditExportRequest
} from "./system-settings-audit-export-core.js";

export const SYSTEM_SETTINGS_AUDIT_EXPORT_INTEGRATION = {
  section: "15.14",
  name: "System Settings Audit Export Integration",
  status: "ready",
  enabled: false,
  preservesCoreGate: true,
  preservesProviderGate: true,
  preservesStorageGate: true,
  preservesServiceGate: true,
  preservesApiGate: true,
  preservesAuditGate: true,
  preservesAuditStorageGate: true,
  preservesRetentionGate: true,
  preservesAccessGate: true,
  preservesReviewGate: true,
  activationRequiresBackend: true
};

export function getSystemSettingsAuditExportIntegrationStatus() {
  const s = getSystemSettingsAuditExportCoreStatus();
  return {
    ok: true,
    stage: "15.14",
    integrationConnected: true,
    auditExport15_14Connected: s.ok === true,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    preservesApiGate: true,
    preservesAuditGate: true,
    preservesAuditStorageGate: true,
    preservesRetentionGate: true,
    preservesAccessGate: true,
    preservesReviewGate: true,
    activationAllowed: false
  };
}

export function validateSystemSettingsAuditExportIntegration() {
  const checks = [
    validateSystemSettingsCore(),
    validateSystemSettingsProviderCore(),
    validateSystemSettingsStorageCore(),
    validateSystemSettingsServiceCore(),
    validateSystemSettingsApiCore(),
    validateSystemSettingsAuditCore(),
    validateSystemSettingsAuditStorageCore(),
    validateSystemSettingsAuditRetentionCore(),
    validateSystemSettingsAuditAccessCore(),
    validateSystemSettingsAuditReviewCore(),
    validateSystemSettingsAuditExportCore()
  ];
  const status = getSystemSettingsAuditExportIntegrationStatus();
  return {
    ok: checks.every(x => x.ok === true) &&
      status.integrationConnected && status.auditExport15_14Connected &&
      status.preservesCoreGate && status.preservesProviderGate &&
      status.preservesStorageGate && status.preservesServiceGate &&
      status.preservesApiGate && status.preservesAuditGate &&
      status.preservesAuditStorageGate && status.preservesRetentionGate &&
      status.preservesAccessGate && status.preservesReviewGate &&
      status.activationAllowed === false,
    stage: "15.14",
    activationAllowed: false
  };
}

export function evaluateSystemSettingsAuditExportIntegration(input = {}) {
  const result = evaluateSystemSettingsAuditExportRequest(input);
  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    auditExport15_14: result,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    preservesApiGate: true,
    preservesAuditGate: true,
    preservesAuditStorageGate: true,
    preservesRetentionGate: true,
    preservesAccessGate: true,
    preservesReviewGate: true,
    activationAllowed: false
  };
}
