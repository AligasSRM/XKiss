import { ADMIN_DASHBOARD_RULES } from "./admin-rules.js";

export const ADMIN_REPORTS_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  reportStates: [
    "submitted",
    "under_review",
    "resolved",
    "dismissed"
  ],

  supportedActions: [
    "view",
    "review",
    "resolve",
    "dismiss",
    "escalate"
  ],

  priorities: [
    "normal",
    "high",
    "critical"
  ],

  protectedOperations: [
    "resolve",
    "dismiss",
    "escalate"
  ],

  authenticationRequired: true,
  permissionRequired: true,
  reporterPrivacyProtected: true,
  moderationWorkflowRequired: true,
  auditTrailRequired: true,
  frontendCannotResolveDirectly: true,

  reportStore: null,
  moderationQueue: null,
  auditStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAdminReportsStatus() {
  return {
    ok: true,
    status: ADMIN_REPORTS_RULES.status,
    enabled: ADMIN_REPORTS_RULES.enabled,
    reportStoreConnected: Boolean(ADMIN_REPORTS_RULES.reportStore),
    moderationQueueConnected: Boolean(ADMIN_REPORTS_RULES.moderationQueue),
    auditStorageConnected: Boolean(ADMIN_REPORTS_RULES.auditStorage),
    reason: "Admin reports management is prepared but secure backend reporting storage and moderation authorization are not connected."
  };
}

export function validateReportAction(input = {}) {
  const reportId = clean(input.reportId);
  const action = clean(input.action);

  if (!reportId || !action) {
    return {
      ok: false,
      status: "invalid",
      reason: "reportId and action are required."
    };
  }

  if (!ADMIN_REPORTS_RULES.supportedActions.includes(action)) {
    return {
      ok: false,
      status: "invalid_action",
      reason: "Unsupported report management action."
    };
  }

  if (!ADMIN_REPORTS_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      reportId,
      action,
      reason: "Report management is not active until secure backend authorization is connected."
    };
  }

  return {
    ok: true,
    status: "permission_required",
    allowed: false,
    reportId,
    action,
    reason: "The backend must authorize, execute and audit this report action."
  };
}

export function validateReportState(state) {
  const value = clean(state);

  if (!ADMIN_REPORTS_RULES.reportStates.includes(value)) {
    return {
      ok: false,
      status: "invalid_state",
      reason: "Unsupported report state."
    };
  }

  return {
    ok: true,
    status: "valid",
    reportState: value
  };
}

export function validateReportPriority(priority) {
  const value = clean(priority);

  if (!ADMIN_REPORTS_RULES.priorities.includes(value)) {
    return {
      ok: false,
      status: "invalid_priority",
      reason: "Unsupported report priority."
    };
  }

  return {
    ok: true,
    status: "valid",
    priority: value
  };
}
