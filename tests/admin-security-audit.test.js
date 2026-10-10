import test from "node:test";
import assert from "node:assert/strict";
import { recordAdminSecurityAudit } from "../security/admin-security-audit.js";

test("records an authorization decision without exposing secrets", async () => {
  let statement = "";
  let values = [];
  const env = {
    XKISS_ADMIN_AUDIT: {
      prepare(sql) {
        statement = sql;
        return { bind(...args) { values = args; return { async run() { return { success: true }; } }; } };
      }
    }
  };
  const result = await recordAdminSecurityAudit(env, {
    actorUserId: "user-1",
    actorEmail: "admin@example.com",
    action: "admin_authorize",
    target: "manage_users",
    outcome: "denied",
    reason: "forbidden",
    requestId: "request-1"
  });
  assert.deepEqual(result, { ok: true, recorded: true });
  assert.match(statement, /INSERT INTO admin_security_audit/);
  assert.equal(values[1], "user-1");
  assert.equal(values[2], "admin@example.com");
  assert.equal(values[5], "denied");
  assert.equal(values[7], "request-1");
  assert.ok(typeof values[0] === "string" && values[0].length > 10);
  assert.ok(typeof values[8] === "string" && !Number.isNaN(Date.parse(values[8])));
});

test("fails closed when the audit binding is absent", async () => {
  assert.deepEqual(await recordAdminSecurityAudit({}, { outcome: "allowed" }), {
    ok: false,
    status: "audit_backend_not_configured"
  });
});

test("fails closed when the durable audit write fails", async () => {
  const env = {
    XKISS_ADMIN_AUDIT: {
      prepare() {
        return { bind() { return { async run() { throw new Error("database unavailable"); } }; } };
      }
    }
  };
  assert.deepEqual(await recordAdminSecurityAudit(env, { outcome: "allowed" }), {
    ok: false,
    status: "audit_write_failed"
  });
});
