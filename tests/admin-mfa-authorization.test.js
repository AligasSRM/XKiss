import test from "node:test";
import assert from "node:assert/strict";
import { isRecentSuperAdminMfa, SUPER_ADMIN_MFA_FRESHNESS_MS } from "../security/admin-mfa-authorization.js";

const now = Date.parse("2026-10-11T12:00:00.000Z");

test("accepts a recent MFA verification timestamp", () => {
  assert.equal(isRecentSuperAdminMfa(new Date(now - 60_000).toISOString(), now), true);
});

test("accepts MFA verification exactly at the freshness boundary", () => {
  assert.equal(isRecentSuperAdminMfa(new Date(now - SUPER_ADMIN_MFA_FRESHNESS_MS).toISOString(), now), true);
});

test("rejects missing, invalid, and future MFA timestamps", () => {
  assert.equal(isRecentSuperAdminMfa(null, now), false);
  assert.equal(isRecentSuperAdminMfa("not-a-date", now), false);
  assert.equal(isRecentSuperAdminMfa(new Date(now + 1).toISOString(), now), false);
});

test("rejects MFA verification older than five minutes", () => {
  assert.equal(isRecentSuperAdminMfa(new Date(now - SUPER_ADMIN_MFA_FRESHNESS_MS - 1).toISOString(), now), false);
});
