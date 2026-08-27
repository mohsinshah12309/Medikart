# Medikart — Engineering Rules

These are the standing conventions for building Medikart. The PRD defines *what* to build;
`phases.md` defines *when*, in what order; this document defines *how* — the rules that apply
across every phase, so the codebase stays consistent even as different phases add different
modules over time.

## 1. General Principles

- Build in the exact order defined in `phases.md` — one phase at a time, each phase's test case
  passing before the next one starts. Don't build ahead "for efficiency"; the small-phase
  structure exists specifically so each piece is verified in isolation.
- Every feature maps to a requirement ID in the PRD (FR-CW-xx, FR-AD-xx, FR-SYS-xx, NFR-xx).
  Reference the ID in the relevant commit message and code comment — if a piece of code can't
  be traced back to a requirement, question whether it should exist.
- No feature that touches money (delivery charge, discounts, order totals, payment capture) is
  ever computed on the client and trusted as-is; it is always recomputed/verified server-side.
  This applies identically to the effective discount price (Section 9 of the PRD) as it already
  did to the delivery charge.
- Code is written to be maintained by someone who wasn't in the room for these decisions — clear
  naming, comments where the *why* isn't obvious, no cleverness for its own sake.

## 2. Code Conventions

- **Language**: TypeScript on both frontend and backend.
- **Naming**: `camelCase` for variables/functions, `PascalCase` for components/classes,
  `kebab-case` for file names except React components (`PascalCase.jsx`/`.tsx`).
- **Folders**: feature-based, matching the Folder Structure document exactly
  (`server/src/modules/orders/`, not a generic `controllers/` dumping ground). If a file
  doesn't fit the documented structure, raise it before adding it, don't improvise a new
  convention mid-project.
- **Module pattern (backend)**: every module follows `routes.js -> controller.js ->
  service.js -> model.js (-> validation.js)`. Controllers stay thin — they read the request,
  call the service, shape the response. Business rules live in the service layer only
  (e.g. `discount.service.js` is the only place the product/category/storewide precedence
  logic is written — every other module that needs an effective price calls it, never
  reimplements it).
- **API routes**: `/api/v1/<resource>`, plural nouns, standard REST verbs. Order sub-types are
  a `type` discriminator on `/orders`, not separate route trees, except where the workflow
  genuinely diverges (prescription review, narcotics verification, cancellation).
- **Errors**: one central `errorHandler` middleware; controllers throw typed errors
  (`NotFoundError`, `ValidationError`, `ForbiddenError`), never send a raw `res.status(500)`
  with a stack trace to the client.
- **Validation**: every request body validated at the route boundary (zod/Joi) before reaching
  service logic, with an **explicit allow-list of settable fields per request type** — a
  checkout request cannot set `isNarcotic` or `price` even if included in the payload, because
  the endpoint simply doesn't recognize those fields as valid input for that request (this is
  what prevents OWASP API3 / mass assignment — see Section 3).

## 3. Security — PRD Section 17, Applied as You Build, Not Cleaned Up After

Security is not a separate pass at the end of the project. Every phase in `phases.md` that adds
an endpoint applies these rules from the start:

- **Rate limiting on every endpoint, not only login/OTP.** A Redis-backed token-bucket limiter
  (the same pattern Stripe and GitHub run in production) sits as a global default on every
  route, with tighter, explicit overrides on OTP, login, password reset, and the chatbot
  endpoint. Keyed on IP + account/session together, not IP alone. A client over its limit gets
  `429` with `Retry-After` — never a silent hang.
- **Object-level authorization (OWASP API1 / BOLA)**: every endpoint returning or modifying a
  specific record (an order, an admin account) verifies the requester actually owns or is
  authorized for that exact object — not just that they're authenticated in general.
- **Property-level authorization (OWASP API3 / mass assignment)**: covered above in Section 2 —
  allow-listed fields per endpoint, always.
- **Function-level authorization (OWASP API5 / BFLA)**: Super-Admin-only actions
  (`requireSuperAdmin.js`) are enforced on the backend on every request, never only hidden from
  the UI. A regular Admin calling a Super-Admin route directly via Postman must still be
  rejected.
- **Passwords**: bcrypt only, never logged in any form, including during password reset.
- **OTP / password-reset tokens**: short-lived, single-use, rate-limited per email/IP.
- **File uploads** (prescriptions, product images): validated by real file content/type, not
  the filename extension, size-capped. Prescription uploads are never publicly reachable —
  outside any public Nginx route, served only through an authenticated admin endpoint.
- **Sessions/cookies**: HttpOnly, Secure, SameSite. CSRF protection on admin state-changing
  requests.
- **Headers**: helmet.js (or equivalent) on every response — clickjacking, MIME-sniffing,
  Content-Security-Policy.
- **Secrets**: only in `.env` (never committed — see Section 9). Never in logs, never in error
  messages returned to a client.
- **2FA**: available on admin accounts, given the dashboard approves narcotics orders and
  handles payment references.
- **Dependencies**: scanned on an ongoing basis (`npm audit` / Dependabot), not only at initial
  build.

## 4. Business Logic Rules — the Parts Where a Bug Costs Money or Breaks Compliance

These four rules are the ones covered by dedicated unit tests per `phases.md` (Phases 8, 15,
17) — get these wrong and it's not a cosmetic bug:

- **Discount precedence** (Section 9, PRD): product-level discount overrides category-level,
  which overrides storewide. Never stacked. Removing a discount at any level falls back to the
  next-broadest active one, or full price if none remain. One shared `discount.service.js`
  implements this — nothing else recalculates it independently.
- **Narcotics verification gate** (Section 12, PRD): a product's `isNarcotic` flag is a
  data-driven boolean, not a browsable category. A cart/order snapshots its
  `requiresVerification` value at submission time — a flag changed *after* an order is placed
  never retroactively alters that order. Narcotics-flagged orders are restricted to Cash on Delivery only;
  card payment is never offered or accepted for a narcotics order, as the payment gateway does not
  support deferred capture (PRD Amendment v3.3).
- **Order cancellation & refund** (Section 13.5 / FR-AD-39 / FR-SYS-10): only orders at Pending
  or Packed status are cancellable through this flow — Shipped orders need a different
  post-fulfillment process, not this one. The reversal branches strictly on `paymentState`: COD
  → nothing to reverse; card-paid → status set to Cancelled and cancellation.refundStatus set to
  `refund_pending` (no gateway refund or void API call is made, since the gateway does not support it).
  An administrator later marks the order refunded once the manual bank-transfer refund is completed.
  Exactly one cancellation email, distinct from the order-confirmation email, is sent.
- **Payment gateway abstraction**: all provider-specific code lives in
  `payments/providers/kuickpay.provider.js`, behind the shared `payment.service.js` interface
  (`initiateCharge()`, `verifyTransaction()`). No other module ever imports the provider
  file directly — this is what keeps the gateway swappable and keeps Phase 16/17 isolated from
  everything downstream of them.

## 5. Frontend Rules

- **Two apps, two different jobs, one design system.** `apps/web` (Next.js) is the public,
  SEO-critical storefront — server-rendered pages, per-page metadata, JSON-LD. `apps/admin`
  (React/Vite) is authenticated and never needs to be indexed — plain SPA, no SSR needed there.
  Don't blur this line; don't add SSR to the admin app or client-only rendering to a storefront
  page that needs to rank.
- Follow the token system in `design.md` once received (see note below) — no ad-hoc hex colors
  or fonts introduced outside the shared token file.
- No client-side-only source of truth for order status, stock, price, or discount — always
  trust the server's response after a mutation, never assume the local state is still correct.
- Loading and empty states are required for every data view before it's considered done,
  especially admin tables and the product grid.
- Motion is used sparingly and purposefully; respects `prefers-reduced-motion`; never delays a
  user action for its own sake.
- **`design.md` timing**: backend-only work runs Phase 1 through Phase 22; the first UI phase
  is Phase 23. `design.md` only feeds frontend styling, not schemas or logic — it can arrive any
  time before Phase 23 without causing rework on phases already completed.

## 6. Data & Integration Rules

- **Images**: self-hosted, not a third-party CDN. Every upload — bulk import or single
  admin upload — passes through `imageProcessor.js` (resize + WebP conversion) before saving to
  `server/uploads/products/{sku}/`. Multiple images per product are supported (FR-AD-40); one is
  marked primary/cover. A product with no image ever falls back to the shared placeholder, never
  a broken reference.
- **Google Sheets sync**: queued and retried, never inline-blocking on order placement — a
  temporary Sheets API failure must never prevent an order from saving.
- **Excel product import**: validated per row; a bad row is reported individually, never
  silently dropped and never allowed to fail the whole import.
- **AI chatbot** (Groq): scoped strictly to product suggestions from Medikart's own catalog.
  Every response includes the "not a doctor, consult a pharmacist" disclaimer — not just once
  per conversation. Products carrying the Narcotics flag are excluded from suggestions at the
  query level, not filtered after the fact. Every conversation is logged for periodic review.
- **WhatsApp**: click-to-chat (`wa.me` link) only. Do not build toward the WhatsApp Business
  Platform API (automated order notifications via WhatsApp) unless the client explicitly
  requests that separately — it's a materially different, paid integration.
- **Database tier discipline**: all development and testing runs on the MongoDB Atlas **Free
  (M0)** tier. The switch to the paid **Flex** tier happens exactly once, in Phase 30
  (Deployment) — no phase before that touches production data or the paid cluster.

## 7. Testing & QA

- Every phase in `phases.md` ships with its own test case — a phase is not "done" until that
  specific test passes, not just until the code compiles.
- Unit tests are required, not optional, for: discount precedence, delivery-charge calculation,
  the narcotics verification gate, OTP verification, and order cancellation's COD/void/refund
  branching (`server/tests/unit/`).
- Integration tests cover each core workflow's happy path and at least one realistic failure
  path (a rejected narcotics prescription, a failed payment, a cancelled order).
- Before production deployment (Phase 28): `npm audit` clean of high/critical issues, an
  automated scan (OWASP ZAP or equivalent) against staging with no high-severity findings, and
  a full manual walk-through of every Acceptance Criterion in the PRD, signed off explicitly —
  not assumed because the code looks right.

## 8. Git & Development Workflow

- Branch per feature/phase (`feature/phase-08-discounts`), PR into `develop`, `main` reserved
  for what's actually deployed.
- No direct pushes to `main`.
- Commit messages reference the requirement ID and/or phase they implement, e.g.
  `feat(orders): add cancellation void/refund branching (FR-AD-39, FR-SYS-10, Phase 17)`.
- A PR is not opened until its phase's test case (per `phases.md`) passes locally.
- If a coding agent (Claude Code, Antigravity, etc.) is doing the implementation, it works
  through `phases.md` one phase at a time and stops for review after each passing test case —
  it does not self-continue through multiple phases in one pass.

## 9. Environment & Secrets

- Real secrets (`MONGODB_URI`, `REDIS_URL`, SMTP credentials, Habib Metro keys, `JWT_SECRET`,
  `GROQ_API_KEY`) live only in an untracked `.env` per app/environment.
- `.env.example` is committed with the same variable names and no real values — this is how a
  new environment is set up, never by copying a real `.env`.
- `.gitignore` (root) excludes `.env*`, `node_modules/`, build output (`.next/`, `dist/`), and
  `server/uploads/` — uploaded media is deployed directly to the VPS (SFTP/rsync), never via
  Git.
- Production credentials (Habib Metro live keys, production Mongo URI) are swapped in only at
  Phase 30 (Deployment) — sandbox/test credentials are used for every phase before that.
