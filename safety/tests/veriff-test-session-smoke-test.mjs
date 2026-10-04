const apiKey = process.env.VERIFF_API_KEY;
const baseUrl = String(process.env.VERIFF_BASE_URL || "https://api-saas.veriff.com").replace(/\/$/, "");

if (!apiKey) throw new Error("VERIFF_API_KEY is not configured");

const response = await fetch(`${baseUrl}/v1/sessions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-AUTH-CLIENT": apiKey
  },
  body: JSON.stringify({
    verification: {
      vendorData: `xkiss-github-test-${Date.now()}`
    }
  })
});

const payload = await response.json().catch(() => null);

if (!response.ok || payload?.status !== "success" || !payload?.verification?.id || !payload?.verification?.url) {
  throw new Error(JSON.stringify({
    httpStatus: response.status,
    providerStatus: payload?.status || null,
    verificationId: payload?.verification?.id || null
  }));
}

console.log("VERIFF TEST SESSION: PASS");
console.log(`verificationId=${payload.verification.id}`);
console.log("verificationUrl=present");
