# XKiss Full Dependency & Integration Matrix — 2026-10-10

**Purpose:** Map cross-section dependencies before implementation, prevent out-of-order activation, and define the smallest safe implementation batches.
**Repository:** `AligasSRM/XKiss`
**Reviewed ref:** `audit/production-baseline-2026-10-10`
**Reviewed HEAD before this document:** `f7a39bad273276fe6656d9f8e5aa4c893d685339`
**Repository inventory:** 380 tracked file entries in the recursive Git tree at the reviewed HEAD.
**Status:** YELLOW — source/dependency audit in progress; this is not a release approval.
**Production:** Unchanged. PR #19 remains Draft. Do not merge or deploy based on this document.
**Locked boundary:** ElasticLake adapter, its live bindings, and verified write/read/delete path remain untouched unless a proven storage defect requires a narrowly scoped exception.

## 1. Audit scope and confidence

The repository tree and current PR were inspected. Source-level review focused on `worker.js`, `wrangler.toml`, `migrations/0001_auth.sql`, authentication/session handling, admin/settings authorization, creator library/upload clients, view-event/revenue pipeline, wallet ledger/settlement/payout modules, safety/age/moderation modules, production-readiness gates, and relevant workflows/tests.

The latest observed CI evidence on PR HEAD `f7a39bad273276fe6656d9f8e5aa4c893d685339`:
- `XKiss Tests`: run 38079123877 — completed / success.
- `XKiss Section 13 Admin Dashboard`: run 38079123879 — completed / success.
- A Netlify deploy-preview status was also successful.
- The test workflow's reported 64 passing tests are unit/route tests; they do not prove production database, provider, browser-to-Worker, financial settlement, or end-to-end behavior.

This is a dependency and source-level audit, not a claim that every one of the 380 files was read line by line or every live integration was exercised. Each implementation batch must extend the evidence with focused tests and regression checks.

## 2. Dependency rules (non-negotiable)

1. **Identity before ownership.** A user account/session is not itself a creator identity. The current D1 migration contains only `users` and `sessions`; it does not define a trusted account-to-creator mapping.
2. **Server-derived authorization only.** A browser-supplied `userId`, `creatorId`, role, verified flag, balance, payout flag, or audit claim is never proof.
3. **Qualification before money.** A view must pass validation, traffic-quality, qualification, deduplication and policy checks before any revenue event can be trusted.
4. **Server-side revenue before ledger.** Only a trusted revenue/settlement/reversal pipeline may write financial ledger entries. Clients must never write balances or entries directly.
5. **Ledger ownership before ledger reads or payouts.** Creator-to-account ownership, available balance, holds/reversals, verification and audit state must be derived from trusted server-side records.
6. **Safety before restricted content.** Account state, age verification, creator verification, moderation, reporting, privacy and durable audit must be enforced server-side before restricted content is activated.
7. **Provider callback before verification state.** Verify provider signature/authenticity, correlate the callback to a server-created verification record, durably audit it, then update trusted state. Logging a webhook event alone is not equivalent to setting a user's verified state.
8. **Frontend after API contract.** A UI is not complete until its API origin, authentication headers, request schema, error states and server-side ownership checks agree with the Worker contract.
9. **Readiness gates last.** Section 19/release readiness must consume evidence from sections 1–18 and external providers; a GREEN self-test or configured rules object does not by itself authorize activation.
10. **No locked-component churn.** Do not modify the ElasticLake adapter/bindings as a shortcut for fixing identity, authorization, or business logic.

## 3. Cross-section dependency matrix

Legend: **HARD** = must be implemented and verified first; **CONTRACT** = parallel work is possible only against an agreed schema/API contract; **GATE** = downstream remains disabled until evidence exists.

| Workstream | Depends on | Must be delivered together with | Cannot be activated until |
|---|---|---|---|
| A. Auth + sessions | D1 `XKISS_AUTH_DB`, users/sessions schema, password/session lifecycle | Central bearer-session helper; expiry/revocation; uniform error handling; rate limiting and recovery policy | Real D1 migration/binding and live register→login→me→logout tests pass |
| B. Account↔creator identity | A (HARD) | Creator profile/mapping schema, ownership constraints, create/link/recovery rules, admin audit | Mapping uniqueness, authorization and cross-account denial tests pass |
| C. Admin + super-admin | A (HARD); server-side roles | Admin permission map, server-derived session identity, MFA/re-authentication, durable audit | Real MFA proof exists for privileged actions; no client-supplied identity/role accepted |
| D. Settings + runtime activation | A and C (HARD) | One DB binding contract, protected-setting re-auth, audit writes, config validation | Changes are server-authorized, audited, reversible, and readiness reflects actual runtime state |
| E. Creator library + private creator routes | A+B (HARD) | Owner-filtered list/read/update/delete; API-origin/auth header integration in creator UI | Tests prove creator A cannot read or mutate creator B's objects |
| F. Upload + media storage | A+B (HARD); storage contract; E's ownership model | Upload initiation, object key ownership, type/size limits, completion, cleanup, private read/playback authorization | Browser→Worker→storage round-trip, invalid type/size, cross-owner denial and cleanup tests pass |
| G. Age/creator verification | A+B (HARD); trusted provider contract | Veriff/Didit session, provider webhook verification, callback correlation, durable state update, audit | Real provider sandbox/live evidence and server-side state transitions pass; client cannot self-verify |
| H. Content safety/moderation/reporting/privacy | A+B+G (HARD); durable audit/storage | Upload moderation gate, reports/cases, review queue, appeals/escalation, privacy/data lifecycle | Missing provider/capability fails closed; restricted content is denied before and after upload/playback |
| I. View event ingestion | A/B as required by policy; content ownership/visibility contract | Event schema, anti-abuse/rate limit, server-derived video→creator mapping, dedupe key, storage contract | Untrusted input cannot mark an event counted/qualified; storage abuse and duplicate tests pass |
| J. View qualification + monetization | I (HARD); monetization rules and policy | Threshold config, traffic quality, qualification, creator eligibility/activation, idempotent revenue event | Real policy values configured and independently tested; unqualified events produce no revenue |
| K. Revenue → wallet pending | B+J (HARD) | One server-only writer, immutable event/reference IDs, currency/amount rules, idempotency | Qualified revenue has a trusted creator mapping and cannot be replayed to duplicate earnings |
| L. Settlement + reversals | K (HARD); refund/chargeback state; audit | Pending→available transitions, holds, reversal entries, reconciliation and audit | Atomic/idempotent settlement and reversal tests pass; no client can assert settlement confirmation |
| M. Payout eligibility + payout lifecycle | A+B+G+K+L (HARD); payout profile/provider | Ownership, verified creator, available balance, holds, re-auth, provider, durable audit, idempotency | Real provider sandbox end-to-end, failed/duplicate/retry paths, reconciliation and audit pass |
| N. Admin analytics/reports | Correct sources from I–M and privacy policy | Role-scoped queries, audit-safe exports, no PII leakage | Aggregates reconcile with source records and access-denial tests pass |
| O. Production readiness / Section 19+ | A–N as applicable; external dependencies; regression evidence | One evidence ledger mapping requirement→implementation→test→CI→live proof | Every critical gate has evidence; no placeholder/configured-only module counted as ready |

## 4. Application order — batches that must move together

### Batch 0 — Baseline and contract lock
- Confirm the branch HEAD and all CI runs.
- Keep the PR Draft and production unchanged.
- Maintain the ElasticLake lock.
- Establish one route inventory and one acceptance-evidence format.

### Batch 1 — Identity foundation (A + B)
- Keep the current authentication backend as the starting point; do not create a second identity system.
- Add a migration for creator profiles/mapping with unique constraints and a defined account lifecycle.
- Decide how a member becomes a creator and how ownership is recovered/revoked.
- Test valid mapping, missing mapping, duplicate mapping, revoked/suspended account, and cross-account spoofing.
- Do not enable creator library, ledger reads or payout requests before this batch passes.

### Batch 2 — Authorization + admin control plane (C + D)
- Reuse the same authenticated session and server-side role source.
- Integrate actual MFA/re-authentication and durable audit before super-admin or protected settings can mutate state.
- Verify all admin/settings routes and UI requests against one permission contract.
- Keep sensitive actions blocked if any dependency is missing.

### Batch 3 — Private creator content (E + F)
- Apply one ownership predicate to creator list, video metadata, upload initiation, media read/playback and deletion.
- Fix frontend API-origin/auth-header mismatch in the same batch as route authorization; otherwise the UI cannot use the secure routes.
- Add cross-creator denial tests, invalid file/type/size tests, cleanup tests and a browser-to-Worker integration check.

### Batch 4 — Safety and verification (G + H)
- Separate account identity, age verification, creator verification and authorization; they are not interchangeable.
- Persist server-created provider sessions and correlate signed callbacks to those records.
- Persist verification state and audit outcome before changing access.
- Connect moderation/reporting/privacy enforcement to upload, listing and playback gates.
- Leave age-restricted activation blocked until all gates are proven.

### Batch 5 — View-to-revenue chain (I + J)
- Treat incoming client events as untrusted observations, not counted views.
- Resolve the canonical video owner on the server.
- Define thresholds and traffic rules before allowing counted/qualified status.
- Test duplicates, invalid events, automated traffic, missing threshold and replay attacks.
- Ensure only a server decision can create a qualified revenue event.

### Batch 6 — Money chain (K + L + M)
- Implement a single server-only ledger writer shared by revenue, settlement and reversal logic.
- Use immutable event references and idempotency keys; define currency/rounding and reconciliation behavior.
- Require trusted available balance, creator ownership, verified creator state, re-authentication, audit and provider response for payouts.
- Keep actual payouts disabled until sandbox end-to-end and failure/retry/reconciliation paths pass.

### Batch 7 — Evidence and release gate (N + O)
- Reconcile analytics and admin reports to durable source records.
- Re-run all route tests, unit tests, integration tests, security-denial tests, and production smoke tests.
- Confirm all external dependencies, privacy and support/incident processes.
- Only then consider moving PR #19 from Draft and separately approving a production release.

## 5. Confirmed current gaps from source review

### P0 — Must be fixed before production activation
1. **Creator mapping does not exist in the current auth migration.** `migrations/0001_auth.sql` defines `users` and `sessions`, not a creator identity/ownership relation. The PR correctly fails closed for wallet ledger reads and creator-library access until mapping exists.
2. **Wallet ledger self-test could write to the live ledger — remediation branch fix applied, CI pending.** The baseline route called `storeWalletEntry` and `getWalletEntry` with a fixed production-named entry and had no operational-session check. On this branch, commit `aeb2be975ebe361f79598e862de7f37807ed0c58` removes live writes from the route, requires an authenticated admin with `view_storage`, and returns `verified: false` until an isolated write/read test exists. Three route tests were added in commit `6c418a0a56e3473c0fb39b58cc2f3cf0f8ff56dc`. Treat this as **YELLOW until CI confirms it**; production remains unchanged.
3. **Financial decision endpoints are not financial authority.** Several public POST routes evaluate caller-supplied payout/settlement/revenue data (request, status transition, eligibility, reversal check, settlement check, revenue-to-pending, audit/history builders). They are pure rule evaluators in the inspected code, not a durable financial workflow. They must remain clearly non-authoritative and must not be wired to balances or provider calls until replaced/integrated with server-derived records.
4. **Verification callback persistence is not yet a full identity-state transition.** The Veriff/Didit webhook paths verify a provider result and record a safety event, but the reviewed auth schema has no trusted creator mapping/verification-state model. Do not infer that a recorded webhook means the account or creator is now verified.
5. **Safety activation is deliberately blocked.** Age verification is prepared/disabled with no provider configured; moderation is prepared/disabled; the safety backend requires identity, age verification, creator verification, moderation, reporting, audit and privacy capabilities. Preserve fail-closed behavior.

### P1 — Must be resolved before core feature readiness
6. **Creator library UI does not send a bearer token.** `creator/creator-library.js` calls `/api/creator/videos` without Authorization; the route is currently blocked pending ownership mapping. The API and UI auth contract must be implemented together.
7. **Upload client uses relative `/api/upload/*` URLs.** `upload/upload-api.js` calls relative paths, so when the UI is hosted on GitHub Pages those paths target the Pages origin, not automatically the Cloudflare Worker. Centralize the Worker base URL and authentication headers and test the actual browser-to-Worker path.
8. **Production readiness has static blockers that must be reconciled with real state.** `core/xkiss-production-readiness-core.js` intentionally returns BLOCKED with a fixed blocker list; Section 19 also hardcodes `productionActivationAllowed: false`. These are safe defaults, but readiness reporting must eventually consume real, test-backed integration results rather than stale labels.
9. **Password hashing and session lifecycle need a dedicated policy pass.** The current auth backend uses PBKDF2-SHA-256 with 20,000 iterations and a 30-day session TTL. Upgrade only with a backward-compatible migration/rehash plan and tests for existing accounts, expiry and revocation.
10. **Public view-event ingestion needs abuse controls.** The current view store defaults to `counted: false` and `qualified: false`, which is an important safety property. However, ingestion still needs rate limiting, canonical video-owner resolution, schema limits, dedupe/replay handling and abuse monitoring before it is considered production-ready.

## 6. Safe parallel work vs. strict ordering

**Can proceed in parallel after contracts are frozen:**
- Password/session policy design and admin MFA design (both depend on the existing auth contract).
- Moderation workflow design and provider adapter tests (but not activation).
- Upload UI/API-origin correction and creator mapping schema preparation (but no private access enablement until both pass).
- Unit tests for pure rules and docs for acceptance evidence.

**Must be sequential:**
- Auth → creator mapping → owner-filtered creator APIs.
- Provider session + verified callback → persisted verification state → safety/payout eligibility.
- View validation/qualification → trusted revenue event → pending ledger → settlement/reversal → payout.
- Implemented integration → end-to-end tests → production readiness → explicit release approval.

## 7. Required evidence for each implementation batch

Record all of the following in the PR or linked issue:
- Exact commit SHA and changed paths.
- Dependency batch and upstream contracts used.
- Tests for allowed, denied, malformed, missing-provider, duplicate/replay and cross-owner cases as applicable.
- CI run URLs and final conclusions.
- Integration proof (D1/Worker/provider/browser) distinct from unit-test proof.
- Production changed? **Yes/No**. For this remediation branch, the required answer remains **No** until separately approved.
- Final status: GREEN only when all relevant evidence exists; otherwise YELLOW or RED.

## 8. Current decision

- PR #19 stays **Draft**.
- Production stays unchanged.
- Payouts and age-restricted activation stay disabled.
- Creator library and wallet reads stay fail-closed until trusted ownership mapping exists.
- ElasticLake remains **GREEN / LOCKED**; this audit does not authorize modifying its adapter or bindings.
- Immediate next step: verify CI for the non-mutating wallet-ledger self-test change. Then implement Batch 1 (trusted account-to-creator identity mapping) before opening dependent creator/ledger/payout capabilities.
