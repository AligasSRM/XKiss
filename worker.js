import { getXKissSettingsRuntimeStatus } from "./settings/xkiss-settings-runtime-core.js";
import {
  createVideoKey,
  isStorageReady,
  listVideos,
  storeVideo
} from "./storage/r2-adapter.js";
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
import { isWalletLedgerReady, storeWalletEntry, getWalletEntry } from "./wallet/wallet-ledger-store.js";
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
import { verifyDiditWebhook, mapDiditVerificationState } from "./safety/didit-kyc-provider.js";
import { registerMember, loginMember, authenticateSession, logoutMember, AUTH_SECURITY_INVARIANTS } from "./security/xkiss-auth-backend.js";
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
      try { body = await request.json(); } catch { return json({ ok: false, status: "invalid_input" }, 400); }
      return json(await registerMember(env, body), 201);
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
      let body; try { body = await request.json(); } catch { return json({ok:false,status:"invalid_input"},400); }
      return json(authorizeAdminAction(body.user, body.permission));
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
        storage: "Backblaze B2",
        message: isViewEventStoreReady(env)
          ? "Backblaze B2 durable view event storage is connected."
          : "Backblaze B2 durable view event storage is not connected yet."
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
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid payout authorization data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Payout Authorization",
        result: evaluatePayoutAuthorization(body)
      });
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
      const entry = {
        entryId: "production-wallet-self-test-entry",
        creatorId: "production-wallet-self-test-creator",
        type: "earning",
        amount: 1,
        currency: "USD",
        balanceType: "pending",
        referenceId: "production-wallet-self-test-reference",
        occurredAt: new Date().toISOString()
      };

      if (!isWalletLedgerReady(env)) {
        return json({ ok: false, storageReady: false, verified: false }, 503);
      }

      try {
        const write = await storeWalletEntry(env, entry);
        const read = await getWalletEntry(env, entry);
        return json({
          ok: true,
          service: "XKiss Wallet Ledger",
          test: "write-read",
          write,
          read,
          verified: write.ok === true && read.status === "found" && Boolean(read.entry)
        });
      } catch {
        return json({
          ok: false,
          service: "XKiss Wallet Ledger",
          test: "write-read",
          verified: false
        }, 500);
      }
    }

    if (url.pathname === "/api/wallet/ledger/store" && request.method === "POST") {
      if (!isWalletLedgerReady(env)) {
        return json({
          ok: false,
          storageReady: false,
          recorded: false,
          message: "Wallet ledger storage is not connected yet. The entry was not recorded."
        }, 503);
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid wallet ledger data."
        }, 400);
      }

      const result = await storeWalletEntry(env, body);

      return json({
        ok: true,
        service: "XKiss Wallet Ledger",
        result
      });
    }

    if (url.pathname === "/api/wallet/ledger/get" && request.method === "POST") {
      if (!isWalletLedgerReady(env)) {
        return json({
          ok: false,
          storageReady: false,
          message: "Wallet ledger storage is not connected yet."
        }, 503);
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid wallet ledger lookup data."
        }, 400);
      }

      const result = await getWalletEntry(env, body);

      return json({
        ok: true,
        service: "XKiss Wallet Ledger",
        result
      });
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
          storage: "Backblaze B2",
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
          storage: "Backblaze B2",
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
        uploadEndpoint: true,
        message: storageReady
          ? "Production video storage is connected."
          : "Production video storage is not activated yet."
      });
    }

    if (url.pathname === "/api/upload/prepare" && request.method === "POST") {
      if (!storageReady) {
        return json({
          ok: false,
          storageReady: false,
          message: "Production storage is not activated yet. The video was not uploaded."
        }, 503);
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid upload metadata."
        }, 400);
      }

      if (!body.fileName || !body.contentType || !body.title) {
        return json({
          ok: false,
          message: "fileName, contentType and title are required."
        }, 400);
      }

      const key = createVideoKey(body.fileName);

      return json({
        ok: true,
        storageReady: true,
        uploadReady: Boolean(env.XKISS_UPLOAD_KEY),
        key,
        fileName: String(body.fileName),
        contentType: String(body.contentType),
        message: env.XKISS_UPLOAD_KEY
          ? "Upload preparation is ready for the connected storage layer."
          : "Storage is connected, but upload authorization is not configured yet."
      });
    }

    if (url.pathname === "/api/upload" && request.method === "POST") {
      if (!storageReady) {
        return json({
          ok: false,
          storageReady: false,
          message: "Production video storage is not activated yet. The video was not uploaded."
        }, 503);
      }

      if (!env.XKISS_UPLOAD_KEY) {
        return json({
          ok: false,
          storageReady: true,
          message: "Upload authorization is not configured yet."
        }, 503);
      }

      const suppliedKey = request.headers.get("X-XKiss-Upload-Key");

      if (!suppliedKey || suppliedKey !== env.XKISS_UPLOAD_KEY) {
        return json({
          ok: false,
          message: "Upload authorization failed."
        }, 401);
      }

      const fileName = request.headers.get("X-XKiss-File-Name");
      const contentType = request.headers.get("Content-Type") || "application/octet-stream";

      if (!fileName) {
        return json({
          ok: false,
          message: "X-XKiss-File-Name is required."
        }, 400);
      }

      if (!contentType.startsWith("video/")) {
        return json({
          ok: false,
          message: "Only video content is accepted."
        }, 415);
      }

      if (!request.body) {
        return json({
          ok: false,
          message: "Video request body is empty."
        }, 400);
      }

      const key = createVideoKey(fileName);

      try {
        const stored = await storeVideo(env, key, request.body, {
          fileName,
          contentType,
          title: request.headers.get("X-XKiss-Title") || "",
          description: request.headers.get("X-XKiss-Description") || "",
          category: request.headers.get("X-XKiss-Category") || "",
          downloadPolicy: request.headers.get("X-XKiss-Download-Policy") || "disabled",
          visibility: request.headers.get("X-XKiss-Visibility") || "private"
        });

        return json({
          ...stored,
          message: "Video uploaded successfully."
        }, 201);
      } catch {
        return json({
          ok: false,
          storageReady: true,
          status: "failed",
          message: "Video storage failed."
        }, 500);
      }
    }

    if (url.pathname === "/api/creator/videos" && request.method === "GET") {
      try {
        const result = await listVideos(env);

        return json({
          ...result,
          message: storageReady
            ? "Creator library is connected."
            : "Creator library is ready. Production storage is not activated yet."
        });
      } catch {
        return json({
          ok: false,
          storageReady,
          videos: [],
          message: "Creator storage could not be read."
        }, 500);
      }
    }

    return json({
      service: "XKiss Worker",
      status: "online",
      path: url.pathname
    });
  }
};
