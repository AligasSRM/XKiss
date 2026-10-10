import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.js";

function makeEnv({ role = "moderator", reportStatus = "open", failBatch = false } = {}) {
  const state = {
    report: {
      id: "report-1",
      reporter_user_id: "reporter-1",
      target_video_id: "video-1",
      reason: "privacy",
      details: "Privacy concern",
      status: reportStatus,
      created_at: "2026-10-10T00:00:00.000Z",
      updated_at: "2026-10-10T00:00:00.000Z"
    },
    actions: [],
    failBatch
  };
  const sessionRow = {
    session_id: "session-1",
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    id: "moderator-from-session",
    email: "moderator@example.invalid",
    role,
    status: "active",
    created_at: new Date().toISOString()
  };
  const env = {
    XKISS_AUTH_DB: {
      prepare(sql) {
        const statement = {
          sql,
          values: [],
          bind(...values) { this.values = values; return this; },
          async first() {
            if (sql.includes("FROM sessions s JOIN users u")) return sessionRow;
            if (sql.includes("FROM content_reports WHERE id=")) {
              return state.report?.id === statement.values[0]
                ? { id: state.report.id, status: state.report.status }
                : null;
            }
            return null;
          },
          async all() {
            if (sql.includes("FROM content_reports ORDER BY")) {
              return { results: state.report ? [{ ...state.report }] : [] };
            }
            return { results: [] };
          },
          async run() { return { success: true }; }
        };
        return statement;
      },
      async batch(statements) {
        if (state.failBatch) throw new Error("batch unavailable");
        const update = statements[0];
        const audit = statements[1];
        const [reportId, action, now] = update.values;
        if (!state.report || state.report.id !== reportId || !["open", "reviewing"].includes(state.report.status)) {
          return [{ meta: { changes: 0 } }, { meta: { changes: 0 } }];
        }
        state.report.status = action;
        state.report.updated_at = now;
        const [auditId, auditReportId, moderatorId, auditAction, notes, createdAt] = audit.values;
        if (state.report.id === auditReportId && state.report.status === auditAction && state.report.updated_at === createdAt) {
          state.actions.push({ id: auditId, reportId: auditReportId, moderatorId, action: auditAction, notes, createdAt });
        }
        return [{ meta: { changes: 1 } }, { meta: { changes: state.actions.length ? 1 : 0 } }];
      }
    }
  };
  return { env, state };
}

function request(path, method = "GET", body = undefined, token = "valid-session") {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  return new Request(`https://worker.example${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

test("report queue requires a session with view_reports permission", async () => {
  const { env } = makeEnv({ role: "member" });
  const response = await worker.fetch(request("/api/safety/reports"), env);
  assert.equal(response.status, 403);
});

test("moderator can read the report queue", async () => {
  const { env } = makeEnv();
  const response = await worker.fetch(request("/api/safety/reports"), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.reports.length, 1);
  assert.equal(body.reports[0].id, "report-1");
});

test("moderator can review a report and audit identity comes from the session", async () => {
  const { env, state } = makeEnv();
  const response = await worker.fetch(request("/api/safety/reports/review", "POST", {
    reportId: "report-1",
    action: "actioned",
    notes: "Reviewed against policy",
    moderatorUserId: "spoofed-moderator"
  }), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.report.status, "actioned");
  assert.equal(state.actions.length, 1);
  assert.equal(state.actions[0].moderatorId, "moderator-from-session");
  assert.equal(state.actions[0].action, "actioned");
});

test("member cannot review reports", async () => {
  const { env, state } = makeEnv({ role: "member" });
  const response = await worker.fetch(request("/api/safety/reports/review", "POST", {
    reportId: "report-1", action: "dismissed"
  }), env);
  assert.equal(response.status, 403);
  assert.equal(state.actions.length, 0);
});

test("super-admin report review fails closed without MFA", async () => {
  const { env, state } = makeEnv({ role: "super_admin" });
  const response = await worker.fetch(request("/api/safety/reports/review", "POST", {
    reportId: "report-1", action: "dismissed"
  }), env);
  assert.equal(response.status, 403);
  assert.equal((await response.json()).status, "mfa_required");
  assert.equal(state.actions.length, 0);
});

test("closed reports cannot be changed again", async () => {
  const { env, state } = makeEnv({ reportStatus: "dismissed" });
  const response = await worker.fetch(request("/api/safety/reports/review", "POST", {
    reportId: "report-1", action: "actioned"
  }), env);
  assert.equal(response.status, 409);
  assert.equal((await response.json()).status, "report_already_closed");
  assert.equal(state.actions.length, 0);
});

test("moderation update fails closed if atomic audit persistence is unavailable", async () => {
  const { env, state } = makeEnv({ failBatch: true });
  const response = await worker.fetch(request("/api/safety/reports/review", "POST", {
    reportId: "report-1", action: "reviewing"
  }), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "content_moderation_storage_not_ready");
  assert.equal(state.actions.length, 0);
});
