import { WALLET_RULES } from "./wallet-rules.js";

export function evaluateWalletReversal(input = {}) {
  const amount = Number(input.amount);

  if (!input.creatorId) {
    return {
      ok: false,
      status: "invalid",
      reversalCreated: false,
      reason: "creatorId is required."
    };
  }

  if (!input.originalEntryId) {
    return {
      ok: false,
      status: "invalid",
      reversalCreated: false,
      reason: "originalEntryId is required."
    };
  }

  if (!input.reversalEventId) {
    return {
      ok: false,
      status: "invalid",
      reversalCreated: false,
      reason: "reversalEventId is required."
    };
  }

  if (!["refund", "chargeback"].includes(String(input.reversalType || ""))) {
    return {
      ok: false,
      status: "invalid",
      reversalCreated: false,
      reason: "reversalType must be refund or chargeback."
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      status: "invalid",
      reversalCreated: false,
      reason: "Reversal amount must be greater than zero."
    };
  }

  if (input.alreadyReversed) {
    return {
      ok: true,
      status: "duplicate",
      reversalCreated: false,
      reason: "The original wallet entry has already been reversed."
    };
  }

  if (!WALLET_RULES.enabled) {
    return {
      ok: true,
      status: "wallet_pending",
      reversalCreated: false,
      creatorId: String(input.creatorId),
      originalEntryId: String(input.originalEntryId),
      reversalEventId: String(input.reversalEventId),
      reversalType: String(input.reversalType),
      amount,
      currency: WALLET_RULES.currency,
      balanceEffect: "reverse_related_ledger_entry",
      reason: "Reversal rules are prepared, but the wallet is not enabled yet."
    };
  }

  return {
    ok: true,
    status: "reversal_ready",
    reversalCreated: true,
    creatorId: String(input.creatorId),
    originalEntryId: String(input.originalEntryId),
    reversalEventId: String(input.reversalEventId),
    reversalType: String(input.reversalType),
    amount,
    currency: WALLET_RULES.currency,
    balanceEffect: "reverse_related_ledger_entry",
    reason: "A reversal ledger entry is ready to offset the related earning."
  };
}
