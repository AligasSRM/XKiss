import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.js";

function makeEnv({ reportable = true, failInsert = false, duplicate = false } = {}) {
  const state = { inserted: null };
  const sessionRow = {
    session_id: "session-1",
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    id: "reporter-from-session",
    email: "reporter@example.invalid",
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
                if (sql.includes("FROM creator_videos")) {
                  return reportable ? { id: values[0] } : null;
                }
                return null;
              },
              async run() {
                if (sql.includes("INSERT INTO content_reports")) {
                  if (failInsert) throw new Error("table unavailable");
                  if (duplicate) throw new Error("UNIQUE constraint failed");
                  state.inserted = { sql, values };
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

function reportRequest(body, token = "valid-session") {
  const headers = { "content-type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("https://worker.example/api/safety/reports", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
}

const validReport = {
  videoId: "public-approved-video",
  reason: "privacy",
  details: "This video may disclose private information."
};

test("authenticated user can report public approved content with server-derived reporter identity", async () => {
  const { env, state } = makeEnv();
  const response = await worker.fetch(reportRequest({
    ...validReport,
    reporterUserId: "spoofed-user",
    status: "dismissed",
    moderatorId: "attacker"
  }), env);
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.status, "report_recorded");
  assert.equal(body.report.status, "open");
  assert.equal(state.inserted.values[1], "reporter-from-session");
  assert.equal(state.inserted.values[2], validReport.videoId);
  assert.equal(state.inserted.values[3], validReport.reason);
});

test("content reporting requires authentication", async () => {
  const { env, state } = makeEnv();
  const response = await worker.fetch(reportRequest(validReport, null), env);
  assert.equal(response.status, 401);
  assert.equal(state.inserted, null);
});

test("content reporting does not reveal or accept private/unapproved targets", async () => {
  const { env, state } = makeEnv({ reportable: false });
  const response = await worker.fetch(reportRequest(validReport), env);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).status, "reportable_content_not_found");
  assert.equal(state.inserted, null);
});

test("content reporting rejects invalid reason before persistence", async () => {
  const { env, state } = makeEnv();
  const response = await worker.fetch(reportRequest({ ...validReport, reason: "make-owner-admin" }), env);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).status, "invalid_reason");
  assert.equal(state.inserted, null);
});

test("content reporting rejects duplicate open reports", async () => {
  const { env, state } = makeEnv({ duplicate: true });
  const response = await worker.fetch(reportRequest(validReport), env);
  assert.equal(response.status, 409);
  assert.equal((await response.json()).status, "duplicate_open_report");
  assert.equal(state.inserted, null);
});

test("content reporting fails closed when durable report storage is unavailable", async () => {
  const { env } = makeEnv({ failInsert: true });
  const response = await worker.fetch(reportRequest(validReport), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "content_report_storage_not_ready");
});
