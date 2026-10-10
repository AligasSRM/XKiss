# XKiss Future Feature Ideas

**Record type:** Separate, temporary idea backlog — not authoritative project state and not an implementation instruction.  
**Review rule:** New ideas are captured as-is, then reviewed with Ali before becoming requirements. At project completion, review the backlog and archive or remove it at Ali's direction.  
**Do not:** change locked architecture, production code, provider settings, monetization, or deployment merely because an idea was recorded.

## Idea log

### IDEA-001 — XKiss Connect
- **Status:** 🟡 IDEA / NOT APPROVED FOR IMPLEMENTATION
- **Priority:** High interest, not market-validated
- **Origin:** Previously recorded in this repository; retained for future review
- **Concept:** Add an optional 18+ social / dating / connection module inside XKiss rather than creating a separate website.
- **Possible scope:** 18+ profiles and age-gated access; discovery using permitted filters; in-platform messaging; optional live/video interaction as a separate capability; privacy-first contact model without exposing phone numbers by default; possible future monetization only after legal, safety, payment-provider, and platform-policy review.
- **Required review before any implementation:**
  1. Current market and competitor research.
  2. Applicable laws and jurisdiction requirements.
  3. Reliable age-verification requirements and controls.
  4. Safety, moderation, reporting, blocking, and abuse prevention.
  5. Privacy and personal-data handling.
  6. Messaging and live-video architecture.
  7. Payment-provider and monetization constraints.
  8. Effect on XKiss production readiness.
  9. Isolated module boundaries and compatibility plan.
  10. Build → real test → regression → GREEN → LOCK.
- **Decision:** No implementation or deployment is authorized by this record.

## Capture template for future ideas

When Ali says “سجّل هالفكرة”, add a new entry using this template. Do not force decisions before the idea is understood.

- **ID / short title:**
- **Idea in Ali's words:**
- **Problem or opportunity:**
- **Potential user value:**
- **Affected project sections / dependencies:**
- **Compatibility, security, privacy, legal, and cost questions:**
- **Possible approaches (not commitments):**
- **Evidence needed:**
- **Status:** 🟡 UNREVIEWED
- **Review decision:** Pending Ali's discussion/approval
- **Next action:** Clarify, research, defer, reject, or approve for a separate design phase

## Backlog rules

1. Ideas do not automatically become requirements or approved scope.
2. Record uncertain thoughts without presenting them as verified facts.
3. Do not change `main`, architecture contracts, or GREEN / LOCKED code for an idea.
4. Before implementation, check compatibility with the current project and perform the appropriate feasibility, safety, security, privacy, and legal review.
5. When an idea is approved, transfer only the agreed decision into permanent architecture/project-state documents and create a separately scoped implementation plan.
6. Review this backlog with Ali at project milestones and at project completion; archive or delete it only when Ali decides.
