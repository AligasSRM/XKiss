import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.js";

function makeEnv(role = "member") {
  return {
    TEST_ROLE: role,
    XKISS_AUTH_DB: {
      prepare() {
        return {
          bind() {
            return {
              async first() {
                return {
                  session_id: "test-session",
                  expires_at: new Date(Date.now() + 60_000).toISOString(),
                  id: "server-derived-user",
                  email: "test@example.invalid",
                  role,
                  status: "active",
                  created_at: new Date().toISOString()
                };
              }
            };
          }
        };
      }
    }
  };
}

function request(body, token) {
  const headers = { "content-type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("https://worker.example/api/admin/authorize", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
}

test("admin authorization rejects requests without a bearer session", async () => {
  const response = await worker.fetch(request({ user: { role: "admin", status: "active" }, permission: "manage_users" }), makeEnv());
  assert.equal(response.status, 401);
  assert.equal((await response.json()).status, "unauthorized");
});

test("admin authorization ignores client-supplied user and denies member session", async () => {
  const response = await worker.fetch(
    request({ user: { id: "attacker", role: "admin", status: "active" }, permission: "manage_users" }, "valid-session-token"),
    makeEnv("member")
  );
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.allowed, false);
  assert.equal(body.role, "member");
});

test("admin authorization derives admin role from authenticated server session", async () => {
  const response = await worker.fetch(
    request({ user: { id: "attacker", role: "member", status: "active" }, permission: "manage_users" }, "valid-session-token"),
    makeEnv("admin")
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.allowed, true);
  assert.equal(body.role, "admin");
});

test("admin authorization fails closed when auth database is missing", async () => {
  const response = await worker.fetch(
    request({ permission: "manage_users" }, "valid-session-token"),
    {}
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "backend_not_configured");
});
