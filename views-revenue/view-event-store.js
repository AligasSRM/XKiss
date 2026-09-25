const VIEW_EVENT_PREFIX = "view-events:";

export function isViewEventStoreReady(env) {
  return Boolean(env && env.XKISS_VIEW_EVENTS);
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

export async function storeViewEvent(env, event) {
  if (!isViewEventStoreReady(env)) {
    return {
      ok: false,
      storageReady: false,
      status: "storage-not-ready",
      message: "Durable view event storage is not connected yet."
    };
  }

  const key = createViewEventStorageKey(event);

  const record = {
    eventId: clean(event.eventId),
    eventType: clean(event.eventType || "view"),
    videoId: clean(event.videoId),
    creatorId: clean(event.creatorId),
    viewerSessionId: clean(event.viewerSessionId),
    playbackSignal: clean(event.playbackSignal),
    occurredAt: event.occurredAt || null,
    storedAt: new Date().toISOString(),
    counted: false,
    qualified: false
  };

  const existing = await env.XKISS_VIEW_EVENTS.get(key);

  if (existing) {
    return {
      ok: true,
      storageReady: true,
      status: "duplicate",
      counted: false,
      key
    };
  }

  await env.XKISS_VIEW_EVENTS.put(key, JSON.stringify(record));

  return {
    ok: true,
    storageReady: true,
    status: "stored",
    counted: false,
    key
  };
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
  const value = await env.XKISS_VIEW_EVENTS.get(key, "json");

  return {
    ok: true,
    storageReady: true,
    status: value ? "found" : "not-found",
    key,
    event: value || null
  };
}
