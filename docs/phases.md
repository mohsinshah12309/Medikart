# Medikart — Delivery Phases

Backend-first: every API is built and tested on its own (via Postman/automated tests) before any
frontend consumes it. Admin dashboard comes before the customer storefront, since staff need a way
to manage the catalog before the storefront has anything real to show. Phases are kept small on
purpose — each one should be shippable and testable in isolation, not a multi-week bucket.

**Database note (applies throughout Phases 1–29):** all local development, and all testing during
this build, runs against a **MongoDB Atlas Free (M0) tier** cluster — free, zero risk, fine for
non-production data. The switch to the **Flex tier** (paid, with backups) happens once, deliberately,
in Phase 30 (Deployment), right before real customer/order data starts flowing. No phase before that
touches production data or the Flex cluster.

---

## Phase 1 — Project Scaffolding

**Goal:** the repo exists, in the shape defined in the Folder Structure document, with nothing
functional yet.

- Create the monorepo structure (`apps/web`, `apps/admin`, `server`, `docs`, `nginx`).
- `npm init` in each of the three apps; install base dependencies (Express, Mongoose, Next.js, React/Vite, dotenv, etc.) — no business logic yet.
- Create `.env.example` in each app; create real local `.env` files (gitignored).
- Set up `.gitignore`, initialize Git, first commit.
- `server/app.js` returns a bare `"OK"` on `GET /health` — nothing else.

**Test Case for Phase 1:** Run `npm install` in all three apps with zero errors. Start the server and
hit `GET /health` — it returns `200 OK`. Confirm `git status` shows `.env` and `node_modules/` are
NOT tracked.

---

## Phase 2 — Database Connection (MongoDB Free Tier)

**Goal:** the backend can talk to MongoDB.

- Create a MongoDB Atlas Free (M0) cluster for development.
- `server/src/config/db.js` connects on startup using `MONGODB_URI` from `.env`.
- `GET /health` is updated to also report DB connection status.

**Test Case for Phase 2:** Start the server with a valid `MONGODB_URI` — `/health` reports
`"database": "connected"`. Start it with a deliberately wrong URI — the server logs a clear connection
error instead of crashing silently or hanging.

---

## Phase 3 — Core Data Models

**Goal:** the Mongoose schemas for the catalog exist.

- `product.model.js` (incl. `isNarcotic`, `discount{}`, `stockStatus`, `images[]` with an `isPrimary` flag per image).
- `category.model.js` (incl. `isNarcotic` default flag, `discount{}`).
- `city.model.js` (`deliveryCharge`, `active`).

**Test Case for Phase 3:** A small Node script creates one document in each collection directly via
Mongoose and reads it back with the correct field types (e.g. `isNarcotic` is a real boolean, not a
string).

---

## Phase 4 — Product & Category CRUD APIs

**Goal:** admin can manage the catalog via the API (no auth yet — added in Phase 5).

- `POST/GET/PUT/DELETE /api/v1/admin/products`
- `POST/GET/PUT/DELETE /api/v1/admin/categories`
- Request validation (zod/Joi) on both, with an explicit allow-list of settable fields per request type (no field a request shouldn't touch — e.g. `isNarcotic` or `price` — is accepted from an unrelated endpoint).

**Test Case for Phase 4:** Via Postman: create a category, create a product in that category, edit
the product's price, delete the product, confirm a `GET` afterward returns 404. Submitting a product
with a missing required field (e.g. no name) returns a 400 with a clear validation message, not a 500. Submitting a field the endpoint doesn't recognize (e.g. `role` on a product update) is silently
ignored, not accepted.

---

## Phase 5 — Admin Authentication & Roles

**Goal:** the admin API is no longer wide open.

- `adminUser.model.js` (`role: super_admin/admin`, `permissions[]`, `passwordHash`).
- Login endpoint issuing a JWT; `auth.js` middleware protecting all `/admin/*` routes by default.
- `requireSuperAdmin.js` middleware (used later by Phase 6/20).
- Seed one Super Admin account via a script (not through the API, since there's no admin yet to create one).

**Test Case for Phase 5:** Calling any `/admin/products` route without a token returns 401. Logging
in with the seeded Super Admin returns a valid JWT; using that token on the same route now succeeds.
Logging in with a wrong password returns 401, not a stack trace.

---

## Phase 6 — Admin Password Reset

**Goal:** FR-AD-32 — an admin who's locked out can recover their account.

- `passwordResets` collection, short-lived single-use token (mirrors the OTP pattern).
- `POST /forgot-password` (emails a reset link) and `POST /reset-password` (consumes the token).

**Test Case for Phase 6:** Request a reset for a real admin email — a token is generated and an email
is sent (check the dev SMTP catcher, e.g. Mailtrap). Using the link sets a new password and logs the
admin in with it. Reusing the same link a second time is rejected.

---

## Phase 7 — Cities & Delivery Pricing

**Goal:** FR-AD-22 / FR-CW-11 — delivery cost logic.

- Cities CRUD API.
- `city.service.js`: given a city name, returns PKR 250 if configured/active, PKR 500 otherwise — computed server-side only.

**Test Case for Phase 7:** Add "Lahore" as a configured city with a 250 charge. A delivery-charge
calculation for "Lahore" returns 250; for "Multan" (not configured) returns 500. Confirm there is no
way to pass a delivery charge in from the client and have it accepted.

---

## Phase 8 — Discounts (Product / Category / Storewide)

**Goal:** Section 9 of the PRD — the confirmed precedence model, implemented.

- `discount.service.js`: given a product, returns the effective price using product > category > storewide precedence.
- Discount fields added to the Product/Category APIs (Phase 4) and a storewide value in Settings.

**Test Case for Phase 8 (this is exactly the kind of logic that gets a unit test, per `tests/unit/discount.test.js`):**

- Product with no discount, category with 10% -> effective price reflects 10% off.
- Same product given its own 15% discount -> effective price reflects 15%, not both stacked.
- Remove the product-level discount -> price falls back to the category's 10%.
- Remove the category discount too, storewide is 5% -> price reflects 5%.

---

## Phase 9 — Bulk Excel Product Import

**Goal:** FR-AD-06 — the client's real ~6,112-row catalog can be loaded in.

- `scripts/importProducts.js`: reads the Excel file, validates each row, imports valid rows, reports invalid ones by row number and reason.

**Test Case for Phase 9:** Run the script against a small test spreadsheet with 8 valid rows and 2
deliberately broken rows (missing price, invalid category). Confirm exactly 8 products are created and
the script prints/logs the 2 failing rows with a specific reason each — not a silent skip, not a
crash.

---

## Phase 10 — Image Upload & Processing Pipeline (Multiple Images per Product)

**Goal:** self-hosted image storage, as decided (no Cloudinary) — including FR-AD-40, more than one
image per product.

- `imageProcessor.js` (sharp: resize, WebP conversion).
- `POST /admin/products/:id/images` accepts one or more files in a single request, saving each to `server/uploads/products/{sku}/`.
- `PATCH /admin/products/:id/images/:imageId/primary` sets which image is the cover/listing image; `DELETE .../images/:imageId` removes one.
- Placeholder image served whenever a product has none at all.

**Test Case for Phase 10:** Upload a 5MB JPEG to a product — the stored file is a compressed WebP
under ~150KB. Upload a second and third image to the same product — all three are stored and listed,
and setting the second one as primary changes which image the product-list endpoint returns as the
cover image. Request a product with no uploaded image — the API returns the placeholder path, never
a broken reference. Attempt to upload a renamed `.exe` file with a `.jpg` extension — it's rejected
by real content-type validation, not just the extension.

---

## Phase 11 — Narcotics Flagging & Audit

**Goal:** Section 4 (SRS) / Section 12 (PRD) — the client's core compliance requirement.

- `PATCH /admin/products/:id/narcotics` (single) and `/bulk/narcotics` (multiple).
- `GET /admin/products/narcotics` (filtered view).
- Every change written to Activity Logs / `narcoticsAudit`.

**Test Case for Phase 11:** Flag a product as Narcotics — it now appears in the filtered view. Remove
the flag — it disappears from that view immediately. Confirm two Activity Log entries exist (one add,
one remove) with the correct admin and timestamp on each.

---

## Phase 12 — Email OTP Verification

**Goal:** FR-CW-09 — required before any order (including guest checkout) is accepted.

- `otp.service.js`: generate, email, verify; expiry + rate limiting.

**Test Case for Phase 12:** Request an OTP for a test email — it arrives and matches what's stored
(hashed) in the `otps` collection. Entering the correct code verifies successfully; entering a wrong
code 4 times in a row triggers the rate-limit cooldown, not a 5th silent attempt.

---

## Phase 13 — Standard Order Workflow (COD only)

**Goal:** the simplest full order path works end-to-end, before payment gateway complexity is added.

- Cart → checkout → OTP → Cash on Delivery → order created in MongoDB.
- Confirmation email sent.

**Test Case for Phase 13:** Full Postman/script walkthrough: add 2 products to a cart payload, submit
checkout with a valid OTP and COD, confirm the order exists with the correct total, the correct
delivery charge for the given city, and a confirmation email was sent.

---

## Phase 14 — Instant Order Workflow

**Goal:** FR-CW-12 / FR-AD-19.

- Prescription upload + contact details, no product selection, order created with empty `items[]`.
- Admin endpoint to add medicines + total after review.

**Test Case for Phase 14:** Submit an Instant Order with a prescription file and no items — it's
created with `items: []` and status "pending pricing". Using the admin endpoint to add 2 medicines
and a total updates the order and moves it to normal `pending` status.

---

## Phase 15 — Narcotics Order Workflow

**Goal:** Section 4/9's compliance-critical path — prescription verification gating.

- Detecting a Narcotics-flagged item in the cart at submission time (snapshotted as `requiresVerification`).
- Order created at `pending_verification`; admin approve/reject endpoints.

**Test Case for Phase 15 (this is exactly what `tests/unit/narcoticsGate.test.js` should assert):**

- Cart with a Narcotics-flagged product cannot be submitted without a prescription file attached.
- Resulting order has `requiresVerification: true` and status `pending_verification`.
- Flagging the product as non-narcotic _after_ this order exists does not change this order's
  `requiresVerification` value.
- Rejecting the prescription sets status to `rejected` and never allows it to reach `delivered`.

---

## Phase 16 — Payment Gateway Integration (Kuickpay via Habib Metro)

**Goal:** FR-CW-10 (revised) / FR-SYS-08 (revised) — real card payments for non-narcotics orders only.

_Scoped against the confirmed answers from the Habib Metro/Kuickpay questionnaire (Aug 2026):
hosted checkout (card data never touches our server — PCI-DSS SAQ-A), server-to-server webhook +
a backup status-check API, but **no authorize/capture support** and **no refund/void API**. Two
PRD assumptions this phase originally relied on no longer hold — see PRD v3.3 Amendment for the
full rationale. The practical effect: this phase is actually simpler than originally planned, since
there's no deferred-capture logic to build at all._

- `payments/providers/kuickpay.provider.js` behind the existing abstracted `payment.service.js` interface.
- Card payment is **charge-immediately only** — there is no authorize-then-capture step, because the
  gateway doesn't support one and narcotics carts (the only case that ever needed deferred capture)
  are now COD-only by rule (see Phase 15.1 below), so no order ever needs a held charge.
- Card payment method is only offered when the cart contains **zero** Narcotics-flagged products —
  enforced both in the UI and server-side on order submission, not just hidden client-side.
- Webhook handler: on receiving a webhook notification, call Kuickpay's status-check API to
  independently confirm the transaction before trusting the result — never trust the webhook
  payload alone or a browser redirect, since the bank did not clearly confirm an HMAC/signature
  mechanism for the webhook itself.
- `gatewayTransactionId` and `paymentState` (`pending`/`paid`) stored on the order — never any card
  data.

**Test Case for Phase 16:** A standard (non-narcotics) order with card payment is charged and
confirmed only after the webhook notification is independently confirmed via the status-check API —
an unconfirmed/forged webhook payload is rejected. Submitting a cart containing a Narcotics-flagged
product never shows the card option, only COD. Attempting to force `paymentMethod: card` on a
narcotics order via a direct API call (bypassing the UI) is rejected server-side with a clear error.

---

## Phase 15.1 — Narcotics Cart Payment Restriction (COD-only)

**Goal:** enforce the client's decision (Aug 2026, following the Kuickpay questionnaire) that any
cart containing a Narcotics-flagged product is restricted to Cash on Delivery — no card/online
payment option at all. This slots in right after Phase 15 (narcotics detection already exists) and
right before Phase 16 (so Phase 16 never has to handle a narcotics+card case).

- Checkout API: when `requiresVerification` would be `true` for the submitted cart, reject any
  `paymentMethod` other than `cod` with a clear validation error — not a silent downgrade to COD.
- Storefront: the card/online payment option is not rendered at all once a Narcotics-flagged item is
  in the cart (Phase 26 will wire this into the UI; the server-side rule here is what actually
  enforces it).

**Test Case for Phase 15.1:** Submit a narcotics cart with `paymentMethod: "card"` directly via the
API (bypassing any UI) — rejected with a 400, order not created. Submit the same cart with
`paymentMethod: "cod"` — accepted normally, proceeds into the existing Phase 15 verification flow.

---

## Phase 17 — Order Cancellation & Manual Refund Tracking

**Goal:** FR-AD-39 / FR-SYS-10 (revised) / FR-CW-24 — an admin can cancel an unshipped order (e.g.
an out-of-stock medicine). Since Kuickpay confirmed it has **no refund/void API**, refunds cannot be
automated — this phase tracks them manually instead of calling a gateway that can't do it.

- `PATCH /admin/orders/:id/cancel` — allowed only while status is Pending or Packed, optional reason.
- `order.service.js` branches on `paymentState`: COD (every narcotics order, always, plus any
  non-narcotics order paid COD) → nothing to reverse, straight to `Cancelled`. Card-paid → status set
  to `Cancelled` **and** `cancellation.refundStatus` set to `refund_pending` — no gateway call is
  made, because none exists.
- New endpoint: `PATCH /admin/orders/:id/refund` (admin-only) — marks a `refund_pending` order as
  `refunded` once the admin has actually completed the refund manually (bank transfer, outside the
  system). This action is written to Activity Logs with actor and timestamp, same as any other
  state-changing admin action.
- Cancellation writes an Activity Log entry and sends the customer a single cancellation email,
  distinct from the order-confirmation email — for card-paid orders, this email explains the refund
  will be processed manually within a stated number of business days, not instantly.

**Test Case for Phase 17:** Cancel a Pending COD order (including any narcotics order, since those
are always COD per Phase 15.1) — status becomes `Cancelled` immediately, `refundStatus` stays
`not_applicable`, one cancellation email is sent. Cancel a Packed standard order that was card-paid —
status becomes `Cancelled` and `refundStatus` becomes `refund_pending`; no gateway call happens.
Call the new refund endpoint on that order — it moves to `refunded` and an Activity Log entry is
created. Attempt to cancel a Shipped order — the API rejects it (this flow is for pre-fulfillment
cancellation only, not post-shipment returns).

---

## Phase 18 — Google Sheets Sync

**Goal:** FR-SYS-03/04/05 — the client's existing spreadsheet workflow stays fed.

- Queued/retried sync job writing Standard orders and Instant orders to their respective worksheet tabs.

**Test Case for Phase 18:** Place a test order — within the defined SLA it appears as a new row in the
correct Google Sheets tab with every required column populated. Temporarily revoke the service
account's Sheets access, place another order — the order still saves successfully in MongoDB and the
sync retries once access is restored, rather than the order failing.

---

## Phase 19 — Email Notifications & Weekly Report

**Goal:** FR-CW-15 / FR-SYS-06.

- Single confirmation email per order (not more) — and, since Phase 17, exactly one distinct
  cancellation email when applicable.
- Scheduled job generating and emailing the weekly Excel report.

**Test Case for Phase 19:** Place one order — exactly one confirmation email is received, not
duplicated by any retry logic elsewhere in the system. Manually trigger the weekly report job for a
known date range — the emailed Excel file's totals match a direct database query for the same range.

---

## Phase 20 — Admin Account Management (Super Admin)

**Goal:** FR-AD-37/38.

- Super-Admin-only endpoints: create/delete admin, edit role & module access.
- `requireSuperAdmin.js` (from Phase 5) enforced on all of them — checked at the function level on
  every request, not only hidden in the UI (OWASP API5: Broken Function Level Authorization).

**Test Case for Phase 20:** A regular Admin account attempting to create or edit another admin account
gets a 403 — including when called directly via Postman, bypassing the UI entirely. A Super Admin can
create a new Admin, restrict their access to only the Products module, and that Admin's token is then
rejected on, say, the Settings routes.

---

## Phase 21 — Redis: Caching & Rate Limiting on Every API

**Goal:** the performance layer plus the security requirement confirmed for this project — every
endpoint rate-limited, not only the obviously sensitive ones (NFR-SEC-14).

- `redisClient.js`; product list/search results cached with a short TTL.
- `rateLimiter.js`: a Redis-backed token-bucket limiter (the same pattern Stripe and GitHub run in
  production) applied as a **global default middleware on every route**, with tighter, explicit
  overrides on OTP, login, password reset, and the chatbot endpoint (Phase 22).
- Rate-limit key is a composite of IP + account/session, not IP alone.
- Exceeding a limit returns `429` with a `Retry-After` header.

**Test Case for Phase 21:** Request the same product list twice in quick succession — the second
response is measurably faster and a cache-hit is logged. Hammer a plain, non-sensitive endpoint (e.g.
the public product list) past its generous default limit — it still gets throttled with a 429, proving
the _global_ limiter applies even where nothing sensitive is happening. Hammer the OTP endpoint past
its much stricter limit — it's blocked consistently even across two different server processes
(proving the counter is shared via Redis, not per-process memory).

---

## Phase 22 — AI Chatbot (Groq)

**Goal:** FR-CW-23 / NFR-COMP-03 — the symptom-assistant, with its guardrails.

- `groqClient.js` + `chatbot.service.js`: symptom text in, product suggestions out.
- Hard filter excluding any Narcotics-flagged product from suggestions.
- Every response includes the disclaimer; every conversation logged to `chatbotConversations`.
- Covered by the endpoint's own strict rate limit from Phase 21.

**Test Case for Phase 22:** Ask the chatbot about a symptom whose obvious product match is
Narcotics-flagged — confirm it is never suggested, even indirectly. Confirm the disclaimer text is
present on every single response, not just the first message in a conversation.

---

## Phase 23 — Admin Dashboard: Core Screens

**Goal:** first real UI — Overview, Products (incl. Narcotics toggle, discount field, multi-image
upload, search), Categories, Orders (all 3 types, incl. the Cancel action from Phase 17).

- Wired to the APIs from Phases 4, 8, 10, 11, 13–15, 17.

**Test Case for Phase 23:** Manual QA pass: an admin can log in, see today's order count match the
database, flag a product Narcotics from the UI and see it reflected instantly, upload a second product
image and set it as primary, approve a narcotics order's prescription, and cancel a Pending order and
see its status and payment state update correctly.

---

## Phase 24 — Admin Dashboard: Remaining Modules

**Goal:** Cities, Discounts, Admin Users (Super Admin screens), Settings (incl. About/Contact/Pages),
Activity Logs.

- Wired to Phases 6, 7, 8, 20.

**Test Case for Phase 24:** A Super Admin creates a new Admin from the UI, edits their module access,
and confirms in Activity Logs that the change was recorded. Editing the About page text in Settings
and confirming it's ready for the storefront to display (Phase 26).

---

## Phase 25 — Customer Storefront: Core Shopping Flow

**Goal:** Next.js storefront — browsing, product detail, cart, checkout (Standard order, Phase 13).

- Server-rendered product/category pages; discount badge display (Phase 8); multi-image gallery on the product page (Phase 10).

**Test Case for Phase 25:** A full manual walkthrough as a guest: search a product, see its correct
discounted price if one applies, browse its multiple images, add to cart, complete checkout with OTP
and COD, and see the order appear in the admin dashboard (Phase 23) within seconds.

---

## Phase 26 — Customer Storefront: Instant Order, Narcotics, & Extras

**Goal:** Instant Order and Narcotics upload flows (Phases 14–15), card payment (Phase 16), About,
Contact, WhatsApp icon, chatbot widget (Phase 22).

**Test Case for Phase 26:** Submit an Instant Order end-to-end as a guest. Add a Narcotics-flagged
product to cart and confirm checkout blocks progress until a prescription is uploaded. Click the
WhatsApp icon and confirm it opens a chat with the correct business number. Ask the chatbot a symptom
question and confirm a sensible, disclaimer-included response renders in the UI.

---

## Phase 27 — SEO Implementation

**Goal:** Section 19.3 of the PRD, made real rather than just planned.

- `sitemap.js`, `robots.js`, per-page metadata, Product/Organization/LocalBusiness JSON-LD.

**Test Case for Phase 27:** Fetch `/sitemap.xml` and confirm it lists real product/category URLs.
Use Google's Rich Results Test on a live product page and confirm the Product schema is detected with
no errors. Verify domain ownership in Google Search Console and submit the sitemap successfully.

---

## Phase 28 — Security Hardening Pass

**Goal:** the full Section 17 (Security Protocols) checklist, verified rather than assumed — built
around the OWASP API Security Top 10, not just a generic pass.

- helmet, CSRF tokens, 2FA on admin accounts, HttpOnly/Secure/SameSite cookies, firewall + fail2ban on the VPS, dependency audit.
- Explicit verification of the three authorization risks called out in Section 17.4: object-level
  (can't fetch another customer's order by changing an ID), property-level/mass-assignment (a
  checkout request can't set `isNarcotic` or `price`), and function-level (Super-Admin routes reject
  a regular Admin's token even via direct API call, not just hidden UI — already unit-tested in Phase 20).
- Confirm the global rate limiter from Phase 21 is genuinely active on every route, not only the ones tested individually so far.

**Test Case for Phase 28:** Run `npm audit` — zero high/critical vulnerabilities outstanding. Run an
automated scan (OWASP ZAP) against staging and confirm no high-severity findings. Attempt a CSRF
request from an unrelated origin against an admin state-changing route — it's rejected. Attempt to
fetch another customer's order by incrementing/guessing an order ID — rejected. Attempt to smuggle an
`isNarcotic: true` field into an unrelated public request — ignored, not applied.

---

## Phase 29 — Broader Test Suite & UAT Prep

**Goal:** beyond the per-phase unit tests above, an integration pass across the full system.

- Integration tests covering each of the workflows' happy path and one failure path, including
  Order Cancellation (Phase 17).
- Full run-through of every Acceptance Criterion listed in the PRD.

**Test Case for Phase 29:** All automated tests (unit + integration) pass in CI. The full PRD
Acceptance Criteria list is walked manually against staging by the client, with each item explicitly
signed off, not assumed.

---

## Phase 30 — Deployment

**Goal:** production cutover.

- Provision the VPS (Nginx, PM2, SSL via Let's Encrypt, firewall, fail2ban).
- **Switch from the MongoDB free tier to the paid Flex tier** — this is the one moment the project
  moves off free/dev infrastructure onto what actually holds real customer and order data.
- Domain pointed at the VPS; Redis running on the VPS.
- Real Habib Metro production credentials swapped in (sandbox credentials removed).

**Test Case for Phase 30:** Place one real, small COD order against the live production URL end to
end. Confirm it lands in the production Flex-tier database, not the old free-tier dev cluster.
Confirm HTTPS is enforced (an `http://` request redirects to `https://`) and the SSL certificate is
valid.

---

## Phase 31 — Launch & Handover

**Goal:** the client can run the business without a developer in the loop for anything covered so far.

- Client's real narcotics product list applied (cross-checked against the earlier candidate scan).
- Client-provided AI-generated image folder imported and matched to products (Phase 10's multi-image support).
- Walkthrough/handover session with the client on the admin dashboard, including how to cancel an
  order and confirm its refund status.

**Test Case for Phase 31:** The client, unaided, successfully flags a product as Narcotics, applies a
storewide discount, uploads a second image to a product, cancels a test order and confirms the refund
path, and processes one full order from Pending to Delivered in the live dashboard.
