import assert from "node:assert/strict";
import { verifyVeriffWebhook, mapVeriffVerificationState } from "../veriff-kyc-provider.js";

const secret = "test-veriff-shared-secret";
const apiKey = "test-veriff-api-key";

const payload = JSON.stringify({
  verification: {
    id: "test-verification-id",
    status: "approved",
    vendorData: "test-vendor-data"
  }
});

async function makeSignature(secretValue, body) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretValue),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );

  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const signature = await makeSignature(secret, payload);

const request = new Request("https://example.test/webhook", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-auth-client": apiKey,
    "x-hmac-signature": signature
  },
  body: payload
});

const result = await verifyVeriffWebhook(request, {
  VERIFF_SHARED_SECRET: secret,
  VERIFF_API_KEY: apiKey
});

assert.equal(result.ok, true);
assert.equal(result.verificationId, "test-verification-id");
assert.equal(result.status, "approved");
assert.equal(result.vendorData, "test-vendor-data");

assert.equal(
  mapVeriffVerificationState("approved"),
  "verified"
);

assert.equal(
  mapVeriffVerificationState("declined"),
  "rejected"
);

assert.equal(
  mapVeriffVerificationState("resubmission_requested"),
  "review"
);

console.log("VERIFF KYC PROVIDER SELF-TEST: PASS");
