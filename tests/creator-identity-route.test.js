import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.js";

function makeEnv({ profile = null, schemaReady = true } = {}) {
  const state = { profile, inserts: [], schemaReady };
  const sessionRow = {
    session_id: "test-session",
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    id: "server-derived-user",
    email: "test@example.invalid",
    role: "member",
    status: "active",
    created_at: new Date().toISOString()
  };

  const env = {
    XKISS_AUTH_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async first() {
                if (sql.includes("FROM sessions s JOIN users u")) return sessionRow;
                if (sql.includes("FROM creator_profiles")) {
                  if (!state.schemaReady) throw new Error("no such table: creator_profiles");
                  return state.profile;
                }
                return null;
              },
              async run() {
                if (sql.includes("INSERT INTO creator_profiles")) {
                  if (!state.schemaReady) throw new Error("no such table: creator_profiles");
                  state.inserts.push(values);
                  state.profile = {
                    id: values[0],
                    user_id: values[1],
                    display_name: values[2],
                    status: "pending",
                    verification_state: "unverified",
                    created_at: values[3],
                    updated_at: values[3]
                  };
                  return { success: true };
                }
                return { success: true };
              }
            };
          }
        };
      }
    }
  };
  return { env, state };
}

function profileRequest(method, body, token = "valid-session-token") {
  const headers = { "content-type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("https://worker.example/api/creator/profile", {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(body)
  });
}

test("creator profile route rejects requests without an authenticated session", async () => {
  const { env } = makeEnv();
  const response = await worker.fetch(profileRequest("POST", { displayName: "Ali Creator" }, null), env);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).status, "unauthorized");
});

test("creator profile is mapped to the server-authenticated user, not client identity fields", async () => {
  const { env, state } = makeEnv();
  const response = await worker.fetch(profileRequest("POST", {
    displayName: "Ali Creator",
    userId: "attacker-user",
    creatorId: "victim-creator",
    status: "active",
    verificationState: "verified"
  }), env);

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.status, "created");
  assert.equal(body.creator.userId, "server-derived-user");
  assert.notEqual(body.creator.id, "victim-creator");
  assert.equal(body.creator.status, "pending");
  assert.equal(body.creator.verificationState, "unverified");
  assert.equal(state.inserts.length, 1);
  assert.equal(state.inserts[0][1], "server-derived-user");
});

test("creator profile creation is idempotent for the same account", async () => {
  const { env, state } = makeEnv();
  const first = await worker.fetch(profileRequest("POST", { displayName: "Ali Creator" }), env);
  const second = await worker.fetch(profileRequest("POST", { displayName: "Changed Name" }), env);

  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  const body = await second.json();
  assert.equal(body.status, "already_exists");
  assert.equal(body.creator.displayName, "Ali Creator");
  assert.equal(state.inserts.length, 1);
});

test("creator profile rejects invalid display names without writing", async () => {
  const { env, state } = makeEnv();
  const response = await worker.fetch(profileRequest("POST", { displayName: " " }), env);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).status, "invalid_display_name");
  assert.equal(state.inserts.length, 0);
});

test("creator profile fails closed when its migration is not applied", async () => {
  const { env } = makeEnv({ schemaReady: false });
  const response = await worker.fetch(profileRequest("GET", null), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "creator_identity_schema_not_ready");
});
