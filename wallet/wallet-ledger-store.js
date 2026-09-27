import { isStorageReady, storeJsonObject, getJsonObject } from "../storage/r2-adapter.js";

const WALLET_LEDGER_PREFIX = "wallet-ledger:";

export function isWalletLedgerReady(env) {
  return Boolean(env && (env.XKISS_WALLET_LEDGER || isStorageReady(env)));
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

  if (env.XKISS_WALLET_LEDGER) {
    const existing = await env.XKISS_WALLET_LEDGER.get(key);

    if (existing) {
      return {
        ok: true,
        storageReady: true,
        status: "duplicate",
        recorded: false,
        key,
        storage: "XKISS_WALLET_LEDGER"
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
      key,
      storage: "XKISS_WALLET_LEDGER"
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

  const existing = await getJsonObject(env, key);

  if (existing.value) {
    return {
      ok: true,
      storageReady: true,
      status: "duplicate",
      recorded: false,
      key,
      storage: "IDrive e2"
    };
  }

  await storeJsonObject(env, key, record);

  return {
    ok: true,
    storageReady: true,
    status: "stored",
    recorded: true,
    key,
    storage: "IDrive e2"
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

  if (env.XKISS_WALLET_LEDGER) {
    const value = await env.XKISS_WALLET_LEDGER.get(key, "json");

    return {
      ok: true,
      storageReady: true,
      status: value ? "found" : "not-found",
      key,
      entry: value || null,
      storage: "XKISS_WALLET_LEDGER"
    };
  }

  const result = await getJsonObject(env, key);

  return {
    ok: true,
    storageReady: true,
    status: result.value ? "found" : "not-found",
    key,
    entry: result.value || null,
    storage: "IDrive e2"
  };
}
