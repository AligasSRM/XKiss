import { ADMIN_DASHBOARD_RULES } from "./admin-rules.js";

export const ADMIN_USER_MANAGEMENT_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  manageableStates: [
    "active",
    "restricted",
    "suspended",
    "closed"
  ],

  supportedActions: [
    "view",
    "restrict",
    "suspend",
    "restore",
    "close"
  ],

  protectedFields: [
    "password",
    "session_secret",
    "identity_documents",
    "payment_card_data"
  ],

  authenticationRequired: true,
  permissionRequired: true,
  sensitiveActionsRequireReauthentication: true,
  auditTrailRequired: true,
  frontendCannotChangeUserState: true,

  userStore: null,
  auditStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAdminUserManagementStatus() {
  return {
    ok: true,
    status: ADMIN_USER_MANAGEMENT_RULES.status,
    enabled: ADMIN_USER_MANAGEMENT_RULES.enabled,
    userStoreConnected: Boolean(ADMIN_USER_MANAGEMENT_RULES.userStore),
    auditStorageConnected: Boolean(ADMIN_USER_MANAGEMENT_RULES.auditStorage),
    reason: "Admin user management is prepared but secure backend user storage and authorization are not connected."
  };
}

export function validateUserManagementAction(input = {}) {
  const userId = clean(input.userId);
  const action = clean(input.action);

  if (!userId || !action) {
    return {
      ok: false,
      status: "invalid",
      reason: "userId and action are required."
    };
  }

  if (!ADMIN_USER_MANAGEMENT_RULES.supportedActions.includes(action)) {
    return {
      ok: false,
      status: "invalid_action",
      reason: "Unsupported user management action."
    };
  }

  if (!ADMIN_USER_MANAGEMENT_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      userId,
      action,
      reason: "User management is not active until secure backend authorization is connected."
    };
  }

  return {
    ok: true,
    status: "permission_required",
    allowed: false,
    userId,
    action,
    reason: "The backend must authorize and record this administrator action."
  };
}

export function validateUserState(state) {
  const value = clean(state);

  if (!ADMIN_USER_MANAGEMENT_RULES.manageableStates.includes(value)) {
    return {
      ok: false,
      status: "invalid_state",
      reason: "Unsupported user account state."
    };
  }

  return {
    ok: true,
    status: "valid",
    userState: value
  };
}

export function isProtectedUserField(field) {
  return ADMIN_USER_MANAGEMENT_RULES.protectedFields.includes(clean(field));
}
