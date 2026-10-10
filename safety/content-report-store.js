const REPORT_REASONS = new Set([
  "underage",
  "nonconsensual",
  "illegal_content",
  "abuse",
  "copyright",
  "spam",
  "privacy",
  "other"
]);

export async function createContentReport(env, reporterUserId, input = {}) {
  if (!env?.XKISS_AUTH_DB) {
    return { ok: false, status: "backend_not_configured", report: null };
  }
  const reporterId = String(reporterUserId ?? "").trim();
  const videoId = String(input.videoId ?? "").trim();
  const reason = String(input.reason ?? "").trim().toLowerCase();
  const details = String(input.details ?? "").trim();

  if (!reporterId) return { ok: false, status: "invalid_reporter", report: null };
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(videoId)) {
    return { ok: false, status: "invalid_video_id", report: null };
  }
  if (!REPORT_REASONS.has(reason)) {
    return { ok: false, status: "invalid_reason", report: null };
  }
  if (details.length > 1000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(details)) {
    return { ok: false, status: "invalid_details", report: null };
  }

  const target = await env.XKISS_AUTH_DB.prepare(
    "SELECT id FROM creator_videos WHERE id=?1 AND visibility='public' AND status='approved' LIMIT 1"
  ).bind(videoId).first();
  if (!target) return { ok: false, status: "reportable_content_not_found", report: null };

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await env.XKISS_AUTH_DB.prepare(
      "INSERT INTO content_reports (id,reporter_user_id,target_video_id,reason,details,status,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,'open',?6,?6)"
    ).bind(id, reporterId, videoId, reason, details, now).run();
  } catch (error) {
    const message = String(error?.message || error || "").toLowerCase();
    if (message.includes("unique") || message.includes("constraint")) {
      return { ok: false, status: "duplicate_open_report", report: null };
    }
    throw error;
  }

  return {
    ok: true,
    status: "report_recorded",
    report: { id, videoId, reason, status: "open", createdAt: now }
  };
}

export const CONTENT_REPORT_SECURITY = Object.freeze({
  reporterIdentityServerDerived: true,
  reportableContentMustBePublicAndApproved: true,
  duplicateOpenReportsPrevented: true,
  moderationStatusClientControlled: false,
  detailsLengthLimited: true,
  failClosed: true
});


export async function listContentReports(env, limit = 50) {
  if (!env?.XKISS_AUTH_DB) {
    return { ok: false, status: "backend_not_configured", reports: [] };
  }
  const boundedLimit = Math.max(1, Math.min(100, Number.isInteger(limit) ? limit : 50));
  const result = await env.XKISS_AUTH_DB.prepare(
    "SELECT id,reporter_user_id,target_video_id,reason,details,status,created_at,updated_at FROM content_reports ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END, created_at ASC LIMIT ?1"
  ).bind(boundedLimit).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return {
    ok: true,
    status: "found",
    reports: rows.map(row => ({
      id: row.id,
      reporterUserId: row.reporter_user_id,
      videoId: row.target_video_id,
      reason: row.reason,
      details: row.details || "",
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  };
}

export async function reviewContentReport(env, moderatorUserId, input = {}) {
  if (!env?.XKISS_AUTH_DB) {
    return { ok: false, status: "backend_not_configured" };
  }
  const moderatorId = String(moderatorUserId ?? "").trim();
  const reportId = String(input.reportId ?? "").trim();
  const action = String(input.action ?? "").trim().toLowerCase();
  const notes = String(input.notes ?? "").trim();

  if (!moderatorId) return { ok: false, status: "invalid_moderator" };
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(reportId)) return { ok: false, status: "invalid_report_id" };
  if (!new Set(["reviewing", "actioned", "dismissed"]).has(action)) {
    return { ok: false, status: "invalid_action" };
  }
  if (notes.length > 1000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(notes)) {
    return { ok: false, status: "invalid_notes" };
  }

  const current = await env.XKISS_AUTH_DB.prepare(
    "SELECT id,status FROM content_reports WHERE id=?1 LIMIT 1"
  ).bind(reportId).first();
  if (!current) return { ok: false, status: "report_not_found" };
  if (!["open", "reviewing"].includes(current.status)) {
    return { ok: false, status: "report_already_closed" };
  }

  const actionId = crypto.randomUUID();
  const now = new Date().toISOString();
  const update = env.XKISS_AUTH_DB.prepare(
    "UPDATE content_reports SET status=?2,updated_at=?3 WHERE id=?1 AND status IN ('open','reviewing')"
  ).bind(reportId, action, now);
  const audit = env.XKISS_AUTH_DB.prepare(
    "INSERT INTO content_moderation_actions (id,report_id,moderator_user_id,action,notes,created_at) SELECT ?1,?2,?3,?4,?5,?6 WHERE EXISTS (SELECT 1 FROM content_reports WHERE id=?2 AND status=?4 AND updated_at=?6)"
  ).bind(actionId, reportId, moderatorId, action, notes, now);

  if (typeof env.XKISS_AUTH_DB.batch !== "function") {
    return { ok: false, status: "atomic_moderation_storage_required" };
  }
  const results = await env.XKISS_AUTH_DB.batch([update, audit]);
  const changes = Number(results?.[0]?.meta?.changes ?? results?.[0]?.changes ?? 0);
  if (changes < 1) return { ok: false, status: "report_state_conflict" };

  return {
    ok: true,
    status: "report_updated",
    report: { id: reportId, status: action, updatedAt: now },
    auditActionId: actionId
  };
}
