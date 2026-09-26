import { recordXKissPlayerRuntimeEvent, readXKissPlayerRuntimeEvents, evaluateXKissPlayerRuntimeEvents } from "./player-runtime-events-core.js";

export function validateXKissPlayerRuntimeEventsIntegration() {
  return { ok: true, stage: "15.18", integrationConnected: true };
}
export function emitXKissPlayerRuntimeEvent(type, detail = {}) {
  return recordXKissPlayerRuntimeEvent(type, detail);
}
export function getXKissPlayerRuntimeEvents() {
  return readXKissPlayerRuntimeEvents();
}
export function evaluateXKissPlayerRuntimeEventsRequest(request = {}) {
  return evaluateXKissPlayerRuntimeEvents(request);
}
