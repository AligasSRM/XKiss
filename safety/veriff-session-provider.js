const DEFAULT_BASE_URL = "https://api-saas.veriff.com";

function getBaseUrl(env) {
  return String(env.VERIFF_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

export async function createVeriffSession(env, input = {}) {
  const apiKey = env.VERIFF_API_KEY;

  if (!apiKey) {
    throw new Error("VERIFF_API_KEY is not configured");
  }

  const vendorData = input.vendorData == null ? null : String(input.vendorData);
  const endUserId = input.endUserId == null ? null : String(input.endUserId);
  const callback = input.callback == null ? null : String(input.callback);

  if (vendorData && vendorData.length > 1000) {
    return { ok: false, status: "invalid_vendor_data" };
  }

  if (endUserId && endUserId.length > 1000) {
    return { ok: false, status: "invalid_end_user_id" };
  }

  const verification = {};
  if (vendorData) verification.vendorData = vendorData;
  if (endUserId) verification.endUserId = endUserId;
  if (callback) verification.callback = callback;

  const response = await fetch(`${getBaseUrl(env)}/v1/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-AUTH-CLIENT": apiKey
    },
    body: JSON.stringify({ verification })
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      status: "invalid_veriff_response",
      providerHttpStatus: response.status
    };
  }

  if (!response.ok || payload?.status !== "success") {
    return {
      ok: false,
      status: "veriff_session_creation_failed",
      providerHttpStatus: response.status,
      providerStatus: payload?.status || null
    };
  }

  const verificationResponse = payload.verification || {};

  if (!verificationResponse.id || !verificationResponse.url) {
    return {
      ok: false,
      status: "veriff_session_response_incomplete",
      providerHttpStatus: response.status
    };
  }

  return {
    ok: true,
    verificationId: verificationResponse.id,
    verificationUrl: verificationResponse.url,
    sessionToken: verificationResponse.sessionToken || null,
    vendorData: verificationResponse.vendorData || vendorData,
    endUserId: verificationResponse.endUserId || endUserId,
    status: verificationResponse.status || "created"
  };
}
