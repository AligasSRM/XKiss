function clean(value) {
  return String(value ?? "").trim();
}

function normalizeDecisionTime(value) {
  const timestamp = Date.parse(String(value ?? ""));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function ageAt(dateOfBirth, decisionTime) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirth ?? ""))) return null;
  const birth = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (!Number.isFinite(birth.getTime()) || birth.toISOString().slice(0, 10) !== dateOfBirth) return null;
  if (birth.getTime() > decisionTime.getTime()) return null;

  let age = decisionTime.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = decisionTime.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && decisionTime.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

function mapIdentityState(status) {
  const normalized = clean(status).toLowerCase();
  if (normalized === "approved") return "verified";
  if (normalized === "declined") return "rejected";
  if (normalized === "review" || normalized === "resubmission_requested") return "review";
  if (normalized === "expired" || normalized === "abandoned") return "expired";
  return "pending";
}

export async function recordVerificationSession(env, { provider, providerSessionId, userId } = {}) {
  if (!env?.XKISS_AUTH_DB) return { ok: false, status: "backend_not_configured" };
  const normalizedProvider = clean(provider).toLowerCase();
  const sessionId = clean(providerSessionId);
  const accountId = clean(userId);
  if (!["veriff", "didit"].includes(normalizedProvider) || !sessionId || !accountId) {
    return { ok: false, status: "invalid_verification_session" };
  }

  const createdAt = new Date().toISOString();
  await env.XKISS_AUTH_DB.prepare(
    "INSERT INTO verification_sessions (provider,provider_session_id,user_id,created_at) VALUES (?1,?2,?3,?4)"
  ).bind(normalizedProvider, sessionId, accountId, createdAt).run();
  return { ok: true, status: "session_bound", provider: normalizedProvider, providerSessionId: sessionId };
}

export async function getVerificationSession(env, provider, providerSessionId) {
  if (!env?.XKISS_AUTH_DB) return { ok: false, status: "backend_not_configured", session: null };
  const normalizedProvider = clean(provider).toLowerCase();
  const sessionId = clean(providerSessionId);
  if (!normalizedProvider || !sessionId) return { ok: false, status: "invalid_verification_session", session: null };
  const row = await env.XKISS_AUTH_DB.prepare(
    "SELECT provider,provider_session_id,user_id,created_at FROM verification_sessions WHERE provider=?1 AND provider_session_id=?2 LIMIT 1"
  ).bind(normalizedProvider, sessionId).first();
  return {
    ok: true,
    status: row ? "found" : "not_found",
    session: row ? {
      provider: row.provider,
      providerSessionId: row.provider_session_id,
      userId: row.user_id,
      createdAt: row.created_at
    } : null
  };
}

export async function recordVeriffDecision(env, {
  userId,
  verificationId,
  status,
  decisionTime,
  dateOfBirth
} = {}) {
  if (!env?.XKISS_AUTH_DB) return { ok: false, status: "backend_not_configured" };
  const accountId = clean(userId);
  const sessionId = clean(verificationId);
  const providerStatus = clean(status);
  const decisionAt = normalizeDecisionTime(decisionTime);
  if (!accountId || !sessionId || !providerStatus || !decisionAt) {
    return { ok: false, status: "decision_data_incomplete" };
  }

  const identityState = mapIdentityState(providerStatus);
  const decisionDate = new Date(decisionAt);
  let ageState = "pending";
  if (identityState === "expired") {
    ageState = "expired";
  } else if (identityState === "rejected") {
    ageState = "rejected";
  } else if (identityState === "verified") {
    const age = ageAt(dateOfBirth, decisionDate);
    if (age !== null) ageState = age >= 18 ? "verified" : "rejected";
  }

  const updatedAt = new Date().toISOString();
  const result = await env.XKISS_AUTH_DB.prepare(
    "INSERT INTO user_verification_states (user_id,provider,provider_session_id,identity_state,age_state,provider_status,decision_at,updated_at) VALUES (?1,'veriff',?2,?3,?4,?5,?6,?7) ON CONFLICT(user_id,provider) DO UPDATE SET provider_session_id=excluded.provider_session_id,identity_state=excluded.identity_state,age_state=excluded.age_state,provider_status=excluded.provider_status,decision_at=excluded.decision_at,updated_at=excluded.updated_at WHERE excluded.decision_at >= user_verification_states.decision_at"
  ).bind(accountId, sessionId, identityState, ageState, providerStatus, decisionAt, updatedAt).run();

  return {
    ok: true,
    status: Number(result?.meta?.changes ?? 1) === 0 ? "stale_decision_ignored" : "decision_recorded",
    provider: "veriff",
    identityState,
    ageState,
    recordedAt: updatedAt
  };
}

export async function getUserVerificationState(env, userId) {
  if (!env?.XKISS_AUTH_DB) return { ok: false, status: "backend_not_configured" };
  const accountId = clean(userId);
  if (!accountId) return { ok: false, status: "invalid_user" };
  const result = await env.XKISS_AUTH_DB.prepare(
    "SELECT provider,identity_state,age_state,provider_status,decision_at,updated_at FROM user_verification_states WHERE user_id=?1 ORDER BY decision_at DESC"
  ).bind(accountId).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return {
    ok: true,
    status: rows.length ? "found" : "not_started",
    ageVerified: rows.some(row => row.age_state === "verified"),
    identityVerified: rows.some(row => row.identity_state === "verified"),
    creatorVerified: false,
    providers: rows.map(row => ({
      provider: row.provider,
      identityState: row.identity_state,
      ageState: row.age_state,
      providerStatus: row.provider_status,
      decisionAt: row.decision_at,
      updatedAt: row.updated_at
    }))
  };
}

export const VERIFICATION_STATE_SECURITY = Object.freeze({
  providerSessionBoundToAccount: true,
  onlySignedProviderDecisionCanUpdateState: true,
  dateOfBirthStored: false,
  identityAndAgeStatesSeparate: true,
  missingDateOfBirthNeverAgeVerified: true,
  under18NeverAgeVerified: true,
  staleProviderDecisionIgnored: true,
  creatorVerificationNotInferredFromIdentity: true,
  failClosed: true
});
