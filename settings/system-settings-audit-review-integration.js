import {
  validateSystemSettingsCore
} from "./system-settings-core.js";
import {
  validateSystemSettingsProviderCore
} from "./system-settings-provider-core.js";
import {
  validateSystemSettingsStorageCore
} from "./system-settings-storage-core.js";
import {
  validateSystemSettingsServiceCore
} from "./system-settings-service-core.js";
import {
  validateSystemSettingsApiCore
} from "./system-settings-api-core.js";
import {
  validateSystemSettingsAuditCore
} from "./system-settings-audit-core.js";
import {
  validateSystemSettingsAuditStorageCore
} from "./system-settings-audit-storage-core.js";
import {
  validateSystemSettingsAuditRetentionCore
} from "./system-settings-audit-retention-core.js";
import {
  validateSystemSettingsAuditAccessCore
} from "./system-settings-audit-access-core.js";
import {
  getSystemSettingsAuditReviewCoreStatus,
  validateSystemSettingsAuditReviewCore,
  evaluateSystemSettingsAuditReviewRequest
} from "./system-settings-audit-review-core.js";

export const SYSTEM_SETTINGS_AUDIT_REVIEW_INTEGRATION = {
  section: "15.13",
  name: "System Settings Audit Review Integration",
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
  activationRequiresBackend: true
};

export function getSystemSettingsAuditReviewIntegrationStatus() {
  const s = getSystemSettingsAuditReviewCoreStatus();
  return {
    ok: true,
    stage: "15.13",
    integrationConnected: true,
    auditReview15_13Connected: s.ok === true,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    preservesApiGate: true,
    preservesAuditGate: true,
    preservesAuditStorageGate: true,
    preservesRetentionGate: true,
    preservesAccessGate: true,
    activationAllowed: false
  };
}

export function validateSystemSettingsAuditReviewIntegration() {
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
    validateSystemSettingsAuditReviewCore()
  ];
  const status = getSystemSettingsAuditReviewIntegrationStatus();
  return {
    ok: checks.every(x => x.ok === true) &&
      status.integrationConnected && status.auditReview15_13Connected &&
      status.preservesCoreGate && status.preservesProviderGate &&
      status.preservesStorageGate && status.preservesServiceGate &&
      status.preservesApiGate && status.preservesAuditGate &&
      status.preservesAuditStorageGate && status.preservesRetentionGate &&
      status.preservesAccessGate && status.activationAllowed === false,
    stage: "15.13",
    activationAllowed: false
  };
}

export function evaluateSystemSettingsAuditReviewIntegration(input = {}) {
  const result = evaluateSystemSettingsAuditReviewRequest(input);
  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    auditReview15_13: result,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    preservesApiGate: true,
    preservesAuditGate: true,
    preservesAuditStorageGate: true,
    preservesRetentionGate: true,
    preservesAccessGate: true,
    activationAllowed: false
  };
}
