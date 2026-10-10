const ALLOWED_OUTCOMES = new Set(["allowed", "denied", "error"]);

export async function recordAdminSecurityAudit(env, event) {
  const db = env?.XKISS_ADMIN_AUDIT;
  if (!db || typeof db.prepare !== "function") {
    return { ok: false, status: "audit_backend_not_configured" };
  }
  const action = typeof event?.action === "string" ? event.action.slice(0, 120) : "admin_authorize";
  const outcome = ALLOWED_OUTCOMES.has(event?.outcome) ? event.outcome : "error";
  const reason = typeof event?.reason === "string" ? event.reason.slice(0, 240) : null;
  const target = typeof event?.target === "string" ? event.target.slice(0, 160) : null;
  const actorId = typeof event?.actorUserId === "string" ? event.actorUserId.slice(0, 128) : null;
  const actorEmail = typeof event?.actorEmail === "string" ? event.actorEmail.slice(0, 254) : null;
  const requestId = typeof event?.requestId === "string" ? event.requestId.slice(0, 128) : null;
  try {
    await db.prepare(
      "INSERT INTO admin_security_audit (id, actor_user_id, actor_email, action, target, outcome, reason, request_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
    ).bind(crypto.randomUUID(), actorId, actorEmail, action, target, outcome, reason, requestId, new Date().toISOString()).run();
    return { ok: true, recorded: true };
  } catch {
    return { ok: false, status: "audit_write_failed" };
  }
}
