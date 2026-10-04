const textEncoder = new TextEncoder();

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(payload)
  );

  return toHex(signature);
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export async function verifyVeriffWebhook(request, env) {
  const secret = env.VERIFF_SHARED_SECRET;
  const expectedClient = env.VERIFF_API_KEY;

  if (!secret) {
    throw new Error("VERIFF_SHARED_SECRET is not configured");
  }

  if (!expectedClient) {
    throw new Error("VERIFF_API_KEY is not configured");
  }

  const rawBody = await request.text();

  const signature =
    request.headers.get("x-hmac-signature") ||
    request.headers.get("X-HMAC-SIGNATURE");

  const authClient =
    request.headers.get("x-auth-client") ||
    request.headers.get("X-AUTH-CLIENT");

  if (!signature || !authClient) {
    return {
      ok: false,
      error: "missing_veriff_signature_headers"
    };
  }

  if (!safeEqual(authClient, expectedClient)) {
    return {
      ok: false,
      error: "invalid_veriff_auth_client"
    };
  }

  const expectedSignature = await hmacSha256(secret, rawBody);

  if (!safeEqual(signature.toLowerCase(), expectedSignature.toLowerCase())) {
    return {
      ok: false,
      error: "invalid_veriff_hmac_signature"
    };
  }

  let payload;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return {
      ok: false,
      error: "invalid_veriff_json"
    };
  }

  const verification = payload.verification || {};

  return {
    ok: true,
    verificationId: verification.id || null,
    status: verification.status || null,
    vendorData: verification.vendorData || null,
    payload
  };
}

export function mapVeriffVerificationState(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "approved") {
    return "verified";
  }

  if (normalized === "declined") {
    return "rejected";
  }

  if (
    normalized === "resubmission_requested" ||
    normalized === "review"
  ) {
    return "review";
  }

  if (
    normalized === "expired" ||
    normalized === "abandoned"
  ) {
    return "expired";
  }

  return "pending";
}
