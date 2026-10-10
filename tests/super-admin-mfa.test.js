import test from "node:test";
import assert from "node:assert/strict";
import {
  beginSuperAdminMfaEnrollment,
  verifyAndEnableSuperAdminMfa,
  verifySuperAdminMfaForSession,
  requiresSuperAdminMfa
} from "../security/super-admin-mfa.js";

test("Super Admin role is the only role requiring MFA", () => {
  assert.equal(requiresSuperAdminMfa("super_admin"), true);
  assert.equal(requiresSuperAdminMfa("admin"), false);
  assert.equal(requiresSuperAdminMfa("member"), false);
});

test("MFA enrollment fails closed without reauthentication", async () => {
  const result = await beginSuperAdminMfaEnrollment({ XKISS_AUTH_DB: {} }, { id:"u1", email:"admin@example.com", role:"super_admin" }, { sessionId:"s1" });
  assert.deepEqual(result, { ok:false, status:"reauthentication_required" });
});

test("MFA cannot be enrolled for non-super-admin users", async () => {
  const result = await beginSuperAdminMfaEnrollment({}, { id:"u1", role:"admin" }, {});
  assert.deepEqual(result, { ok:false, status:"forbidden" });
});

test("MFA verification fails closed for non-super-admin users", async () => {
  const result = await verifySuperAdminMfaForSession({}, { id:"u1", role:"admin" }, {}, "123456");
  assert.deepEqual(result, { ok:false, status:"forbidden" });
});

test("MFA enablement requires recent password reauthentication", async () => {
  const result = await verifyAndEnableSuperAdminMfa({ XKISS_AUTH_DB:{} }, { id:"u1", role:"super_admin" }, { sessionId:"s1" }, "123456");
  assert.deepEqual(result, { ok:false, status:"reauthentication_required" });
});
