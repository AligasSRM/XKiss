const WALLET_LEDGER_PREFIX = "wallet-ledger:";

export function isWalletLedgerReady(env) {
  return Boolean(env && env.XKISS_WALLET_LEDGER);
}

function clean(value) {
  return String(value || "").trim();
}

export function createWalletLedgerKey(input = {}) {
  return WALLET_LEDGER_PREFIX + [
    clean(input.creatorId),
    clean(input.entryId || input.referenceId)
  ].join(":");
}

export async function storeWalletEntry(env, entry) {
  if (!isWalletLedgerReady(env)) {
    return {
      ok: false,
      storageReady: false,
      status: "storage-not-ready",
      recorded: false,
      message: "Wallet ledger storage is not connected yet."
    };
  }

  const key = createWalletLedgerKey(entry);

  const existing = await env.XKISS_WALLET_LEDGER.get(key);

  if (existing) {
    return {
      ok: true,
      storageReady: true,
      status: "duplicate",
      recorded: false,
      key
    };
  }

  const record = {
    entryId: clean(entry.entryId),
    creatorId: clean(entry.creatorId),
    type: clean(entry.type),
    amount: Number(entry.amount),
    currency: clean(entry.currency || "USD"),
    balanceType: clean(entry.balanceType),
    referenceId: clean(entry.referenceId),
    occurredAt: entry.occurredAt || null,
    storedAt: new Date().toISOString()
  };

  await env.XKISS_WALLET_LEDGER.put(key, JSON.stringify(record));

  return {
    ok: true,
    storageReady: true,
    status: "stored",
    recorded: true,
    key
  };
}

export async function getWalletEntry(env, entry) {
  if (!isWalletLedgerReady(env)) {
    return {
      ok: false,
      storageReady: false,
      status: "storage-not-ready"
    };
  }

  const key = createWalletLedgerKey(entry);
  const value = await env.XKISS_WALLET_LEDGER.get(key, "json");

  return {
    ok: true,
    storageReady: true,
    status: value ? "found" : "not-found",
    key,
    entry: value || null
  };
}
