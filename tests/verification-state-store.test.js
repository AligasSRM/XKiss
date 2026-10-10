import test from "node:test";
import assert from "node:assert/strict";
import { recordVeriffDecision, getUserVerificationState } from "../safety/verification-state-store.js";

function envWith(result = { meta: { changes: 1 } }, rows = []) {
  const writes = [];
  return {
    writes,
    XKISS_AUTH_DB: {
      prepare(sql) {
        const q = { sql, values: [], bind(...values) { this.values = values; return this; },
          async run() { writes.push({ sql, values: q.values }); return result; },
          async all() { return { results: rows }; } };
        return q;
      }
    }
  };
}

test("approved provider decision without birth date is not age-verified", async () => {
  const env = envWith();
  const r = await recordVeriffDecision(env, { userId: "u1", verificationId: "s1", status: "approved", decisionTime: "2026-10-10T12:00:00Z" });
  assert.equal(r.identityState, "verified");
  assert.equal(r.ageState, "pending");
  assert.equal(env.writes.length, 1);
});

test("approved provider decision with qualifying birth date can verify age without storing the date", async () => {
  const env = envWith();
  const r = await recordVeriffDecision(env, { userId: "u1", verificationId: "s1", status: "approved", decisionTime: "2026-10-10T12:00:00Z", dateOfBirth: "2000-01-01" });
  assert.equal(r.ageState, "verified");
  assert.doesNotMatch(env.writes[0].sql, /date_of_birth/i);
});

test("verification state reports only minimized flags and does not infer creator verification", async () => {
  const env = envWith(undefined, [{ provider: "veriff", identity_state: "verified", age_state: "verified", provider_status: "approved", decision_at: "2026-10-10T12:00:00.000Z", updated_at: "2026-10-10T12:01:00.000Z" }]);
  const r = await getUserVerificationState(env, "u1");
  assert.equal(r.ageVerified, true);
  assert.equal(r.creatorVerified, false);
  assert.equal(JSON.stringify(r).includes("dateOfBirth"), false);
});
