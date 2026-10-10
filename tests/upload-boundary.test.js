import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.js";

function storageReadyEnv() {
  return {
    ELASTICLAKE_ENDPOINT: "https://storage.example.invalid",
    ELASTICLAKE_BUCKET: "xkiss-test-bucket",
    ELASTICLAKE_REGION: "auto",
    ELASTICLAKE_ACCESS_KEY_ID: "test-access-key",
    ELASTICLAKE_SECRET_ACCESS_KEY: "test-secret-key",
    XKISS_UPLOAD_KEY: "test-upload-key"
  };
}

test("upload status does not advertise upload readiness before ownership and safety gates", async () => {
  const response = await worker.fetch(
    new Request("https://worker.example/api/upload/status"),
    storageReadyEnv()
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.storageReady, true);
  assert.equal(body.uploadEndpoint, false);
  assert.equal(body.uploadEnabled, false);
  assert.equal(body.ownershipReady, false);
  assert.equal(body.safetyReady, false);
  assert.equal(body.status, "blocked");
});

test("upload preparation fails closed even when storage and shared upload key are configured", async () => {
  const response = await worker.fetch(
    new Request("https://worker.example/api/upload/prepare", {
      method: "POST",
      headers: { "content-type": "application/json", "X-XKiss-Upload-Key": "test-upload-key" },
      body: JSON.stringify({ fileName: "clip.mp4", contentType: "video/mp4", title: "Test clip" })
    }),
    storageReadyEnv()
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.uploadEnabled, false);
  assert.equal(body.status, "creator_content_ownership_required");
});

test("actual upload fails closed and never stores a file before ownership and safety gates", async () => {
  const response = await worker.fetch(
    new Request("https://worker.example/api/upload", {
      method: "POST",
      headers: { "X-XKiss-Upload-Key": "test-upload-key", "X-XKiss-File-Name": "clip.mp4" },
      body: "synthetic-test-bytes"
    }),
    storageReadyEnv()
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.uploadEnabled, false);
  assert.equal(body.status, "creator_content_ownership_required");
  assert.match(body.message, /No file was stored/);
});
