const DISPLAY_NAME_MIN = 2;
const DISPLAY_NAME_MAX = 80;

function clean(value) {
  return String(value ?? "").trim();
}

function toPublicProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    status: row.status,
    verificationState: row.verification_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function validateDisplayName(value) {
  const displayName = clean(value);
  if (
    displayName.length < DISPLAY_NAME_MIN ||
    displayName.length > DISPLAY_NAME_MAX ||
    /[\u0000-\u001F\u007F]/.test(displayName)
  ) {
    return { ok: false, status: "invalid_display_name" };
  }
  return { ok: true, displayName };
}

export async function getCreatorProfileByUserId(env, userId) {
  if (!env?.XKISS_AUTH_DB) {
    return { ok: false, status: "backend_not_configured", creator: null };
  }
  const trustedUserId = clean(userId);
  if (!trustedUserId) {
    return { ok: false, status: "invalid_user", creator: null };
  }

  const row = await env.XKISS_AUTH_DB.prepare(
    "SELECT id,user_id,display_name,status,verification_state,created_at,updated_at FROM creator_profiles WHERE user_id=?1 LIMIT 1"
  ).bind(trustedUserId).first();

  return {
    ok: true,
    status: row ? "found" : "not_found",
    creator: toPublicProfile(row)
  };
}

export async function createCreatorProfile(env, { userId, displayName } = {}) {
  if (!env?.XKISS_AUTH_DB) {
    return { ok: false, status: "backend_not_configured", creator: null };
  }

  const trustedUserId = clean(userId);
  if (!trustedUserId) {
    return { ok: false, status: "invalid_user", creator: null };
  }

  const validatedName = validateDisplayName(displayName);
  if (!validatedName.ok) {
    return { ...validatedName, creator: null };
  }

  const existing = await getCreatorProfileByUserId(env, trustedUserId);
  if (!existing.ok) return existing;
  if (existing.creator) {
    return { ok: true, status: "already_exists", created: false, creator: existing.creator };
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const row = {
    id,
    user_id: trustedUserId,
    display_name: validatedName.displayName,
    status: "pending",
    verification_state: "unverified",
    created_at: now,
    updated_at: now
  };

  try {
    await env.XKISS_AUTH_DB.prepare(
      "INSERT INTO creator_profiles (id,user_id,display_name,status,verification_state,created_at,updated_at) VALUES (?1,?2,?3,'pending','unverified',?4,?4)"
    ).bind(id, trustedUserId, validatedName.displayName, now).run();
  } catch (error) {
    // A concurrent request may have won the UNIQUE(user_id) race. Return only the row
    // bound to this authenticated account; never trust a client-supplied creator ID.
    const afterRace = await getCreatorProfileByUserId(env, trustedUserId);
    if (afterRace.ok && afterRace.creator) {
      return { ok: true, status: "already_exists", created: false, creator: afterRace.creator };
    }
    throw error;
  }

  return { ok: true, status: "created", created: true, creator: toPublicProfile(row) };
}

export const CREATOR_IDENTITY_SECURITY = Object.freeze({
  creatorIdServerGenerated: true,
  accountIdServerDerived: true,
  oneCreatorProfilePerAccount: true,
  initialStatus: "pending",
  initialVerificationState: "unverified",
  clientCannotSetStatus: true,
  clientCannotSetVerificationState: true,
  failClosed: true
});
