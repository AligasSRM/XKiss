import { ADMIN_DASHBOARD_RULES } from "./admin-rules.js";

export const ADMIN_AUDIT_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  eventTypes: [
    "login",
    "logout",
    "user_action",
    "content_action",
    "report_action",
    "settings_change",
    "role_change",
    "storage_action",
    "security_event"
  ],

  severities: [
    "info",
    "warning",
    "critical"
  ],

  supportedActions: [
    "view",
    "search",
    "export"
  ],

  protectedData: [
    "password",
    "session_secret",
    "identity_documents",
    "payment_card_data",
    "authentication_token"
  ],

  authenticationRequired: true,
  permissionRequired: true,
  immutableEventsRequired: true,
  sensitiveDataRedactionRequired: true,
  auditTrailRequired: true,
  frontendCannotCreateTrustedAuditEvents: true,
  frontendCannotDeleteAuditEvents: true,

  auditStore: null,
  auditProvider: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAdminAuditStatus() {
  return {
    ok: true,
    status: ADMIN_AUDIT_RULES.status,
    enabled: ADMIN_AUDIT_RULES.enabled,
    auditStoreConnected: Boolean(ADMIN_AUDIT_RULES.auditStore),
    auditProviderConnected: Boolean(ADMIN_AUDIT_RULES.auditProvider),
    reason: "Admin audit and activity logs are prepared but immutable backend audit storage is not connected."
  };
}

export function validateAuditEventType(eventType) {
  const value = clean(eventType);

  if (!ADMIN_AUDIT_RULES.eventTypes.includes(value)) {
    return {
      ok: false,
      status: "invalid_event_type",
      reason: "Unsupported audit event type."
    };
  }

  return {
    ok: true,
    status: "valid",
    eventType: value
  };
}

export function validateAuditSeverity(severity) {
  const value = clean(severity);

  if (!ADMIN_AUDIT_RULES.severities.includes(value)) {
    return {
      ok: false,
      status: "invalid_severity",
      reason: "Unsupported audit severity."
    };
  }

  return {
    ok: true,
    status: "valid",
    severity: value
  };
}

export function validateAuditAction(input = {}) {
  const action = clean(input.action);

  if (!action) {
    return {
      ok: false,
      status: "invalid",
      reason: "Audit action is required."
    };
  }

  if (!ADMIN_AUDIT_RULES.supportedActions.includes(action)) {
    return {
      ok: false,
      status: "invalid_action",
      reason: "Unsupported audit log action."
    };
  }

  if (!ADMIN_AUDIT_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      action,
      reason: "Admin audit access is not active until secure backend audit services are connected."
    };
  }

  return {
    ok: true,
    status: "permission_required",
    allowed: false,
    action,
    reason: "The backend must authorize and record audit log access."
  };
}

export function isProtectedAuditField(field) {
  return ADMIN_AUDIT_RULES.protectedData.includes(clean(field));
}
