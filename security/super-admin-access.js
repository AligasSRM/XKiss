import {
  SUPER_ADMIN_SECURITY_RULES,
  getSuperAdminSecurityStatus,
  validateSuperAdminRole,
  evaluatePrivilegedAction,
  getProtectedDataPolicy
} from "./super-admin-security-rules.js";

export const SUPER_ADMIN_ACCESS_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  authenticationMethods: [
    "secure_session",
    "multi_factor_authentication"
  ],

  requiredRole: SUPER_ADMIN_SECURITY_RULES.superAdminRole,

  accessStates: [
    "active",
    "restricted",
    "suspended",
    "revoked"
  ],

  accessChecks: [
    "authenticated_session",
    "valid_super_admin_role",
    "active_admin_account",
    "mfa_verified",
    "reauthenticated_for_sensitive_action",
    "backend_authorized",
    "audit_recorded"
  ],

  sensitiveActionsRequireReauthentication: true,
  frontendCannotGrantAccess: true,
  frontendCannotBypassMfa: true,
  frontendCannotBypassBackendAuthorization: true,
  activationRequiresBackend: true,

  sessionProvider: null,
  authorizationProvider: null,
  mfaProvider: null
};

function clean(value) {
  return String(value || "").trim();
}

export function getSuperAdminAccessStatus() {
  const security = getSuperAdminSecurityStatus();

  return {
    ok: true,
    status: SUPER_ADMIN_ACCESS_RULES.status,
    enabled: SUPER_ADMIN_ACCESS_RULES.enabled,
    requiredRole: SUPER_ADMIN_ACCESS_RULES.requiredRole,
    securityFoundationReady: security.ok && security.status === "prepared",
    providersConnected: Boolean(
      SUPER_ADMIN_ACCESS_RULES.sessionProvider &&
      SUPER_ADMIN_ACCESS_RULES.authorizationProvider &&
      SUPER_ADMIN_ACCESS_RULES.mfaProvider
    ),
    activationRequiresBackend: SUPER_ADMIN_ACCESS_RULES.activationRequiresBackend,
    reason: "Super Admin access control is prepared but secure session, MFA, authorization, and backend services are not connected."
  };
}

export function validateSuperAdminAccess(input = {}) {
  const roleResult = validateSuperAdminRole(input.role);
  const accountState = clean(input.accountState);
  const mfaVerified = input.mfaVerified === true;
  const authenticated = input.authenticated === true;

  if (!roleResult.ok) {
    return {
      ok: false,
      status: "invalid_role",
      allowed: false,
      reason: roleResult.reason
    };
  }

  if (!SUPER_ADMIN_ACCESS_RULES.accessStates.includes(accountState)) {
    return {
      ok: false,
      status: "invalid_account_state",
      allowed: false,
      reason: "Unsupported administrator account state."
    };
  }

  if (accountState !== "active") {
    return {
      ok: true,
      status: "inactive_account",
      allowed: false,
      reason: "Super Admin access requires an active administrator account."
    };
  }

  if (!authenticated) {
    return {
      ok: true,
      status: "authentication_required",
      allowed: false,
      reason: "A secure authenticated session is required."
    };
  }

  if (!mfaVerified) {
    return {
      ok: true,
      status: "mfa_required",
      allowed: false,
      reason: "Multi-factor authentication is required for Super Admin access."
    };
  }

  if (!SUPER_ADMIN_ACCESS_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      role: roleResult.role,
      accountState,
      reason: "Super Admin access is not active until secure backend authorization is connected."
    };
  }

  return {
    ok: true,
    status: "backend_authorization_required",
    allowed: false,
    role: roleResult.role,
    accountState,
    reason: "Final Super Admin access must be authorized by the configured secure backend."
  };
}

export function evaluateSuperAdminSensitiveAction(input = {}) {
  const actionResult = evaluatePrivilegedAction({
    role: input.role,
    action: input.action
  });

  if (!actionResult.ok) {
    return actionResult;
  }

  if (input.reauthenticated !== true) {
    return {
      ok: true,
      status: "reauthentication_required",
      allowed: false,
      role: actionResult.role,
      action: actionResult.action,
      reason: "Sensitive Super Admin actions require reauthentication."
    };
  }

  if (!SUPER_ADMIN_ACCESS_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      role: actionResult.role,
      action: actionResult.action,
      reason: "Sensitive actions are not active until secure backend authorization is connected."
    };
  }

  return {
    ok: true,
    status: "backend_authorization_required",
    allowed: false,
    role: actionResult.role,
    action: actionResult.action,
    reason: "Sensitive action must be authorized by the configured secure backend and recorded in the audit trail."
  };
}

export function getSuperAdminProtectedDataPolicy() {
  return getProtectedDataPolicy();
}
