export const SUPER_ADMIN_SECURITY_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  superAdminRole: "super_admin",

  securityPrinciples: [
    "zero_trust",
    "least_privilege",
    "defense_in_depth",
    "secure_session",
    "multi_factor_authentication",
    "reauthentication",
    "immutable_audit",
    "secret_protection",
    "privacy_first",
    "backend_authorization"
  ],

  protectedAreas: [
    "admin_access",
    "role_management",
    "platform_settings",
    "security_settings",
    "payment_settings",
    "storage_settings",
    "user_accounts",
    "content_moderation",
    "audit_logs",
    "system_operations"
  ],

  privilegedActions: [
    "grant_admin_access",
    "revoke_admin_access",
    "change_admin_role",
    "change_security_policy",
    "change_platform_settings",
    "manage_storage",
    "manage_payment_configuration",
    "view_security_logs",
    "export_audit_logs",
    "suspend_admin_access"
  ],

  requiredControls: {
    authentication: true,
    secureSession: true,
    multiFactorAuthentication: true,
    reauthenticationForSensitiveActions: true,
    backendAuthorization: true,
    immutableAuditTrail: true,
    secretStorageOutsideFrontend: true,
    sessionExpiration: true,
    failedLoginProtection: true
  },

  protectedData: [
    "password",
    "session_secret",
    "authentication_token",
    "identity_documents",
    "payment_card_data",
    "api_keys",
    "private_keys"
  ],

  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true,

  authenticationProvider: null,
  authorizationProvider: null,
  auditProvider: null
};

function clean(value) {
  return String(value || "").trim();
}

export function getSuperAdminSecurityStatus() {
  return {
    ok: true,
    status: SUPER_ADMIN_SECURITY_RULES.status,
    enabled: SUPER_ADMIN_SECURITY_RULES.enabled,
    superAdminRole: SUPER_ADMIN_SECURITY_RULES.superAdminRole,
    providerConnected: Boolean(
      SUPER_ADMIN_SECURITY_RULES.authenticationProvider &&
      SUPER_ADMIN_SECURITY_RULES.authorizationProvider
    ),
    auditConnected: Boolean(SUPER_ADMIN_SECURITY_RULES.auditProvider),
    requiredControls: SUPER_ADMIN_SECURITY_RULES.requiredControls,
    reason: "Super Admin security foundation is prepared but secure backend authentication, authorization, and audit services are not connected."
  };
}

export function isProtectedArea(value) {
  return SUPER_ADMIN_SECURITY_RULES.protectedAreas.includes(clean(value));
}

export function isPrivilegedAction(value) {
  return SUPER_ADMIN_SECURITY_RULES.privilegedActions.includes(clean(value));
}

export function isProtectedData(value) {
  return SUPER_ADMIN_SECURITY_RULES.protectedData.includes(clean(value));
}

export function validateSuperAdminRole(role) {
  const value = clean(role);

  return {
    ok: value === SUPER_ADMIN_SECURITY_RULES.superAdminRole,
    status: value === SUPER_ADMIN_SECURITY_RULES.superAdminRole ? "valid" : "invalid",
    role: value,
    reason: value === SUPER_ADMIN_SECURITY_RULES.superAdminRole
      ? "Super Admin role is recognized."
      : "Only the configured super_admin role is recognized for privileged administration."
  };
}

export function evaluatePrivilegedAction(input = {}) {
  const role = clean(input.role);
  const action = clean(input.action);

  if (!validateSuperAdminRole(role).ok) {
    return {
      ok: false,
      status: "invalid_role",
      allowed: false,
      role,
      action,
      reason: "A valid super_admin role is required."
    };
  }

  if (!isPrivilegedAction(action)) {
    return {
      ok: false,
      status: "invalid_action",
      allowed: false,
      role,
      action,
      reason: "Unsupported privileged action."
    };
  }

  if (!SUPER_ADMIN_SECURITY_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      role,
      action,
      reason: "Privileged actions are not active until secure backend authentication and authorization are connected."
    };
  }

  return {
    ok: true,
    status: "backend_authorization_required",
    allowed: false,
    role,
    action,
    reason: "Privileged action must be authorized by the configured secure backend."
  };
}

export function getProtectedDataPolicy() {
  return {
    ok: true,
    status: "prepared",
    frontendAccessAllowed: false,
    storageAllowed: false,
    protectedData: [...SUPER_ADMIN_SECURITY_RULES.protectedData],
    reason: "Protected secrets and sensitive data must remain outside frontend code and client-side storage."
  };
}
