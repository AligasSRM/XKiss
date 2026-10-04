import assert from "node:assert/strict";
import { createVeriffSession } from "../veriff-session-provider.js";

const originalFetch = globalThis.fetch;

try {
  let capturedRequest = null;

  globalThis.fetch = async (url, options) => {
    capturedRequest = { url, options };

    return new Response(JSON.stringify({
      status: "success",
      verification: {
        id: "test-verification-id",
        url: "https://example.veriff.com/v/test-token",
        sessionToken: "test-session-token",
        vendorData: "test-vendor-data",
        endUserId: "test-end-user-id",
        status: "created"
      }
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const result = await createVeriffSession(
    {
      VERIFF_API_KEY: "test-veriff-api-key",
      VERIFF_BASE_URL: "https://api-saas.veriff.com"
    },
    {
      vendorData: "test-vendor-data",
      endUserId: "test-end-user-id"
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.verificationId, "test-verification-id");
  assert.equal(result.verificationUrl, "https://example.veriff.com/v/test-token");
  assert.equal(result.status, "created");

  assert.equal(capturedRequest.url, "https://api-saas.veriff.com/v1/sessions");
  assert.equal(capturedRequest.options.method, "POST");
  assert.equal(capturedRequest.options.headers["X-AUTH-CLIENT"], "test-veriff-api-key");

  const requestBody = JSON.parse(capturedRequest.options.body);
  assert.deepEqual(requestBody, {
    verification: {
      vendorData: "test-vendor-data",
      endUserId: "test-end-user-id"
    }
  });

  console.log("VERIFF SESSION PROVIDER SELF-TEST: PASS");
} finally {
  globalThis.fetch = originalFetch;
}
