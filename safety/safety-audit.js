import { SAFETY_RULES } from "./safety-rules.js";

export const SAFETY_AUDIT_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  eventTypes: [
    "age_verification",
    "creator_verification",
    "content_review",
    "user_report",
    "moderation_action",
    "content_state_change",
    "account_suspension",
    "account_restoration",
    "policy_change",
    "security_event"
  ],

  requiredFields: [
    "eventType",
    "actorId",
    "targetId",
    "occurredAt",
    "action",
    "result"
  ],

  retentionPolicy: "backend_policy_required",
  immutableRecords: true,
  frontendStorageAllowed: false,
  sensitiveDataMinimized: true,

  auditStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getSafetyAuditStatus() {
  return {
    ok: true,
    status: SAFETY_AUDIT_RULES.status,
    enabled: SAFETY_AUDIT_RULES.enabled,
    storageConnected: Boolean(SAFETY_AUDIT_RULES.auditStorage),
    immutableRecords: SAFETY_AUDIT_RULES.immutableRecords,
    reason: "Safety audit logging is prepared but no real audit storage is connected."
  };
}

export function createSafetyAuditEvent(input = {}) {
  const eventType = clean(input.eventType);
  const actorId = clean(input.actorId);
  const targetId = clean(input.targetId);
  const action = clean(input.action);
  const result = clean(input.result);

  if (!eventType || !actorId || !targetId || !action || !result) {
    return {
      ok: false,
      status: "invalid",
      reason: "eventType, actorId, targetId, action and result are required."
    };
  }

  if (!SAFETY_AUDIT_RULES.eventTypes.includes(eventType)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported safety audit event type."
    };
  }

  return {
    ok: true,
    status: "prepared",
    recorded: false,
    eventType,
    actorId,
    targetId,
    action,
    result,
    occurredAt: input.occurredAt || null,
    metadata: input.metadata && typeof input.metadata === "object"
      ? input.metadata
      : {},
    reason: SAFETY_AUDIT_RULES.enabled
      ? "Safety audit event is ready to be recorded by the backend."
      : "Safety audit event is prepared but audit storage is not active yet."
  };
}

export function validateSafetyAuditEvent(input = {}) {
  const eventType = clean(input.eventType);

  if (!SAFETY_AUDIT_RULES.eventTypes.includes(eventType)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported safety audit event type."
    };
  }

  return {
    ok: true,
    status: "valid",
    eventType,
    immutable: SAFETY_AUDIT_RULES.immutableRecords,
    frontendStorageAllowed: SAFETY_AUDIT_RULES.frontendStorageAllowed
  };
}
