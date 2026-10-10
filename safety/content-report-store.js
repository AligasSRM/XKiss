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
