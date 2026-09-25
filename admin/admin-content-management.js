import { ADMIN_DASHBOARD_RULES } from "./admin-rules.js";

export const ADMIN_CONTENT_MANAGEMENT_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  contentStates: [
    "draft",
    "pending_review",
    "published",
    "restricted",
    "removed"
  ],

  supportedActions: [
    "view",
    "review",
    "restrict",
    "remove",
    "restore"
  ],

  reviewReasons: [
    "new_upload",
    "user_report",
    "policy_signal",
    "manual_review",
    "verification_issue"
  ],

  protectedOperations: [
    "publish",
    "remove",
    "restore",
    "restrict"
  ],

  authenticationRequired: true,
  permissionRequired: true,
  moderationWorkflowRequired: true,
  auditTrailRequired: true,
  frontendCannotPublishDirectly: true,
  frontendCannotRemoveDirectly: true,

  contentStore: null,
  moderationProvider: null,
  auditStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAdminContentManagementStatus() {
  return {
    ok: true,
    status: ADMIN_CONTENT_MANAGEMENT_RULES.status,
    enabled: ADMIN_CONTENT_MANAGEMENT_RULES.enabled,
    contentStoreConnected: Boolean(ADMIN_CONTENT_MANAGEMENT_RULES.contentStore),
    moderationProviderConnected: Boolean(ADMIN_CONTENT_MANAGEMENT_RULES.moderationProvider),
    auditStorageConnected: Boolean(ADMIN_CONTENT_MANAGEMENT_RULES.auditStorage),
    reason: "Admin content management is prepared but secure backend content storage and moderation authorization are not connected."
  };
}

export function validateContentAction(input = {}) {
  const contentId = clean(input.contentId);
  const action = clean(input.action);

  if (!contentId || !action) {
    return {
      ok: false,
      status: "invalid",
      reason: "contentId and action are required."
    };
  }

  if (!ADMIN_CONTENT_MANAGEMENT_RULES.supportedActions.includes(action)) {
    return {
      ok: false,
      status: "invalid_action",
      reason: "Unsupported content management action."
    };
  }

  if (!ADMIN_CONTENT_MANAGEMENT_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      contentId,
      action,
      reason: "Content management is not active until secure backend authorization is connected."
    };
  }

  return {
    ok: true,
    status: "permission_required",
    allowed: false,
    contentId,
    action,
    reason: "The backend must authorize, execute and audit this content action."
  };
}

export function validateContentState(state) {
  const value = clean(state);

  if (!ADMIN_CONTENT_MANAGEMENT_RULES.contentStates.includes(value)) {
    return {
      ok: false,
      status: "invalid_state",
      reason: "Unsupported content state."
    };
  }

  return {
    ok: true,
    status: "valid",
    contentState: value
  };
}

export function validateReviewReason(reason) {
  const value = clean(reason);

  if (!ADMIN_CONTENT_MANAGEMENT_RULES.reviewReasons.includes(value)) {
    return {
      ok: false,
      status: "invalid_reason",
      reason: "Unsupported content review reason."
    };
  }

  return {
    ok: true,
    status: "valid",
    reviewReason: value
  };
}
