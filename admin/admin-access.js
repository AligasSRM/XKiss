import { ADMIN_DASHBOARD_RULES } from "./admin-rules.js";

export const ADMIN_ACCESS_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  roles: ADMIN_DASHBOARD_RULES.roles,

  rolePermissions: {
    admin: [
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
    moderator: [
      "view_users",
      "view_content",
      "manage_content",
      "view_reports",
      "manage_reports"
    ],
    support: [
      "view_users",
      "view_content",
      "view_reports"
    ],
    finance: [
      "view_analytics",
      "view_storage"
    ],
    super_admin: ADMIN_DASHBOARD_RULES.permissions
  },

  supportedActions: [
    "view",
    "grant",
    "revoke",
    "replace_role"
  ],

  protectedActions: [
    "grant",
    "revoke",
    "replace_role"
  ],

  authenticationRequired: true,
  permissionRequired: true,
  leastPrivilegeRequired: true,
  reauthenticationRequiredForProtectedActions: true,
  auditTrailRequired: true,
  frontendCannotGrantPermissions: true,
  frontendCannotEscalatePrivileges: true,

  accessStore: null,
  auditStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAdminAccessStatus() {
  return {
    ok: true,
    status: ADMIN_ACCESS_RULES.status,
    enabled: ADMIN_ACCESS_RULES.enabled,
    accessStoreConnected: Boolean(ADMIN_ACCESS_RULES.accessStore),
    auditStorageConnected: Boolean(ADMIN_ACCESS_RULES.auditStorage),
    reason: "Admin access and role management is prepared but secure backend authorization and access storage are not connected."
  };
}

export function validateAdminRolePermission(role, permission) {
  const roleValue = clean(role);
  const permissionValue = clean(permission);

  if (!ADMIN_ACCESS_RULES.roles.includes(roleValue)) {
    return {
      ok: false,
      status: "invalid_role",
      allowed: false,
      reason: "Unsupported administrator role."
    };
  }

  if (!ADMIN_DASHBOARD_RULES.permissions.includes(permissionValue)) {
    return {
      ok: false,
      status: "invalid_permission",
      allowed: false,
      reason: "Unsupported administrator permission."
    };
  }

  const permissions = ADMIN_ACCESS_RULES.rolePermissions[roleValue] || [];

  return {
    ok: true,
    status: permissions.includes(permissionValue) ? "allowed" : "denied",
    allowed: permissions.includes(permissionValue),
    role: roleValue,
    permission: permissionValue
  };
}

export function validateAccessAction(input = {}) {
  const action = clean(input.action);
  const role = clean(input.role);
  const permission = clean(input.permission);

  if (!action || !role) {
    return {
      ok: false,
      status: "invalid",
      reason: "action and role are required."
    };
  }

  if (!ADMIN_ACCESS_RULES.supportedActions.includes(action)) {
    return {
      ok: false,
      status: "invalid_action",
      reason: "Unsupported admin access action."
    };
  }

  if (permission) {
    const permissionCheck = validateAdminRolePermission(role, permission);
    if (!permissionCheck.ok) {
      return permissionCheck;
    }
  }

  if (!ADMIN_ACCESS_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      action,
      role,
      permission: permission || null,
      reason: "Admin access changes are not active until secure backend authorization is connected."
    };
  }

  return {
    ok: true,
    status: ADMIN_ACCESS_RULES.protectedActions.includes(action)
      ? "reauthentication_required"
      : "permission_required",
    allowed: false,
    action,
    role,
    permission: permission || null,
    reason: "The backend must authorize, execute and audit this access change."
  };
}
