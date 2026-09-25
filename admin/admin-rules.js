export const ADMIN_DASHBOARD_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  roles: [
    "admin",
    "moderator",
    "support",
    "finance",
    "super_admin"
  ],

  accountStates: [
    "active",
    "restricted",
    "suspended",
    "revoked"
  ],

  permissions: [
    "view_users",
    "manage_users",
    "view_content",
    "manage_content",
    "view_reports",
    "manage_reports",
    "view_analytics",
    "view_storage",
    "view_settings"
  ],

  protectedAreas: [
    "user_accounts",
    "content_moderation",
    "reports",
    "analytics",
    "storage",
    "platform_settings"
  ],

  authenticationRequired: true,
  roleBasedAccessRequired: true,
  leastPrivilegeRequired: true,
  auditTrailRequired: true,
  frontendCannotGrantPermissions: true,

  adminProvider: null,
  adminStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAdminDashboardStatus() {
  return {
    ok: true,
    status: ADMIN_DASHBOARD_RULES.status,
    enabled: ADMIN_DASHBOARD_RULES.enabled,
    authenticationRequired: ADMIN_DASHBOARD_RULES.authenticationRequired,
    roleBasedAccessRequired: ADMIN_DASHBOARD_RULES.roleBasedAccessRequired,
    providerConnected: Boolean(ADMIN_DASHBOARD_RULES.adminProvider),
    storageConnected: Boolean(ADMIN_DASHBOARD_RULES.adminStorage),
    reason: "Admin Dashboard foundation is prepared but secure authentication and backend permissions are not connected."
  };
}

export function validateAdminRole(role) {
  const value = clean(role);

  if (!ADMIN_DASHBOARD_RULES.roles.includes(value)) {
    return {
      ok: false,
      status: "invalid",
      role: value,
      reason: "Unsupported administrator role."
    };
  }

  return {
    ok: true,
    status: "valid",
    role: value
  };
}

export function checkAdminPermission(input = {}) {
  const role = clean(input.role);
  const permission = clean(input.permission);

  if (!ADMIN_DASHBOARD_RULES.roles.includes(role)) {
    return {
      ok: false,
      status: "invalid_role",
      allowed: false,
      reason: "Unsupported administrator role."
    };
  }

  if (!ADMIN_DASHBOARD_RULES.permissions.includes(permission)) {
    return {
      ok: false,
      status: "invalid_permission",
      allowed: false,
      reason: "Unsupported administrator permission."
    };
  }

  if (!ADMIN_DASHBOARD_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      role,
      permission,
      reason: "Admin permissions are not active until secure backend authentication and authorization are connected."
    };
  }

  return {
    ok: true,
    status: "permission_check",
    allowed: false,
    role,
    permission,
    reason: "Permission must be granted by the configured backend authorization layer."
  };
}

export function evaluateAdminAccountState(state) {
  const value = clean(state);

  if (!ADMIN_DASHBOARD_RULES.accountStates.includes(value)) {
    return {
      ok: false,
      status: "invalid",
      accountState: value,
      reason: "Unsupported administrator account state."
    };
  }

  return {
    ok: true,
    status: value,
    accountState: value,
    accessAllowed: value === "active",
    reason: value === "active"
      ? "Administrator account is structurally active."
      : "Administrator account is not active."
  };
}
