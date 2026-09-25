export const PAYOUT_AUDIT_EVENTS = [
  "payout_requested",
  "status_changed",
  "payout_approved",
  "payout_processing",
  "payout_paid",
  "payout_rejected",
  "payout_cancelled",
  "payout_failed"
];

function clean(value) {
  return String(value || "").trim();
}

export function createPayoutAuditEvent(input = {}) {
  if (!input.payoutRequestId) {
    return {
      ok: false,
      status: "invalid",
      reason: "payoutRequestId is required."
    };
  }

  if (!input.creatorId) {
    return {
      ok: false,
      status: "invalid",
      reason: "creatorId is required."
    };
  }

  if (!PAYOUT_AUDIT_EVENTS.includes(clean(input.eventType))) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported payout audit event type."
    };
  }

  return {
    ok: true,
    status: "prepared",
    recorded: false,
    payoutRequestId: clean(input.payoutRequestId),
    creatorId: clean(input.creatorId),
    eventType: clean(input.eventType),
    fromStatus: clean(input.fromStatus),
    toStatus: clean(input.toStatus),
    amount: Number.isFinite(Number(input.amount))
      ? Number(input.amount)
      : null,
    currency: clean(input.currency || "USD"),
    referenceId: clean(input.referenceId),
    actorType: clean(input.actorType || "system"),
    occurredAt: input.occurredAt || new Date().toISOString(),
    reason: "Payout audit event is prepared for durable transaction history."
  };
}

export function buildPayoutHistory(events = []) {
  if (!Array.isArray(events)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Payout audit events must be an array."
    };
  }

  return {
    ok: true,
    status: "ready",
    count: events.length,
    history: events
      .filter(event => event && event.payoutRequestId)
      .map(event => ({
        payoutRequestId: clean(event.payoutRequestId),
        eventType: clean(event.eventType),
        fromStatus: clean(event.fromStatus),
        toStatus: clean(event.toStatus),
        amount: Number.isFinite(Number(event.amount))
          ? Number(event.amount)
          : null,
        currency: clean(event.currency || "USD"),
        referenceId: clean(event.referenceId),
        actorType: clean(event.actorType || "system"),
        occurredAt: event.occurredAt || null
      }))
  };
}
