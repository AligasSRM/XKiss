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

function request(body, token, path = "/api/admin/authorize", method = "POST") {
  const headers = { "content-type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request(`https://worker.example${path}`, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(body)
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

test("registration returns 400 for invalid input instead of 201", async () => {
  const response = await worker.fetch(
    request({ email: "not-an-email", password: "long-enough-password" }, null, "/api/auth/register"),
    makeEnv()
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).status, "invalid_input");
});

test("registration returns 400 for a non-object JSON body", async () => {
  const response = await worker.fetch(
    new Request("https://worker.example/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "null"
    }),
    makeEnv()
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).status, "invalid_input");
});

test("storage self-test rejects unauthenticated public requests", async () => {
  const response = await worker.fetch(
    request({}, null, "/api/views/storage/self-test", "GET"),
    makeEnv()
  );
  assert.equal(response.status, 401);
  assert.equal((await response.json()).status, "unauthorized");
});

test("storage self-test denies authenticated members without storage permission", async () => {
  const response = await worker.fetch(
    request({}, "valid-session-token", "/api/views/storage/self-test", "GET"),
    makeEnv("member")
  );
  assert.equal(response.status, 403);
  assert.equal((await response.json()).status, "forbidden");
});

test("wallet ledger writes require a session and remain server-generated only", async () => {
  const unauthenticated = await worker.fetch(
    request({ creatorId: "victim", entryId: "e1", amount: 999999 }, null, "/api/wallet/ledger/store"),
    makeEnv()
  );
  assert.equal(unauthenticated.status, 401);

  const authenticated = await worker.fetch(
    request({ creatorId: "victim", entryId: "e1", amount: 999999 }, "valid-session-token", "/api/wallet/ledger/store"),
    makeEnv("member")
  );
  assert.equal(authenticated.status, 403);
  assert.equal((await authenticated.json()).status, "server_generated_entries_only");
});

test("wallet ledger reads require a session and fail closed without verified creator mapping", async () => {
  const response = await worker.fetch(
    request({ creatorId: "victim", entryId: "e1" }, "valid-session-token", "/api/wallet/ledger/get"),
    makeEnv("member")
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "creator_identity_mapping_required");
});

test("client-supplied payout authorization flags cannot authorize real payouts", async () => {
  const unauthenticated = await worker.fetch(
    request({ authenticated: true, creatorVerified: true, payoutProfileReady: true, reauthenticated: true }, null, "/api/wallet/payout/authorize"),
    makeEnv("admin")
  );
  assert.equal(unauthenticated.status, 401);

  const authenticated = await worker.fetch(
    request({ authenticated: true, creatorId: "victim", requestCreatorId: "victim", creatorVerified: true, payoutProfileReady: true, reauthenticated: true }, "valid-session-token", "/api/wallet/payout/authorize"),
    makeEnv("admin")
  );
  assert.equal(authenticated.status, 403);
  const body = await authenticated.json();
  assert.equal(body.authorized, false);
  assert.equal(body.payoutEnabled, false);
  assert.equal(body.status, "payouts_disabled");
});
