export const SUPER_ADMIN_MFA_FRESHNESS_MS = 5 * 60 * 1000;

/**
 * Only accept a real, non-future MFA timestamp inside the authorization window.
 */
export function isRecentSuperAdminMfa(mfaVerifiedAt, now = Date.now()) {
  if (typeof mfaVerifiedAt !== "string" || !mfaVerifiedAt) return false;
  const verifiedAt = Date.parse(mfaVerifiedAt);
  if (!Number.isFinite(verifiedAt) || !Number.isFinite(now)) return false;
  const age = now - verifiedAt;
  return age >= 0 && age <= SUPER_ADMIN_MFA_FRESHNESS_MS;
}
