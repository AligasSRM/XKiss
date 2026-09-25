import { WALLET_RULES } from "./wallet-rules.js";

export const WALLET_SETTLEMENT_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,
  settlementRequires: [
    "qualified_revenue",
    "settlement_confirmation",
    "no_active_refund_or_chargeback_hold"
  ],
  automaticSettlementDelayDays: null,
  payoutUnlockedBySettlement: true
};

function clean(value) {
  return String(value || "").trim();
}

export function evaluatePendingSettlement(input = {}) {
  if (!input.creatorId) {
    return {
      ok: false,
      status: "invalid",
      settled: false,
      reason: "creatorId is required."
    };
  }

  if (!input.revenueEventId) {
    return {
      ok: false,
      status: "invalid",
      settled: false,
      reason: "revenueEventId is required."
    };
  }

  const amount = Number(input.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      status: "invalid",
      settled: false,
      reason: "Settlement amount must be greater than zero."
    };
  }

  if (!input.revenueQualified) {
    return {
      ok: true,
      status: "not_eligible",
      settled: false,
      reason: "Revenue must be qualified before settlement."
    };
  }

  if (!input.settlementConfirmed) {
    return {
      ok: true,
      status: "pending_settlement",
      settled: false,
      reason: "Settlement has not been confirmed yet."
    };
  }

  if (input.refundOrChargebackHold) {
    return {
      ok: true,
      status: "on_hold",
      settled: false,
      reason: "Settlement is on hold because of an active refund or chargeback review."
    };
  }

  if (!WALLET_RULES.enabled || !WALLET_SETTLEMENT_RULES.enabled) {
    return {
      ok: true,
      status: "wallet_pending",
      settled: false,
      balanceType: "pending",
      creatorId: clean(input.creatorId),
      amount,
      currency: WALLET_RULES.currency,
      referenceId: clean(input.revenueEventId),
      reason: "Settlement rules are prepared, but wallet settlement is not enabled yet."
    };
  }

  return {
    ok: true,
    status: "settlement_ready",
    settled: true,
    creatorId: clean(input.creatorId),
    amount,
    currency: WALLET_RULES.currency,
    referenceId: clean(input.revenueEventId),
    fromBalanceType: "pending",
    toBalanceType: "available",
    reason: "The earning passed the current settlement checks and is ready to move from pending to available."
  };
}
