import { validateXKissPlayerRuntimeEventsRequest } from "./player-runtime-events-rules.js";

export const XKISS_PLAYER_RUNTIME_EVENTS_CORE = {
  section: "15.18",
  name: "XKiss Player Runtime Events Core",
  version: "1.0.0",
  status: "connected",
  failClosed: true
};

const events = [];

export function recordXKissPlayerRuntimeEvent(type, detail = {}) {
  if (!type) return { ok: false, reason: "event_type_missing" };
  const event = { type, timestamp: Date.now(), detail: { ...detail } };
  events.push(event);
  if (events.length > 100) events.shift();
  return { ok: true, event };
}

export function readXKissPlayerRuntimeEvents() {
  return events.map(event => ({ ...event, detail: { ...event.detail } }));
}

export function evaluateXKissPlayerRuntimeEvents(request = {}) {
  const validation = validateXKissPlayerRuntimeEventsRequest(request);
  return { allowed: validation.allowed === true, gates: validation.gates };
}
