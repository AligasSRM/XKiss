import { ADMIN_DASHBOARD_RULES } from "./admin-rules.js";

export const ADMIN_AUTH_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  authenticationMethods: [
    "secure_session",
    "multi_factor_authentication"
  ],

  sessionRequired: true,
  secureSessionRequired: true,
  mfaRecommended: true,
  mfaRequiredForSuperAdmin: true,

  passwordStoredInFrontend: false,
  credentialsStoredInFrontend: false,
  sessionSecretsStoredInFrontend: false,

  failedLoginProtection: true,
  sessionExpirationRequired: true,
  reauthenticationForSensitiveActions: true,
  auditTrailRequired: true,

  roles: ADMIN_DASHBOARD_RULES.roles,

  authenticationProvider: null,
  sessionStore: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAdminAuthStatus() {
  return {
    ok: true,
    status: ADMIN_AUTH_RULES.status,
    enabled: ADMIN_AUTH_RULES.enabled,
    providerConnected: Boolean(ADMIN_AUTH_RULES.authenticationProvider),
    sessionStoreConnected: Boolean(ADMIN_AUTH_RULES.sessionStore),
    mfaRequiredForSuperAdmin: ADMIN_AUTH_RULES.mfaRequiredForSuperAdmin,
    reason: "Admin authentication is prepared but secure backend authentication and session services are not connected."
  };
}

export function validateAdminLoginRequest(input = {}) {
  const identifier = clean(input.identifier);

  if (!identifier) {
    return {
      ok: false,
      status: "invalid",
      reason: "Admin identifier is required."
    };
  }

  if (!ADMIN_AUTH_RULES.enabled) {
    return {
      ok: true,
      status: "prepared",
      authenticated: false,
      sessionCreated: false,
      identifier,
      reason: "Admin authentication is not active until the secure backend provider is connected."
    };
  }

  return {
    ok: true,
    status: "pending",
    authenticated: false,
    sessionCreated: false,
    identifier,
    reason: "Authentication must be completed by the configured secure backend."
  };
}

export function evaluateAdminSession(input = {}) {
  const authenticated = input.authenticated === true;
  const sessionValid = input.sessionValid === true;
  const role = clean(input.role);

  if (!authenticated || !sessionValid) {
    return {
      ok: true,
      status: "unauthorized",
      allowed: false,
      reason: "A valid authenticated admin session is required."
    };
  }

  if (!ADMIN_DASHBOARD_RULES.roles.includes(role)) {
    return {
      ok: false,
      status: "invalid_role",
      allowed: false,
      reason: "Unsupported administrator role."
    };
  }

  return {
    ok: true,
    status: "authorized",
    allowed: true,
    role,
    reason: "Authenticated admin session is structurally valid."
  };
}

export function requiresMfa(role) {
  return ADMIN_AUTH_RULES.mfaRequiredForSuperAdmin &&
    clean(role) === "super_admin";
}
