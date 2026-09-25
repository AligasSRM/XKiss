export const PAYOUT_STATUSES = [
  "requested",
  "under_review",
  "approved",
  "processing",
  "paid",
  "rejected",
  "cancelled",
  "failed"
];

const TERMINAL_STATUSES = new Set([
  "paid",
  "rejected",
  "cancelled",
  "failed"
]);

const ALLOWED_TRANSITIONS = {
  requested: ["under_review", "cancelled"],
  under_review: ["approved", "rejected", "cancelled"],
  approved: ["processing", "cancelled"],
  processing: ["paid", "failed"],
  paid: [],
  rejected: [],
  cancelled: [],
  failed: ["processing"]
};

function clean(value) {
  return String(value || "").trim();
}

export function createPayoutRequest(input = {}) {
  const amount = Number(input.amount);

  if (!input.creatorId) {
    return {
      ok: false,
      status: "invalid",
      reason: "creatorId is required."
    };
  }

  if (!input.payoutRequestId) {
    return {
      ok: false,
      status: "invalid",
      reason: "payoutRequestId is required."
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      status: "invalid",
      reason: "Payout amount must be greater than zero."
    };
  }

  return {
    ok: true,
    status: "requested",
    payoutRequestId: clean(input.payoutRequestId),
    creatorId: clean(input.creatorId),
    amount,
    currency: clean(input.currency || "USD"),
    availableBalance: Number(input.availableBalance),
    createdAt: input.createdAt || new Date().toISOString(),
    reason: "Payout request created and awaiting review."
  };
}

export function transitionPayoutStatus(input = {}) {
  const currentStatus = clean(input.currentStatus);
  const nextStatus = clean(input.nextStatus);

  if (!PAYOUT_STATUSES.includes(currentStatus)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Invalid current payout status."
    };
  }

  if (!PAYOUT_STATUSES.includes(nextStatus)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Invalid next payout status."
    };
  }

  if (TERMINAL_STATUSES.has(currentStatus)) {
    return {
      ok: false,
      status: "invalid_transition",
      reason: "Terminal payout statuses cannot be changed."
    };
  }

  if (!ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)) {
    return {
      ok: false,
      status: "invalid_transition",
      reason: "This payout status transition is not allowed."
    };
  }

  return {
    ok: true,
    status: nextStatus,
    from: currentStatus,
    to: nextStatus,
    reason: "Payout status transition is allowed."
  };
}
