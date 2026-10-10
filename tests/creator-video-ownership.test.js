import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.js";

function makeEnv({ profile = null, videos = [], creatorSchemaReady = true, videoSchemaReady = true } = {}) {
  const state = { profile, videos, creatorSchemaReady, videoSchemaReady, queriedCreatorId: null };
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
                  if (!state.creatorSchemaReady) throw new Error("no such table: creator_profiles");
                  return state.profile;
                }
                return null;
              },
              async all() {
                if (sql.includes("FROM creator_videos")) {
                  if (!state.videoSchemaReady) throw new Error("no such table: creator_videos");
                  state.queriedCreatorId = values[0];
                  return {
                    results: state.videos.filter(
                      video => video.creator_id === values[0] && video.status !== "removed"
                    )
                  };
                }
                return { results: [] };
              }
            };
          }
        };
      }
    }
  };
  return { env, state };
}

function request(token = "valid-session-token") {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("https://worker.example/api/creator/videos", { method: "GET", headers });
}

const ownProfile = {
  id: "creator-owned-by-session-user",
  user_id: "server-derived-user",
  display_name: "Creator",
  status: "pending",
  verification_state: "unverified",
  created_at: "2026-10-10T00:00:00.000Z",
  updated_at: "2026-10-10T00:00:00.000Z"
};

function video(id, creatorId, status = "uploaded") {
  return {
    id,
    creator_id: creatorId,
    object_key: `videos/${id}.mp4`,
    title: id,
    description: "test",
    category: "test",
    content_type: "video/mp4",
    size_bytes: 123,
    visibility: "private",
    download_policy: "disabled",
    status,
    created_at: "2026-10-10T00:00:00.000Z",
    updated_at: "2026-10-10T00:00:00.000Z"
  };
}

test("creator library returns only metadata owned by the server-derived creator profile", async () => {
  const { env, state } = makeEnv({
    profile: ownProfile,
    videos: [
      video("own-video", ownProfile.id),
      video("other-creator-video", "victim-creator"),
      video("removed-video", ownProfile.id, "removed")
    ]
  });
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.videos.map(item => item.id), ["own-video"]);
  assert.equal(state.queriedCreatorId, ownProfile.id);
  assert.equal(body.videos[0].object_key, undefined);
  assert.equal(body.videos[0].objectKey, undefined);
});

test("creator library denies accounts without a creator profile", async () => {
  const { env } = makeEnv({ profile: null });
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).status, "creator_profile_required");
});

test("creator library fails closed when creator identity migration is missing", async () => {
  const { env } = makeEnv({ creatorSchemaReady: false });
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "creator_identity_schema_not_ready");
});

test("creator library fails closed when owner-bound video metadata migration is missing", async () => {
  const { env } = makeEnv({ profile: ownProfile, videoSchemaReady: false });
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "creator_video_schema_not_ready");
});

test("creator library rejects unauthenticated access before querying creator data", async () => {
  const { env, state } = makeEnv({ profile: ownProfile, videos: [video("own-video", ownProfile.id)] });
  const response = await worker.fetch(request(null), env);
  assert.equal(response.status, 401);
  assert.equal(state.queriedCreatorId, null);
});
