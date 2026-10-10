import { getXKissSettingsRuntimeStatus } from "./settings/xkiss-settings-runtime-core.js";
import { isStorageReady } from "./storage/elasticlake-adapter.js";
import {
  MONETIZATION_RULES,
  CREATOR_ELIGIBILITY_RULES,
  evaluateCreatorEligibility,
  calculateRevenue,
  MONETIZATION_POLICY_RULES,
  evaluateMonetizationPolicy,
  CREATOR_ACTIVATION_RULES,
  evaluateCreatorActivation
} from "./monetization/monetization-rules.js";
import {
  isViewEventStoreReady,
  storeViewEvent,
  getViewEvent,
  deleteViewEvent
} from "./views-revenue/view-event-store.js";
import { evaluateViewPipeline } from "./views-revenue/view-pipeline.js";
import { evaluateViewCountDecision } from "./views-revenue/view-count-decision.js";
import { isWalletLedgerReady } from "./wallet/wallet-ledger-store.js";
import { evaluateRevenueToWallet } from "./wallet/revenue-to-wallet.js";
import { evaluatePendingSettlement, WALLET_SETTLEMENT_RULES } from "./wallet/wallet-settlement.js";
import { evaluateWalletReversal } from "./wallet/wallet-reversals.js";
import { evaluatePayoutEligibility } from "./wallet/payout-eligibility.js";
import { createPayoutRequest, transitionPayoutStatus, PAYOUT_LIFECYCLE_RULES } from "./wallet/payout-lifecycle.js";
import { createPayoutAuditEvent, buildPayoutHistory, PAYOUT_AUDIT_RULES } from "./wallet/payout-audit.js";
import { evaluatePayoutAuthorization, PAYOUT_SECURITY_RULES } from "./wallet/payout-security.js";
import {
  VIEWS_REVENUE_RULES,
  validateViewEvent,
  evaluateViewCount,
  evaluateQualifiedView,
  evaluateTrafficQuality,
  validateRevenueEvent
} from "./views-revenue/views-revenue-rules.js";
import { runSafetySelfTest, getSafetyVerificationOverview } from "./safety/safety-integration.js";
import { getSafetyBackendStatus, runSafetyBackendSelfTest, recordSafetyBackendEvent } from "./safety/safety-backend.js";
import { createContentReport, listContentReports, reviewContentReport, CONTENT_REPORT_SECURITY } from "./safety/content-report-store.js";
import { recordVerificationSession, getVerificationSession, recordVeriffDecision, getUserVerificationState, VERIFICATION_STATE_SECURITY } from "./safety/verification-state-store.js";
import { verifyDiditWebhook, mapDiditVerificationState } from "./safety/didit-kyc-provider.js";
import { verifyVeriffWebhook, mapVeriffVerificationState } from "./safety/veriff-kyc-provider.js";
import { createVeriffSession } from "./safety/veriff-session-provider.js";
import { registerMember, loginMember, authenticateSession, logoutMember, AUTH_SECURITY_INVARIANTS } from "./security/xkiss-auth-backend.js";
import { getCreatorProfileByUserId, createCreatorProfile, CREATOR_IDENTITY_SECURITY } from "./creator/creator-identity.js";
import { listCreatorVideosForCreator, createCreatorVideoDraft, CREATOR_VIDEO_OWNERSHIP_SECURITY } from "./creator/creator-video-store.js";
import { adminBackendStatus, authorizeAdminAction, ADMIN_BACKEND_SECURITY } from "./admin/xkiss-admin-backend.js";
import { settingsBackendStatus, validateSettingsBackendAction, SETTINGS_BACKEND_SECURITY } from "./settings/xkiss-settings-backend.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://aligassrm.github.io",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-XKiss-Upload-Key, X-XKiss-File-Name, X-XKiss-Title, X-XKiss-Description, X-XKiss-Category, X-XKiss-Download-Policy, X-XKiss-Visibility",
  "Vary": "Origin"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      ...CORS_HEADERS
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const storageReady = isStorageReady(env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (url.pathname === "/api/auth/security" && request.method === "GET") {
      return json({ ok: true, service: "XKiss Authentication Security", invariants: AUTH_SECURITY_INVARIANTS });
    }

    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) return json({ ok: false, status: "backend_not_configured" }, 503);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, status: "invalid_input" }, 400);
      }

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ ok: false, status: "invalid_input" }, 400);
      }

      try {
        const result = await registerMember(env, body);
        const status = result.ok
          ? 201
          : result.status === "already_exists"
            ? 409
            : result.status === "invalid_input"
              ? 400
              : 503;
        return json(result, status);
      } catch {
        return json({ ok: false, status: "registration_unavailable" }, 503);
      }
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) return json({ ok: false, status: "backend_not_configured" }, 503);
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, status: "invalid_credentials" }, 401); }
      const result = await loginMember(env, body);
      return json(result, result.ok ? 200 : 401);
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      if (!env.XKISS_AUTH_DB) return json({ ok: false, status: "backend_not_configured" }, 503);
      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      const result = await authenticateSession(env, token);
      return json(result, result.ok ? 200 : 401);
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) return json({ ok: false, status: "backend_not_configured" }, 503);
      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      return json(await logoutMember(env, token));
    }

    if (url.pathname === "/api/admin/backend/status" && request.method === "GET") {
      return json(adminBackendStatus(env));
    }

    if (url.pathname === "/api/admin/authorize" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, allowed: false, status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

      if (!token) {
        return json({ ok: false, allowed: false, status: "unauthorized" }, 401);
      }

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, allowed: false, status: "authorization_unavailable" }, 503);
      }

      if (!session?.ok || !session.user) {
        return json({ ok: false, allowed: false, status: "unauthorized" }, 401);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, allowed: false, status: "invalid_input" }, 400);
      }

      const result = authorizeAdminAction(session.user, body.permission);
      return json(result, result.allowed ? 200 : 403);
    }

    if (url.pathname === "/api/admin/security" && request.method === "GET") {
      return json({ok:true,service:"XKiss Admin Security",security:ADMIN_BACKEND_SECURITY});
    }

    if (url.pathname === "/api/settings/backend/status" && request.method === "GET") {
      return json(settingsBackendStatus(env));
    }

    if (url.pathname === "/api/settings/backend/action" && request.method === "POST") {
      let body; try { body = await request.json(); } catch { return json({ok:false,status:"invalid_input"},400); }
      return json(validateSettingsBackendAction(body));
    }

    if (url.pathname === "/api/settings/backend/security" && request.method === "GET") {
      return json({ok:true,service:"XKiss Settings Backend Security",security:SETTINGS_BACKEND_SECURITY});
    }

    if (url.pathname === "/api/settings/status" && request.method === "GET") {
      return json(getXKissSettingsRuntimeStatus());
    }

    if (url.pathname === "/api/health") {
      return json({
        service: "XKiss Worker",
        status: "online",
        storageReady,
        uploadEndpoint: true
      });
    }

    if (url.pathname === "/api/safety/reports" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) return json({ ok: false, status: "unauthorized" }, 401);

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) {
        return json({ ok: false, status: "unauthorized" }, 401);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, status: "invalid_input" }, 400);
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ ok: false, status: "invalid_input" }, 400);
      }

      try {
        const result = await createContentReport(env, session.user.id, {
          videoId: body.videoId,
          reason: body.reason,
          details: body.details
        });
        const statusCode = result.ok ? 201
          : result.status === "duplicate_open_report" ? 409
          : result.status === "reportable_content_not_found" ? 404
          : result.status.startsWith("invalid_") ? 400
          : 503;
        return json({ ...result, security: CONTENT_REPORT_SECURITY }, statusCode);
      } catch {
        return json({ ok: false, status: "content_report_storage_not_ready" }, 503);
      }
    }

    if (url.pathname === "/api/safety/reports" && request.method === "GET") {
      if (!env.XKISS_AUTH_DB) return json({ ok: false, status: "backend_not_configured" }, 503);
      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) return json({ ok: false, status: "unauthorized" }, 401);

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) return json({ ok: false, status: "unauthorized" }, 401);
      const permission = authorizeAdminAction(session.user, "view_reports");
      if (!permission.allowed) return json({ ok: false, status: permission.status }, 403);

      try {
        const result = await listContentReports(env);
        return json({ ...result, security: CONTENT_REPORT_SECURITY }, result.ok ? 200 : 503);
      } catch {
        return json({ ok: false, status: "content_report_storage_not_ready", reports: [] }, 503);
      }
    }

    if (url.pathname === "/api/safety/reports/review" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) return json({ ok: false, status: "backend_not_configured" }, 503);
      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) return json({ ok: false, status: "unauthorized" }, 401);

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) return json({ ok: false, status: "unauthorized" }, 401);
      const permission = authorizeAdminAction(session.user, "manage_reports");
      if (!permission.allowed) return json({ ok: false, status: permission.status }, 403);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, status: "invalid_input" }, 400);
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ ok: false, status: "invalid_input" }, 400);
      }

      try {
        const result = await reviewContentReport(env, session.user.id, {
          reportId: body.reportId,
          action: body.action,
          notes: body.notes
        });
        const statusCode = result.ok ? 200
          : result.status === "report_not_found" ? 404
          : result.status === "report_already_closed" || result.status === "report_state_conflict" ? 409
          : result.status.startsWith("invalid_") ? 400
          : 503;
        return json({ ...result, security: CONTENT_REPORT_SECURITY }, statusCode);
      } catch {
        return json({ ok: false, status: "content_moderation_storage_not_ready" }, 503);
      }
    }

    if (url.pathname === "/api/safety/verification/me" && request.method === "GET") {
      if (!env.XKISS_AUTH_DB) return json({ ok: false, status: "backend_not_configured" }, 503);
      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) return json({ ok: false, status: "unauthorized" }, 401);

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) return json({ ok: false, status: "unauthorized" }, 401);

      try {
        const state = await getUserVerificationState(env, session.user.id);
        return json({ ...state, security: VERIFICATION_STATE_SECURITY }, state.ok ? 200 : 503);
      } catch {
        return json({ ok: false, status: "verification_state_storage_not_ready" }, 503);
      }
    }

    if (url.pathname === "/api/safety/status" && request.method === "GET") {
      return json(getSafetyVerificationOverview());
    }

    if (url.pathname === "/api/safety/self-test" && request.method === "GET") {
      return json(runSafetySelfTest());
    }

    if (url.pathname === "/api/verification/didit/webhook" && request.method === "POST") {
      const result = await verifyDiditWebhook(request, env);

      if (!result.ok) {
        return json({
          ok: false,
          service: "XKiss Didit KYC Webhook",
          status: result.status,
          reason: result.reason
        }, result.status === "provider_not_configured" ? 503 : 401);
      }

      const verificationState = mapDiditVerificationState(result.verificationStatus);

      const audit = await recordSafetyBackendEvent(env, {
        eventType: "didit_verification_status",
        provider: "didit",
        sessionId: result.sessionId,
        vendorData: result.vendorData,
        providerStatus: result.verificationStatus,
        verificationState
      });

      if (!audit.ok) {
        return json({
          ok: false,
          service: "XKiss Didit KYC Webhook",
          status: "storage-not-ready",
          reason: "Verified Didit event could not be durably recorded."
        }, 503);
      }

      return json({
        ok: true,
        service: "XKiss Didit KYC Webhook",
        provider: "didit",
        sessionId: result.sessionId,
        vendorData: result.vendorData,
        providerStatus: result.verificationStatus,
        verificationState,
        recorded: audit.recorded
      });
    }

    if (url.pathname === "/api/verification/veriff/session" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, service: "XKiss Veriff KYC Session", status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) {
        return json({ ok: false, service: "XKiss Veriff KYC Session", status: "unauthorized" }, 401);
      }

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, service: "XKiss Veriff KYC Session", status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) {
        return json({ ok: false, service: "XKiss Veriff KYC Session", status: "unauthorized" }, 401);
      }

      // Identity is server-derived. Ignore client-supplied endUserId/vendorData/callback values.
      let result;
      try {
        result = await createVeriffSession(env, {
          vendorData: session.user.id,
          endUserId: session.user.id,
          callback: env.VERIFF_CALLBACK_URL || null
        });
      } catch (error) {
        return json({
          ok: false,
          service: "XKiss Veriff KYC Session",
          status: "provider_not_configured",
          reason: String(error?.message || error || "Veriff session creation failed.")
        }, 503);
      }

      if (!result.ok) {
        return json({
          ok: false,
          service: "XKiss Veriff KYC Session",
          status: result.status,
          providerHttpStatus: result.providerHttpStatus || null,
          providerStatus: result.providerStatus || null
        }, result.status === "invalid_vendor_data" || result.status === "invalid_end_user_id" ? 400 : 502);
      }

      try {
        await recordVerificationSession(env, {
          provider: "veriff",
          providerSessionId: result.verificationId,
          userId: session.user.id
        });
      } catch {
        // Do not return a provider verification URL unless the provider session is durably bound to this account.
        return json({
          ok: false,
          service: "XKiss Veriff KYC Session",
          status: "verification_session_storage_not_ready"
        }, 503);
      }

      return json({
        ok: true,
        service: "XKiss Veriff KYC Session",
        provider: "veriff",
        verificationId: result.verificationId,
        verificationUrl: result.verificationUrl,
        vendorData: result.vendorData,
        endUserId: result.endUserId,
        status: result.status
      });
    }

    if (url.pathname === "/api/verification/veriff/webhook" && request.method === "POST") {
      let result;

      try {
        result = await verifyVeriffWebhook(request, env);
      } catch (error) {
        return json({
          ok: false,
          service: "XKiss Veriff KYC Webhook",
          status: "provider_not_configured",
          reason: String(
            error?.message ||
            error ||
            "Veriff webhook verification failed."
          )
        }, 503);
      }

      if (!result.ok) {
        return json({
          ok: false,
          service: "XKiss Veriff KYC Webhook",
          status: result.error || "verification_failed"
        }, 401);
      }

      const verificationState = mapVeriffVerificationState(result.status);

      let boundSession;
      try {
        boundSession = await getVerificationSession(env, "veriff", result.verificationId);
      } catch {
        return json({
          ok: false,
          service: "XKiss Veriff KYC Webhook",
          status: "verification_session_storage_not_ready"
        }, 503);
      }
      if (!boundSession?.ok || !boundSession.session) {
        return json({
          ok: false,
          service: "XKiss Veriff KYC Webhook",
          status: "unbound_verification_session"
        }, 401);
      }

      const providerVerification = result.payload?.verification || {};
      if (
        result.vendorData !== boundSession.session.userId ||
        providerVerification.endUserId !== boundSession.session.userId
      ) {
        return json({
          ok: false,
          service: "XKiss Veriff KYC Webhook",
          status: "verification_account_binding_mismatch"
        }, 401);
      }

      let persistedDecision;
      try {
        persistedDecision = await recordVeriffDecision(env, {
          userId: boundSession.session.userId,
          verificationId: result.verificationId,
          status: result.status,
          decisionTime: providerVerification.decisionTime,
          dateOfBirth: providerVerification.person?.dateOfBirth
        });
      } catch {
        return json({
          ok: false,
          service: "XKiss Veriff KYC Webhook",
          status: "verification_state_storage_not_ready"
        }, 503);
      }
      if (!persistedDecision.ok) {
        return json({
          ok: false,
          service: "XKiss Veriff KYC Webhook",
          status: persistedDecision.status
        }, 503);
      }

      const audit = await recordSafetyBackendEvent(env, {
        eventType: "veriff_verification_status",
        provider: "veriff",
        sessionId: result.verificationId,
        vendorData: result.vendorData,
        providerStatus: result.status,
        verificationState
      });

      if (!audit.ok) {
        return json({
          ok: false,
          service: "XKiss Veriff KYC Webhook",
          status: "storage-not-ready",
          reason: "Verified Veriff event could not be durably recorded."
        }, 503);
      }

      return json({
        ok: true,
        service: "XKiss Veriff KYC Webhook",
        provider: "veriff",
        verificationId: result.verificationId,
        vendorData: result.vendorData,
        providerStatus: result.status,
        verificationState,
        recorded: audit.recorded
      });
    }

    if (url.pathname === "/api/safety/backend/status" && request.method === "GET") {
      return json(getSafetyBackendStatus(env));
    }

    if (url.pathname === "/api/safety/backend/self-test" && request.method === "GET") {
      return json(runSafetyBackendSelfTest(env));
    }

    if (url.pathname === "/api/views/storage/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Durable View Event Store",
        storageReady: isViewEventStoreReady(env),
        storage: "ElasticLake",
        message: isViewEventStoreReady(env)
          ? "ElasticLake durable view event storage is connected."
          : "ElasticLake durable view event storage is not connected yet."
      });
    }

    if (url.pathname === "/api/views/event/count-decision" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid view count decision data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss View Count Decision Engine",
        result: await evaluateViewCountDecision(env, body)
      });
    }

    if (url.pathname === "/api/views/event/pipeline-check" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid view pipeline data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss View Qualification Pipeline",
        result: evaluateViewPipeline(body)
      });
    }

    if (url.pathname === "/api/wallet/payout/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Payout Lifecycle",
        lifecycleReady: PAYOUT_LIFECYCLE_RULES.enabled,
        rulesVersion: PAYOUT_LIFECYCLE_RULES.version,
        status: PAYOUT_LIFECYCLE_RULES.status,
        payoutEnabled: false,
        message: PAYOUT_LIFECYCLE_RULES.enabled
          ? "Payout lifecycle rules are connected and ready. Real payouts remain disabled."
          : "Payout lifecycle rules are not ready."
      });
    }

    if (url.pathname === "/api/wallet/payout/security/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Payout Security",
        securityReady: PAYOUT_SECURITY_RULES.enabled,
        rulesVersion: PAYOUT_SECURITY_RULES.version,
        status: PAYOUT_SECURITY_RULES.status,
        payoutEnabled: false,
        clientCannotAuthorize: PAYOUT_SECURITY_RULES.clientCannotAuthorize,
        secretsServerSideOnly: PAYOUT_SECURITY_RULES.secretsServerSideOnly,
        message: PAYOUT_SECURITY_RULES.enabled
          ? "Payout security rules are connected and ready. Real payouts remain disabled."
          : "Payout security rules are not ready."
      });
    }

    if (url.pathname === "/api/wallet/payout/self-test" && request.method === "GET") {
      const requestResult = createPayoutRequest({
        creatorId: "production-payout-self-test-creator",
        payoutRequestId: "production-payout-self-test-request",
        amount: 10,
        availableBalance: 25,
        currency: "USD"
      });

      const transition = transitionPayoutStatus({
        currentStatus: "requested",
        nextStatus: "under_review"
      });

      const authorization = evaluatePayoutAuthorization({
        authenticated: true,
        creatorId: "production-payout-self-test-creator",
        requestCreatorId: "production-payout-self-test-creator",
        creatorVerified: true,
        payoutProfileReady: true,
        sensitiveAction: true,
        reauthenticated: true
      });

      const audit = createPayoutAuditEvent({
        payoutRequestId: "production-payout-self-test-request",
        creatorId: "production-payout-self-test-creator",
        eventType: "payout_requested",
        amount: 10,
        currency: "USD",
        referenceId: "production-payout-self-test-reference"
      });

      return json({
        ok: true,
        service: "XKiss Payout Lifecycle & Security",
        test: "request-transition-authorization-audit",
        payoutEnabled: false,
        request: requestResult,
        transition,
        authorization,
        audit,
        verified: Boolean(
          requestResult.ok === true &&
          requestResult.status === "requested" &&
          transition.ok === true &&
          transition.to === "under_review" &&
          authorization.authorized === true &&
          audit.ok === true &&
          audit.status === "ready"
        )
      });
    }

    if (url.pathname === "/api/wallet/payout/authorize" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, authorized: false, status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) return json({ ok: false, authorized: false, status: "unauthorized" }, 401);

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, authorized: false, status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) {
        return json({ ok: false, authorized: false, status: "unauthorized" }, 401);
      }

      // Real payouts remain disabled. Never authorize from client-supplied booleans or identity fields.
      return json({
        ok: false,
        authorized: false,
        payoutEnabled: false,
        status: "payouts_disabled",
        message: "Real payouts remain disabled until server-side ownership, verification, re-authentication, and audit checks are integrated."
      }, 403);
    }

    if (url.pathname === "/api/wallet/payout/audit" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid payout audit data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Payout Audit",
        result: createPayoutAuditEvent(body)
      });
    }

    if (url.pathname === "/api/wallet/payout/history" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid payout history data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Payout History",
        result: buildPayoutHistory(body.events)
      });
    }

    if (url.pathname === "/api/wallet/payout/request" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid payout request data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Payout Request",
        result: createPayoutRequest(body)
      });
    }

    if (url.pathname === "/api/wallet/payout/status" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid payout status data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Payout Status",
        result: transitionPayoutStatus(body)
      });
    }

    if (url.pathname === "/api/wallet/payout-eligibility" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid payout eligibility data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Payout Eligibility",
        result: evaluatePayoutEligibility(body)
      });
    }

    if (url.pathname === "/api/wallet/reversal-check" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid wallet reversal data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Wallet Reversal",
        result: evaluateWalletReversal(body)
      });
    }

    if (url.pathname === "/api/wallet/settlement-check" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid wallet settlement data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Wallet Settlement",
        result: evaluatePendingSettlement(body)
      });
    }

    if (url.pathname === "/api/wallet/revenue-to-pending" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid revenue-to-wallet data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Revenue To Wallet",
        result: evaluateRevenueToWallet(body)
      });
    }

    if (url.pathname === "/api/wallet/settlement/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Wallet Settlement",
        walletLedgerReady: isWalletLedgerReady(env),
        settlementReady: isWalletLedgerReady(env) && WALLET_SETTLEMENT_RULES.enabled,
        rulesVersion: WALLET_SETTLEMENT_RULES.version,
        status: WALLET_SETTLEMENT_RULES.status,
        message: isWalletLedgerReady(env) && WALLET_SETTLEMENT_RULES.enabled
          ? "Wallet settlement checks are connected and ready."
          : "Wallet settlement checks are not ready."
      });
    }

    if (url.pathname === "/api/wallet/settlement/self-test" && request.method === "GET") {
      const result = evaluatePendingSettlement({
        creatorId: "production-settlement-self-test-creator",
        revenueEventId: "production-settlement-self-test-revenue",
        amount: 1,
        revenueQualified: true,
        settlementConfirmed: true,
        refundOrChargebackHold: false
      });

      return json({
        ok: true,
        service: "XKiss Wallet Settlement",
        test: "qualification-check",
        result,
        verified: Boolean(
          result.ok === true &&
          result.status === "settlement_ready" &&
          result.settled === true &&
          result.fromBalanceType === "pending" &&
          result.toBalanceType === "available"
        )
      });
    }

    if (url.pathname === "/api/wallet/ledger/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Wallet Ledger",
        storageReady: isWalletLedgerReady(env),
        storage: "XKISS_WALLET_LEDGER",
        message: isWalletLedgerReady(env)
          ? "Wallet ledger storage is connected and ready."
          : "Wallet ledger storage is prepared but not connected yet."
      });
    }

    if (url.pathname === "/api/wallet/ledger/self-test" && request.method === "GET") {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, storageReady: false, verified: false, status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) {
        return json({ ok: false, verified: false, status: "unauthorized" }, 401);
      }

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, verified: false, status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) {
        return json({ ok: false, verified: false, status: "unauthorized" }, 401);
      }

      const authorizationResult = authorizeAdminAction(session.user, "view_storage");
      if (!authorizationResult.allowed) {
        return json({ ok: false, verified: false, status: "forbidden" }, 403);
      }

      // Never write synthetic financial entries into the live ledger from a health-check route.
      // A real ledger write/read test must use an isolated test namespace, not production wallet keys.
      return json({
        ok: true,
        service: "XKiss Wallet Ledger",
        test: "non-mutating-preflight",
        storageReady: isWalletLedgerReady(env),
        verified: false,
        mutationPerformed: false,
        status: "isolated_write_read_test_required",
        message: "No live ledger entry was written. Verify wallet write/read using an isolated test namespace before claiming ledger integration is verified."
      });
    }

    if (url.pathname === "/api/wallet/ledger/store" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, recorded: false, status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) return json({ ok: false, recorded: false, status: "unauthorized" }, 401);

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, recorded: false, status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) {
        return json({ ok: false, recorded: false, status: "unauthorized" }, 401);
      }

      // Ledger entries must be created by trusted server-side settlement/reversal flows only.
      // Authenticated clients cannot write financial records directly.
      return json({
        ok: false,
        recorded: false,
        status: "server_generated_entries_only",
        message: "Wallet ledger writes are restricted to trusted server-side financial flows."
      }, 403);
    }

    if (url.pathname === "/api/wallet/ledger/get" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) return json({ ok: false, status: "unauthorized" }, 401);

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) {
        return json({ ok: false, status: "unauthorized" }, 401);
      }

      // The current schema has no verified user-to-creator identity mapping.
      // Fail closed instead of trusting a client-supplied creatorId or leaking another creator's ledger.
      return json({
        ok: false,
        status: "creator_identity_mapping_required",
        message: "Wallet ledger reads remain unavailable until creator ownership is bound to the authenticated account."
      }, 503);
    }

    if (url.pathname === "/api/views/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Views & Revenue",
        rules: VIEWS_REVENUE_RULES,
        message: isViewEventStoreReady(env)
          ? "Views and revenue event storage is connected and active."
          : "Views and revenue event architecture is prepared. Durable event storage is not connected yet."
      });
    }

    if (url.pathname === "/api/views/storage/self-test" && request.method === "GET") {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, verified: false, status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) {
        return json({ ok: false, verified: false, status: "unauthorized" }, 401);
      }

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, verified: false, status: "authorization_unavailable" }, 503);
      }

      if (!session?.ok || !session.user) {
        return json({ ok: false, verified: false, status: "unauthorized" }, 401);
      }

      const authorizationResult = authorizeAdminAction(session.user, "view_storage");
      if (!authorizationResult.allowed) {
        return json({ ok: false, verified: false, status: "forbidden" }, 403);
      }

      const event = {
        videoId: "production-self-test-video",
        creatorId: "production-self-test-creator",
        viewerSessionId: "production-self-test-session",
        eventId: crypto.randomUUID(),
        eventType: "view",
        playbackSignal: "playing",
        watchSeconds: 10,
        watchPercent: 20,
        occurredAt: new Date().toISOString()
      };

      if (!isViewEventStoreReady(env)) {
        return json({ ok: false, storageReady: false, verified: false }, 503);
      }

      try {
        const write = await storeViewEvent(env, event);
        const read = await getViewEvent(env, event);
        const verified = write.ok === true && read.status === "found" && Boolean(read.event);
        const cleanup = await deleteViewEvent(env, event);

        return json({
          ok: true,
          service: "XKiss Durable View Event Store",
          storage: "ElasticLake",
          test: "write-read-delete",
          write,
          read,
          cleanup,
          verified: verified && cleanup.ok === true
        });
      } catch (error) {
        return json({
          ok: false,
          service: "XKiss Durable View Event Store",
          storage: "ElasticLake",
          test: "write-read-delete",
          verified: false,
          diagnostic: String(error?.message || error || "Unknown storage error").slice(0, 1000)
        }, 500);
      }
    }

    if (url.pathname === "/api/views/event/store" && request.method === "POST") {
      if (!isViewEventStoreReady(env)) {
        return json({
          ok: false,
          storageReady: false,
          message: "Durable view event storage is not connected yet. The event was not stored."
        }, 503);
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid view event data."
        }, 400);
      }

      const validation = validateViewEvent(body);

      if (!validation.valid) {
        return json({
          ok: true,
          service: "XKiss Durable View Event Store",
          result: validation
        });
      }

      const result = await storeViewEvent(env, body);

      return json({
        ok: true,
        service: "XKiss Durable View Event Store",
        result
      });
    }

    if (url.pathname === "/api/views/event/validate" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid view event data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss View Event Validator",
        result: validateViewEvent(body)
      });
    }

    if (url.pathname === "/api/views/event/count-check" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid view count data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss View Count Check",
        result: evaluateViewCount(body)
      });
    }

    if (url.pathname === "/api/views/event/traffic-check" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid traffic data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Traffic Quality Check",
        result: evaluateTrafficQuality(body)
      });
    }

    if (url.pathname === "/api/views/event/qualified-check" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid qualified view data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Qualified View Check",
        result: evaluateQualifiedView(body)
      });
    }

    if (url.pathname === "/api/revenue/event/validate" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid revenue event data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Revenue Event Validator",
        result: validateRevenueEvent(body)
      });
    }

    if (url.pathname === "/api/monetization/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Monetization",
        enabled: MONETIZATION_RULES.enabled,
        status: MONETIZATION_RULES.status,
        version: MONETIZATION_RULES.version,
        model: MONETIZATION_RULES.model,
        message: MONETIZATION_RULES.enabled
          ? "Monetization is active."
          : "Monetization rules are prepared but not active."
      });
    }

    if (url.pathname === "/api/monetization/rules" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Monetization Rules",
        rules: MONETIZATION_RULES
      });
    }

    if (url.pathname === "/api/monetization/eligibility/rules" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Creator Eligibility",
        rules: CREATOR_ELIGIBILITY_RULES
      });
    }

    if (url.pathname === "/api/monetization/activation/rules" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Creator Monetization Activation",
        rules: CREATOR_ACTIVATION_RULES
      });
    }

    if (url.pathname === "/api/monetization/activation/evaluate" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid activation data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Creator Monetization Activation",
        result: evaluateCreatorActivation(body)
      });
    }

    if (url.pathname === "/api/monetization/policy/rules" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Monetization Policy",
        rules: MONETIZATION_POLICY_RULES
      });
    }

    if (url.pathname === "/api/monetization/policy/evaluate" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid policy evaluation data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Monetization Policy",
        result: evaluateMonetizationPolicy(body)
      });
    }

    if (url.pathname === "/api/monetization/revenue/calculate" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid revenue calculation data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Revenue Calculation",
        result: calculateRevenue(body)
      });
    }

    if (url.pathname === "/api/monetization/eligibility/evaluate" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid eligibility data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Creator Eligibility",
        result: evaluateCreatorEligibility(body)
      });
    }

    if (url.pathname === "/api/upload/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Upload",
        storageReady,
        uploadEndpoint: false,
        uploadEnabled: false,
        ownershipReady: false,
        safetyReady: false,
        status: "blocked",
        message: "Uploads remain disabled until authenticated creator ownership, object metadata binding, moderation and safety enforcement are implemented and tested."
      });
    }

    // Fail closed: do not allow a shared upload key to bypass creator ownership and safety gates.
    // Replace this guard only when the creator_videos ownership contract and moderation integration exist.
    if (url.pathname === "/api/upload/prepare" && request.method === "POST") {
      return json({
        ok: false,
        storageReady,
        uploadEnabled: false,
        status: "creator_content_ownership_required",
        message: "Upload preparation is disabled until server-side creator ownership and safety gates are complete."
      }, 503);
    }

    if (url.pathname === "/api/upload" && request.method === "POST") {
      return json({
        ok: false,
        storageReady,
        uploadEnabled: false,
        status: "creator_content_ownership_required",
        message: "Upload is disabled until server-side creator ownership and safety gates are complete. No file was stored."
      }, 503);
    }

    if (
      url.pathname === "/api/creator/profile" &&
      (request.method === "GET" || request.method === "POST")
    ) {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) return json({ ok: false, status: "unauthorized" }, 401);

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) {
        return json({ ok: false, status: "unauthorized" }, 401);
      }

      if (request.method === "GET") {
        try {
          const result = await getCreatorProfileByUserId(env, session.user.id);
          return json({
            ok: result.ok,
            status: result.status,
            creator: result.creator,
            security: CREATOR_IDENTITY_SECURITY
          }, result.ok ? 200 : 503);
        } catch {
          return json({ ok: false, status: "creator_identity_schema_not_ready", creator: null }, 503);
        }
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, status: "invalid_input" }, 400);
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ ok: false, status: "invalid_input" }, 400);
      }

      try {
        // userId, creatorId, status and verification fields from the client are deliberately ignored.
        const result = await createCreatorProfile(env, {
          userId: session.user.id,
          displayName: body.displayName
        });
        const statusCode = result.status === "created" ? 201
          : result.status === "already_exists" ? 200
          : result.status === "invalid_display_name" ? 400
          : result.ok ? 200 : 503;
        return json(result, statusCode);
      } catch {
        return json({ ok: false, status: "creator_identity_schema_not_ready" }, 503);
      }
    }

    if (url.pathname === "/api/creator/videos/drafts" && request.method === "POST") {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) return json({ ok: false, status: "unauthorized" }, 401);

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) {
        return json({ ok: false, status: "unauthorized" }, 401);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, status: "invalid_input" }, 400);
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ ok: false, status: "invalid_input" }, 400);
      }

      try {
        const profile = await getCreatorProfileByUserId(env, session.user.id);
        if (!profile.ok) return json({ ok: false, status: profile.status }, 503);
        if (!profile.creator) {
          return json({ ok: false, status: "creator_profile_required" }, 404);
        }

        const result = await createCreatorVideoDraft(env, profile.creator.id, {
          title: body.title,
          description: body.description,
          category: body.category,
          contentType: body.contentType,
          sizeBytes: body.sizeBytes
        });
        const statusCode = result.ok ? 201
          : result.status.startsWith("invalid_") || result.status === "unsupported_content_type" ? 400
          : 503;
        return json({
          ...result,
          uploadEnabled: false,
          message: result.ok
            ? "Draft saved to the authenticated creator account. This does not upload a file; upload stays disabled pending moderation and safety integration."
            : undefined
        }, statusCode);
      } catch {
        return json({ ok: false, status: "creator_video_schema_not_ready", uploadEnabled: false }, 503);
      }
    }

    if (url.pathname === "/api/creator/videos" && request.method === "GET") {
      if (!env.XKISS_AUTH_DB) {
        return json({ ok: false, videos: [], status: "backend_not_configured" }, 503);
      }

      const authorization = request.headers.get("Authorization") || "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (!token) return json({ ok: false, videos: [], status: "unauthorized" }, 401);

      let session;
      try {
        session = await authenticateSession(env, token);
      } catch {
        return json({ ok: false, videos: [], status: "authorization_unavailable" }, 503);
      }
      if (!session?.ok || !session.user) {
        return json({ ok: false, videos: [], status: "unauthorized" }, 401);
      }

      let profile;
      try {
        profile = await getCreatorProfileByUserId(env, session.user.id);
      } catch {
        return json({ ok: false, videos: [], status: "creator_identity_schema_not_ready" }, 503);
      }
      if (!profile.ok) {
        return json({ ok: false, videos: [], status: profile.status }, 503);
      }
      if (!profile.creator) {
        return json({
          ok: false,
          videos: [],
          status: "creator_profile_required",
          message: "Create a creator profile before accessing the creator library."
        }, 404);
      }

      try {
        const result = await listCreatorVideosForCreator(env, profile.creator.id);
        if (!result.ok) {
          return json({ ok: false, videos: [], status: result.status }, 503);
        }
        return json({
          ok: true,
          status: result.status,
          videos: result.videos,
          ownershipSecurity: CREATOR_VIDEO_OWNERSHIP_SECURITY
        });
      } catch {
        return json({
          ok: false,
          videos: [],
          status: "creator_video_schema_not_ready",
          message: "Creator library remains unavailable until the owner-bound video metadata migration is applied."
        }, 503);
      }
    }

    return json({
      service: "XKiss Worker",
      status: "online",
      path: url.pathname
    });
  }
};
