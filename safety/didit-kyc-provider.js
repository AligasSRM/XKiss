const DIDIT_STATUS = new Set([
  "Approved",
  "Declined",
  "In Review",
  "Expired",
  "Not Finished",
  "Resubmitted"
]);

function canonical(value) {
  if (Array.isArray(value)) {
    return "[" + value.map(canonical).join(",") + "]";
  }
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort()
      .map((key) => JSON.stringify(key) + ":" + canonical(value[key]))
      .join(",") + "}";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return JSON.stringify(Number(value.toString()));
  }
  return JSON.stringify(value);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret, payload) {
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
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getSessionId(payload) {
  return String(
    payload?.session_id ||
    payload?.session?.id ||
    payload?.data?.session_id ||
    ""
  ).trim();
}

function getStatus(payload) {
  return String(
    payload?.status ||
    payload?.session?.status ||
    payload?.data?.status ||
    ""
  ).trim();
}

function getVendorData(payload) {
  return String(
    payload?.vendor_data ||
    payload?.session?.vendor_data ||
    payload?.data?.vendor_data ||
    ""
  ).trim();
}

function verifyFreshness(request, payload) {
  const timestamp = Number(payload?.timestamp);
  const headerTimestamp = String(request.headers.get("X-Timestamp") || "").trim();

  if (!Number.isFinite(timestamp) || !headerTimestamp || String(timestamp) !== headerTimestamp) {
    return false;
  }

  return Math.abs(Date.now() / 1000 - timestamp) <= 300;
}

export async function verifyDiditWebhook(request, env) {
  const secret = String(env?.DIDIT_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    return { ok: false, status: "provider_not_configured", reason: "Didit webhook secret is not configured." };
  }

  const signature = String(request.headers.get("X-Signature-V2") || "").trim();
  if (!signature) {
    return { ok: false, status: "invalid_signature", reason: "Missing X-Signature-V2." };
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return { ok: false, status: "invalid_payload", reason: "Invalid JSON payload." };
  }

  if (!verifyFreshness(request, payload)) {
    return { ok: false, status: "stale_webhook", reason: "Didit webhook timestamp is missing, mismatched, or expired." };
  }

  const expected = await hmacHex(secret, payload);
  if (!timingSafeEqual(expected, signature.toLowerCase())) {
    return { ok: false, status: "invalid_signature", reason: "Didit webhook signature verification failed." };
  }

  const sessionId = getSessionId(payload);
  const status = getStatus(payload);
  const vendorData = getVendorData(payload);

  if (!sessionId || !DIDIT_STATUS.has(status)) {
    return {
      ok: false,
      status: "invalid_payload",
      reason: "Didit webhook is missing a supported session_id or status."
    };
  }

  return {
    ok: true,
    status: "verified",
    provider: "didit",
    sessionId,
    verificationStatus: status,
    vendorData,
    payload
  };
}

export function mapDiditVerificationState(status) {
  if (status === "Approved") return "verified";
  if (status === "Declined") return "rejected";
  if (status === "In Review" || status === "Resubmitted") return "review";
  if (status === "Expired") return "expired";
  return "pending";
}
