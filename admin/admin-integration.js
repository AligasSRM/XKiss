import { getAdminDashboardStatus } from "./admin-rules.js";
import { getAdminAuthStatus } from "./admin-auth.js";
import { getAdminUserManagementStatus } from "./admin-user-management.js";
import { getAdminContentManagementStatus } from "./admin-content-management.js";
import { getAdminReportsStatus } from "./admin-reports.js";
import { getAdminAnalyticsStatus } from "./admin-analytics.js";
import { getAdminStorageStatus } from "./admin-storage.js";
import { getAdminSettingsStatus } from "./admin-settings.js";
import { getAdminAccessStatus } from "./admin-access.js";
import { getAdminAuditStatus } from "./admin-audit.js";

export const ADMIN_DASHBOARD_INTEGRATION = {
  version: "1.1",
  status: "configured",
  enabled: false,
  activationRequiresBackend: true
};

export function getAdminDashboardOverview() {
  return {
    ok: true,
    status: ADMIN_DASHBOARD_INTEGRATION.status,
    enabled: ADMIN_DASHBOARD_INTEGRATION.enabled,
    modules: {
      foundation: getAdminDashboardStatus(),
      authentication: getAdminAuthStatus(),
      userManagement: getAdminUserManagementStatus(),
      contentManagement: getAdminContentManagementStatus(),
      reports: getAdminReportsStatus(),
      analytics: getAdminAnalyticsStatus(),
      storage: getAdminStorageStatus(),
      settings: getAdminSettingsStatus(),
      access: getAdminAccessStatus(),
      audit: getAdminAuditStatus()
    },
    reason: "Admin Dashboard modules are fully configured and coordinated. Production administration remains disabled until secure backend authentication, authorization, storage and audit services are connected."
  };
}

export function getAdminModuleStatus(moduleName) {
  const overview = getAdminDashboardOverview();
  const key = String(moduleName || "").trim();

  if (!key || !overview.modules[key]) {
    return {
      ok: false,
      status: "invalid_module",
      reason: "Unsupported Admin Dashboard module."
    };
  }

  return overview.modules[key];
}

export function getAdminIntegrationSummary() {
  const overview = getAdminDashboardOverview();
  const moduleEntries = Object.entries(overview.modules);

  const modulesReady = moduleEntries.every(([, module]) => {
    return module && module.ok === true && (module.status === "prepared" || module.status === "configured");
  });

  return {
    ok: modulesReady,
    status: modulesReady ? "configured" : "needs_review",
    moduleCount: moduleEntries.length,
    modulesReady,
    enabled: ADMIN_DASHBOARD_INTEGRATION.enabled,
    backendRequiredForActivation:
      ADMIN_DASHBOARD_INTEGRATION.activationRequiresBackend,
    reason: modulesReady
      ? "Admin Dashboard integration is structurally complete and all administration modules are configured. Production activation remains disabled until the secure backend is connected."
      : "One or more Admin Dashboard modules require review."
  };
}
