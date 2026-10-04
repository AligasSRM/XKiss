import { verifyDiditWebhook } from "../../safety/didit-kyc-provider.js";

const secret = "didit-self-test-secret";
const timestamp = Math.floor(Date.now() / 1000);
const payload = {
  session_id: "didit-self-test-session",
  status: "Approved",
  vendor_data: "xkiss-self-test",
  timestamp
};

function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort()
      .map((key) => JSON.stringify(key) + ":" + canonical(value[key]))
      .join(",") + "}";
  }
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(Number(value.toString()));
  return JSON.stringify(value);
}

const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"]
);
const signature = await crypto.subtle.sign(
  "HMAC",
  key,
  new TextEncoder().encode(canonical(payload))
);
const hex = [...new Uint8Array(signature)]
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

const request = new Request("https://xkiss.test/api/verification/didit/webhook", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "X-Signature-V2": hex,
    "X-Timestamp": String(timestamp)
  },
  body: JSON.stringify(payload)
});

const result = await verifyDiditWebhook(request, { DIDIT_WEBHOOK_SECRET: secret });

if (!result.ok || result.sessionId !== payload.session_id || result.verificationStatus !== "Approved") {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

const stalePayload = { ...payload, timestamp: timestamp - 301 };
const staleSignature = await crypto.subtle.sign(
  "HMAC",
  key,
  new TextEncoder().encode(canonical(stalePayload))
);
const staleHex = [...new Uint8Array(staleSignature)]
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

const staleRequest = new Request("https://xkiss.test/api/verification/didit/webhook", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "X-Signature-V2": staleHex,
    "X-Timestamp": String(timestamp - 301)
  },
  body: JSON.stringify(stalePayload)
});

const staleResult = await verifyDiditWebhook(staleRequest, { DIDIT_WEBHOOK_SECRET: secret });

if (staleResult.ok || staleResult.status !== "stale_webhook") {
  console.error(JSON.stringify(staleResult, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  provider: "didit",
  signatureVerification: true,
  freshnessVerification: true,
  sessionId: result.sessionId,
  status: result.verificationStatus
}, null, 2));
