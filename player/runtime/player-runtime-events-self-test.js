import { recordXKissPlayerRuntimeEvent, readXKissPlayerRuntimeEvents, evaluateXKissPlayerRuntimeEvents } from "./player-runtime-events-core.js";

export function runXKissPlayerRuntimeEventsSelfCheck() {
  const before = readXKissPlayerRuntimeEvents().length;
  const emitted = recordXKissPlayerRuntimeEvent("test", { ok: true });
  const after = readXKissPlayerRuntimeEvents();
  const valid = evaluateXKissPlayerRuntimeEvents({
    operation: "emit", playerCoreConnected: true, runtimeStateConnected: true
  });
  const denied = evaluateXKissPlayerRuntimeEvents({
    operation: "emit", playerCoreConnected: true, runtimeStateConnected: false
  });
  const checks = {
    stage: true,
    eventRecorded: emitted.ok === true && after.length === before + 1,
    payloadPreserved: after.at(-1)?.detail?.ok === true,
    validAccepted: valid.allowed === true,
    invalidDenied: denied.allowed === false
  };
  return { ok: Object.values(checks).every(Boolean), stage: "15.18", checks };
}
