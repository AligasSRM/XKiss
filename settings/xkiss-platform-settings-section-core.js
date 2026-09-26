import { runSystemSettingsCoreSelfCheck } from "./system-settings-core-self-test.js";
import { validateSystemSettingsProviderIntegration } from "./system-settings-provider-integration.js";
import { runSystemSettingsProviderCoreSelfCheck } from "./system-settings-provider-core-self-test.js";
import { runSystemSettingsStorageSelfCheck } from "./system-settings-storage-self-test.js";
import { runSystemSettingsServiceSelfCheck } from "./system-settings-service-self-test.js";
import { runSystemSettingsApiSelfCheck } from "./system-settings-api-self-test.js";
import { runSystemSettingsAuditSelfCheck } from "./system-settings-audit-self-test.js";
import { runSystemSettingsAuditStorageSelfCheck } from "./system-settings-audit-storage-self-test.js";
import { runSystemSettingsAuditRetentionSelfCheck } from "./system-settings-audit-retention-self-test.js";
import { runSystemSettingsAuditAccessSelfCheck } from "./system-settings-audit-access-self-test.js";
import { runSystemSettingsAuditReviewSelfCheck } from "./system-settings-audit-review-self-test.js";
import { runSystemSettingsAuditExportSelfCheck } from "./system-settings-audit-export-self-test.js";
import { runSystemSettingsRuntimeActivationSelfCheck } from "./system-settings-runtime-activation-self-test.js";

export const XKISS_PLATFORM_SETTINGS_SECTION = {
  section: "15",
  name: "Platform Settings",
  version: "1.0.0",
  status: "in_review",
  failClosed: true,
  productionActivationAllowed: false
};

export function runPlatformSettingsSectionCheck() {
  const checks = {
    core: runSystemSettingsCoreSelfCheck(),
    provider: runSystemSettingsProviderCoreSelfCheck(),
    providerIntegration: validateSystemSettingsProviderIntegration(),
    storage: runSystemSettingsStorageSelfCheck(),
    service: runSystemSettingsServiceSelfCheck(),
    api: runSystemSettingsApiSelfCheck(),
    audit: runSystemSettingsAuditSelfCheck(),
    auditStorage: runSystemSettingsAuditStorageSelfCheck(),
    auditRetention: runSystemSettingsAuditRetentionSelfCheck(),
    auditAccess: runSystemSettingsAuditAccessSelfCheck(),
    auditReview: runSystemSettingsAuditReviewSelfCheck(),
    auditExport: runSystemSettingsAuditExportSelfCheck(),
    runtimeActivation: runSystemSettingsRuntimeActivationSelfCheck()
  };

  const allGreen = Object.values(checks).every((result) => result && result.ok === true);

  return {
    ok: allGreen,
    section: "15",
    name: XKISS_PLATFORM_SETTINGS_SECTION.name,
    status: allGreen ? "GREEN_CLOSED" : "FAULT",
    failClosed: true,
    productionActivationAllowed: false,
    externalActivationRequired: true,
    checks,
    reason: allGreen
      ? "Section 15 Platform Settings passed its complete structural, security, service, API, audit, integration and runtime self-test suite. Production activation remains blocked until real backend providers, authorization and audit verification are connected."
      : "One or more Section 15 checks failed."
  };
}

export function getPlatformSettingsSectionStatus() {
  return {
    section: "15",
    name: XKISS_PLATFORM_SETTINGS_SECTION.name,
    status: XKISS_PLATFORM_SETTINGS_SECTION.status,
    failClosed: XKISS_PLATFORM_SETTINGS_SECTION.failClosed,
    productionActivationAllowed: false
  };
}
