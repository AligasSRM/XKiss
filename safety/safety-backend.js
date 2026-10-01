import { isStorageReady, storeJsonObject } from "../storage/r2-adapter.js";

export const SAFETY_BACKEND = {
  version: "1.0",
  status: "configured",
  failClosed: true,
  requiredCapabilities: [
    "identity",
    "age_verification",
    "creator_verification",
    "moderation",
    "reporting",
    "audit",
    "privacy"
  ]
};

function envOn(env, key) {
  return String(env?.[key] || "").toLowerCase() === "true";
}

export function getSafetyBackendStatus(env = {}) {
  const storage = isStorageReady(env);
  const configured = Object.fromEntries(
    SAFETY_BACKEND.requiredCapabilities.map((capability) => [
      capability,
      envOn(env, "XKISS_SAFETY_" + capability.toUpperCase() + "_READY")
    ])
  );
  const missing = Object.keys(configured).filter((key) => !configured[key]);

  return {
    ok: true,
    service: "XKiss Safety Backend",
    version: SAFETY_BACKEND.version,
    status: missing.length === 0 && storage ? "ready" : "blocked",
    failClosed: SAFETY_BACKEND.failClosed,
    storageReady: storage,
    capabilities: configured,
    missingCapabilities: missing,
    enforcementEnabled: envOn(env, "XKISS_SAFETY_ENFORCEMENT_ENABLED"),
    activationAllowed: missing.length === 0 && storage,
    reason: missing.length === 0 && storage
      ? "All required safety capabilities and durable storage are configured."
      : "Safety enforcement remains blocked until every required capability and durable storage are configured."
  };
}

export function runSafetyBackendSelfTest(env = {}) {
  const status = getSafetyBackendStatus(env);
  const checks = [
    {
      name: "fail_closed",
      ok: status.failClosed === true && status.activationAllowed === false
    },
    {
      name: "durable_storage_gate",
      ok: status.storageReady === false ? status.activationAllowed === false : true
    },
    {
      name: "capability_gate",
      ok: status.missingCapabilities.length > 0 ? status.activationAllowed === false : true
    }
  ];

  return {
    ok: checks.every((check) => check.ok),
    service: "XKiss Safety Backend",
    status: "tested",
    enforcementEnabled: status.enforcementEnabled,
    activationAllowed: status.activationAllowed,
    checks
  };
}

export async function recordSafetyBackendEvent(env, event = {}) {
  if (!isStorageReady(env)) {
    return {
      ok: false,
      recorded: false,
      status: "storage-not-ready",
      reason: "Durable safety storage is required."
    };
  }

  const eventId = String(event.eventId || crypto.randomUUID());
  const key = "safety/audit/" + eventId + ".json";
  const result = await storeJsonObject(env, key, {
    eventId,
    recordedAt: new Date().toISOString(),
    ...event
  });

  return {
    ok: result.ok === true,
    recorded: result.ok === true,
    status: result.ok === true ? "recorded" : "failed",
    eventId,
    storage: "Backblaze B2"
  };
}
