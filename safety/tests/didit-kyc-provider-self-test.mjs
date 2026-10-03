import { verifyDiditWebhook } from "../../safety/didit-kyc-provider.js";

const secret = "didit-self-test-secret";
const payload = {
  session_id: "didit-self-test-session",
  status: "Approved",
  vendor_data: "xkiss-self-test"
};

function normalize(value) {
  if (typeof value === "number") return Number(value.toString());
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = normalize(value[key]);
      return out;
    }, {});
  }
  return value;
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
  new TextEncoder().encode(JSON.stringify(normalize(payload)))
);
const hex = [...new Uint8Array(signature)]
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

const request = new Request("https://xkiss.test/api/verification/didit/webhook", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "X-Signature-V2": hex
  },
  body: JSON.stringify(payload)
});

const result = await verifyDiditWebhook(request, { DIDIT_WEBHOOK_SECRET: secret });

if (!result.ok || result.sessionId !== payload.session_id || result.verificationStatus !== "Approved") {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  provider: "didit",
  signatureVerification: true,
  sessionId: result.sessionId,
  status: result.verificationStatus
}, null, 2));
