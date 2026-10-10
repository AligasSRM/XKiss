import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.js";

function makeEnv({ profile = null, failVideoInsert = false } = {}) {
  const state = { inserted: null, failVideoInsert };
  const sessionRow = {
    session_id: "session-1",
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    id: "user-from-session",
    email: "creator@example.invalid",
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
                  if (!profile) return null;
                  return profile;
                }
                return null;
              },
              async run() {
                if (sql.includes("INSERT INTO creator_videos")) {
                  if (state.failVideoInsert) throw new Error("table unavailable");
                  state.inserted = { sql, values };
                  return { success: true };
                }
                return { success: true };
              },
              async all() { return { results: [] }; }
            };
          }
        };
      }
    }
  };
  return { env, state };
}

const profile = {
  id: "creator-from-profile",
  user_id: "user-from-session",
  display_name: "Creator",
  status: "pending",
  verification_state: "unverified",
  created_at: "2026-10-10T00:00:00.000Z",
  updated_at: "2026-10-10T00:00:00.000Z"
};

function draftRequest(body, token = "valid-session") {
  const headers = { "content-type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("https://worker.example/api/creator/videos/drafts", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
}

const validDraft = {
  title: "My private draft",
  description: "Draft metadata only",
  category: "education",
  contentType: "video/mp4",
  sizeBytes: 1024
};

test("authenticated creator can create a private owner-bound draft without uploading a file", async () => {
  const { env, state } = makeEnv({ profile });
  const response = await worker.fetch(draftRequest({
    ...validDraft,
    creatorId: "attacker-selected-creator",
    userId: "attacker-selected-user",
    visibility: "public",
    downloadPolicy: "allowed",
    status: "approved",
    verificationState: "verified"
  }), env);
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.status, "draft_created");
  assert.equal(body.uploadEnabled, false);
  assert.equal(body.video.status, "pending_upload");
  assert.equal(body.video.visibility, "private");
  assert.equal(body.video.downloadPolicy, "disabled");
  assert.equal(body.video.object_key, undefined);
  assert.equal(state.inserted.values[1], profile.id);
  assert.equal(state.inserted.values[4], validDraft.description);
  assert.equal(state.inserted.values[5], validDraft.category);
});

test("creator video draft endpoint requires an authenticated session", async () => {
  const { env, state } = makeEnv({ profile });
  const response = await worker.fetch(draftRequest(validDraft, null), env);
  assert.equal(response.status, 401);
  assert.equal(state.inserted, null);
});

test("creator video draft endpoint requires an existing creator profile", async () => {
  const { env, state } = makeEnv();
  const response = await worker.fetch(draftRequest(validDraft), env);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).status, "creator_profile_required");
  assert.equal(state.inserted, null);
});

test("creator video draft validates type, size and title before writing", async () => {
  const { env, state } = makeEnv({ profile });
  const response = await worker.fetch(draftRequest({
    ...validDraft,
    title: " ",
    contentType: "application/x-executable",
    sizeBytes: -1
  }), env);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).status, "invalid_title");
  assert.equal(state.inserted, null);
});

test("creator video draft fails closed when the metadata table is unavailable", async () => {
  const { env } = makeEnv({ profile, failVideoInsert: true });
  const response = await worker.fetch(draftRequest(validDraft), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "creator_video_schema_not_ready");
});

test("draft metadata does not enable the upload endpoint", async () => {
  const { env } = makeEnv({ profile });
  const response = await worker.fetch(new Request("https://worker.example/api/upload/status"), env);
  const body = await response.json();
  assert.equal(body.uploadEnabled, false);
  assert.equal(body.status, "blocked");
});
