import { isStorageReady, storeJsonObject, getJsonObject, deleteJsonObject } from "../storage/r2-adapter.js";

const VIEW_EVENT_PREFIX = "view-events/";

export function isViewEventStoreReady(env) {
  return Boolean(env && isStorageReady(env));
}

function clean(value) {
  return String(value || "").trim();
}

export function createViewEventStorageKey(input = {}) {
  return VIEW_EVENT_PREFIX + [
    clean(input.videoId),
    clean(input.viewerSessionId),
    clean(input.eventId)
  ].join(":");
}

export async function storeViewEvent(env, event, options = {}) {
  if (!isViewEventStoreReady(env)) {
    return {
      ok: false,
      storageReady: false,
      status: "storage-not-ready",
      message: "Backblaze B2 durable view event storage is not connected yet."
    };
  }

  const key = createViewEventStorageKey(event);
  const qualified = Boolean(options.qualified);
  const counted = Boolean(options.counted);

  const record = {
    eventId: clean(event.eventId),
    eventType: clean(event.eventType || "view"),
    videoId: clean(event.videoId),
    creatorId: clean(event.creatorId),
    viewerSessionId: clean(event.viewerSessionId),
    playbackSignal: clean(event.playbackSignal),
    watchSeconds: Number.isFinite(Number(event.watchSeconds)) ? Number(event.watchSeconds) : null,
    watchPercent: Number.isFinite(Number(event.watchPercent)) ? Number(event.watchPercent) : null,
    occurredAt: event.occurredAt || null,
    storedAt: new Date().toISOString(),
    counted,
    qualified
  };

  const existing = await getJsonObject(env, key);

  if (existing.value) {
    return {
      ok: true,
      storageReady: true,
      status: "duplicate",
      counted: Boolean(existing.value.counted),
      qualified: Boolean(existing.value.qualified),
      key,
      storage: "Backblaze B2"
    };
  }

  return {
    ...(await storeJsonObject(env, key, record)),
    counted,
    qualified
  };
}

export async function commitQualifiedView(env, event) {
  return storeViewEvent(env, event, {
    qualified: true,
    counted: true
  });
}

export async function getViewEvent(env, event) {
  if (!isViewEventStoreReady(env)) {
    return {
      ok: false,
      storageReady: false,
      status: "storage-not-ready"
    };
  }

  const key = createViewEventStorageKey(event);
  const result = await getJsonObject(env, key);

  return {
    ok: true,
    storageReady: true,
    status: result.value ? "found" : "not-found",
    key,
    event: result.value || null,
    storage: "Backblaze B2"
  };
}

export async function deleteViewEvent(env, event) {
  if (!isViewEventStoreReady(env)) {
    return {
      ok: false,
      storageReady: false,
      status: "storage-not-ready"
    };
  }

  const key = createViewEventStorageKey(event);
  return deleteJsonObject(env, key);
}
