import { WALLET_RULES, createWalletEntry } from "./wallet-rules.js";

export function createPendingEarningFromRevenue(input = {}) {
  const creatorAmount = Number(input.creatorAmount);

  if (!input.creatorId) {
    return {
      ok: false,
      status: "invalid",
      reason: "creatorId is required."
    };
  }

  if (!input.revenueEventId) {
    return {
      ok: false,
      status: "invalid",
      reason: "revenueEventId is required."
    };
  }

  if (!Number.isFinite(creatorAmount) || creatorAmount <= 0) {
    return {
      ok: false,
      status: "invalid",
      reason: "Creator revenue amount must be greater than zero."
    };
  }

  if (!WALLET_RULES.enabled) {
    return {
      ok: true,
      status: "wallet_pending",
      recorded: false,
      balanceType: "pending",
      creatorId: String(input.creatorId),
      amount: creatorAmount,
      currency: WALLET_RULES.currency,
      referenceId: String(input.revenueEventId),
      reason: "Revenue is eligible for a pending wallet entry, but the creator wallet is not enabled yet."
    };
  }

  const entry = createWalletEntry({
    entryId: input.entryId || input.revenueEventId,
    creatorId: input.creatorId,
    type: "earning",
    amount: creatorAmount,
    currency: WALLET_RULES.currency,
    balanceType: "pending",
    referenceId: input.revenueEventId,
    occurredAt: input.occurredAt
  });

  return {
    ...entry,
    balanceType: "pending",
    settlementStatus: "pending"
  };
}

export function evaluateRevenueToWallet(input = {}) {
  if (!input.revenueQualified) {
    return {
      ok: true,
      status: "not_eligible",
      walletEntryCreated: false,
      reason: "Revenue must be qualified before it can create a wallet earning."
    };
  }

  return createPendingEarningFromRevenue(input);
}
