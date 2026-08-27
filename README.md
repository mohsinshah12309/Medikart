# Medikart — Pharmacy E-Commerce & Management System

> **Pakistan-based pharmacy platform** — prescription verification, narcotics compliance, multi-channel order management, and an AI-powered symptom chatbot.

---

## Project Status

| Layer | Status |
|---|---|
| **Backend API** (Phases 1–22) | ✅ Complete |
| **Admin Dashboard** (Phases 23–24) | ✅ Built |
| **Customer Storefront** (Phases 25–26) | ✅ Built |
| **Integration Tests** (Phase 29) | ✅ 12 / 12 passing |
| **Theme** | Midnight Teal & Mint Green (client-approved dark design) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js · Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Cache / Rate Limiting** | Redis (ioredis) |
| **Admin Dashboard** | React 18 · Vite · Tailwind CSS |
| **Customer Storefront** | Next.js (SSR/SSG) · Tailwind CSS |
| **Authentication** | JWT Bearer header · bcrypt · TOTP 2FA (speakeasy) |
| **Email** | Nodemailer (Mailtrap sandbox → SMTP production) |
| **File Storage** | Self-hosted · Sharp (WebP processing) |
| **Payment Gateway** | Kuickpay via Habib Metro Bank (sandbox) |
| **AI Chatbot** | Groq API (LLaMA) |
| **Google Sheets Sync** | Google Sheets API v4 (service account) |
| **Reverse Proxy** | Nginx |
| **Process Manager** | PM2 (production) |
| **Testing** | Jest · Supertest |

---

## Implemented Phases

### Backend (Phases 1–22) — ✅ Complete

| Phase | Description |
|---|---|
| **1** | Project scaffolding — monorepo, Express / Next.js / Vite apps, `.env` setup, Git hygiene, health endpoint |
| **2** | MongoDB Atlas connection — M0 dev cluster, DB health check |
| **3** | Core data models — `Product`, `Category`, `City` schemas (incl. `isNarcotic`, discount fields, multi-image arrays) |
| **4** | Product & Category CRUD APIs — Zod-validated, explicit field allow-lists, no mass-assignment risk |
| **5** | Admin authentication & roles — JWT login, `auth.js` middleware, `requireSuperAdmin`, seed script |
| **6** | Admin password reset — short-lived single-use tokens, Mailtrap email delivery |
| **7** | Cities & delivery pricing — server-side charge calculation (PKR 250 configured / PKR 500 default) |
| **8** | Discounts — product → category → storewide precedence model; no stacking |
| **9** | Bulk Excel product import — `scripts/importProducts.js`, row-level validation, 5,606 products in dev DB |
| **10** | Image upload & processing pipeline — multi-image per product, Sharp WebP conversion, primary image selection, placeholder handling |
| **11** | Narcotics flagging & audit — single/bulk flag endpoints, filtered view, activity log on every change |
| **12** | Email OTP verification — generation, delivery, expiry, 4-attempt rate limiting |
| **13** | Standard COD order workflow — cart → OTP → order creation → confirmation email |
| **14** | Instant order workflow — prescription upload, empty `items[]`, admin pricing endpoint |
| **15** | Narcotics order workflow — prescription gating, `pending_verification` status, approve/reject endpoints |
| **15.1** | Narcotics COD-only restriction — server-side block of `paymentMethod: card` on narcotics carts |
| **16** | Payment gateway (Kuickpay / Habib Metro) — hosted checkout, webhook + independent status-check verification, charge-immediately only (no refund API → manual tracking) |
| **17** | Order cancellation & manual refund tracking — cancel pre-shipment, `refund_pending` → `refunded` states, activity log |
| **18** | Google Sheets sync — queued/retried job, Standard Orders and Instant Orders worksheet tabs |
| **19** | Email notifications & weekly report — single confirmation email per order, scheduled weekly Excel report |
| **20** | Admin account management (Super Admin) — create/edit/delete admins, module-level permission enforcement |
| **21** | Redis caching & global rate limiting — product list cache, token-bucket limiter on every route, stricter limits on OTP / login / chatbot |
| **22** | AI chatbot (Groq) — symptom → OTC suggestions, narcotics hard-filter, disclaimer on every response, conversation logging |

### Admin Dashboard (Phases 23–24) — ✅ Built

| Phase | Description |
|---|---|
| **23** | Core screens — Overview, Products (narcotics toggle, discounts, multi-image), Categories, Orders (all 3 types + cancel action) |
| **24** | Remaining modules — Cities, Discounts, Admin Users, Settings, Activity Logs, **Messages inbox** (client-approved addition) |

### Customer Storefront (Phases 25–26) — ✅ Built

| Phase | Description |
|---|---|
| **25** | Core shopping flow — SSR product/category pages, discount badges, multi-image gallery, cart, Standard COD checkout |
| **26** | Extended flows — Instant Order, Narcotics prescription upload, card payment (Kuickpay), About/Contact pages, WhatsApp button, chatbot widget |

### Remaining Phases

| Phase | Description | Status |
|---|---|---|
| **27** | SEO — sitemap.xml, robots.txt, per-page metadata, JSON-LD structured data | Planned |
| **28** | Security hardening — helmet, 2FA enforcement, `npm audit`, OWASP ZAP scan | Planned |
| **29** | Integration test suite & UAT prep | ✅ 12 / 12 passing |
| **30** | Production deployment — VPS, Nginx, PM2, SSL (Let's Encrypt), MongoDB Flex tier | Planned |
| **31** | Launch & client handover | Planned |

---

## Test Coverage

### Unit Tests — 23 suites (`server/tests/unit/`)

| Test File | What It Covers |
|---|---|
| `adminAuth.test.js` | Login, JWT issuance, wrong-password rejection |
| `admin2FA.test.js` | TOTP setup, QR code generation, verify, disable |
| `adminUserManagement.test.js` | Create/edit/delete admins, last-super-admin safeguard |
| `adminSecurityHardening.test.js` | Auth middleware, role enforcement, token rejection |
| `apiSecurityHardening.test.js` | OWASP API Top 10 — BOLA, mass-assignment, function-level auth |
| `chatbot.test.js` | Groq integration, narcotics filter, disclaimer presence |
| `databaseIntegrity.test.js` | Unique constraints, required fields, referential integrity |
| `deliveryCharge.test.js` | PKR 250 / 500 server-side charge calculation |
| `discount.test.js` | Product → category → storewide precedence, no stacking |
| `emailDedup.test.js` | Single confirmation email per order (no duplicates on retry) |
| `imageProcessor.test.js` | Sharp WebP conversion, real MIME-type validation |
| `importProducts.test.js` | Bulk import — valid rows accepted, invalid rows reported with reason |
| `instantOrder.test.js` | Prescription upload, empty items, admin pricing flow |
| `massAssignment.test.js` | `isNarcotic`, `price`, `role` cannot be injected via request body |
| `narcoticsGate.test.js` | Prescription required, `pending_verification` status, snapshot immutability |
| `orderCancellation.test.js` | Cancel pre-shipment, refund status branching, post-shipment rejection |
| `orderValidation.test.js` | Checkout field validation (Zod schema) |
| `otp.test.js` | OTP generate, verify, expiry, 4-attempt rate limit |
| `paymentGateway.test.js` | Kuickpay webhook verification, independent status-check confirmation |
| `prescriptionAccess.test.js` | Prescription files accessible only to the owning admin |
| `productionReadiness.test.js` | Environment variable checks, secrets validation |
| `sheetsSync.test.js` | Google Sheets sync queue, retry-on-failure logic |
| `weeklyReport.test.js` | Weekly Excel report generation and email delivery |

Run unit tests:
```bash
cd server && npm test
```

### Integration Tests — `server/tests/integration/medikartWorkflows.test.js`

```
PASS  tests/integration/medikartWorkflows.test.js  (31.2 s)

  Medikart Core Workflows Integration Tests
    Workflow: Standard Order
      ✓ Happy Path: placing a standard COD order succeeds with valid OTP      (1008 ms)
      ✓ Failure Path: placing standard order fails with invalid OTP            (911 ms)
    Workflow: Instant Order
      ✓ Happy Path: submit prescription then pricing by admin                 (1206 ms)
      ✓ Failure Path: pricing with invalid product ID is rejected              (332 ms)
    Workflow: Narcotics Order
      ✓ Happy Path: submits prescription, order goes to pending_verification   (846 ms)
      ✓ Failure Path: standard endpoint without prescription → blocked         (789 ms)
    Workflow: Order Cancellation
      ✓ Happy Path: cancel pending order sets status to cancelled             (1339 ms)
      ✓ Failure Path: cancel already shipped order is rejected                (1091 ms)
    Workflow: Payment
      ✓ Happy Path: initiate payment then confirm via webhook                 (1219 ms)
      ✓ Failure Path: webhook fails with unknown transaction ID               (1072 ms)
    Workflow: AI Chatbot
      ✓ Happy Path: returns OTC recommendations with disclaimer                (310 ms)
      ✓ Failure Path: filters out narcotics products                           (247 ms)

  Tests:       12 passed, 12 total
```

Run integration tests:
```bash
cd server
npx jest tests/integration/medikartWorkflows.test.js --testMatch="**/tests/**/*.test.js" --forceExit --verbose
```

> **Note:** `jest.config.js` scopes the default `npm test` to unit tests only. Use the command above to run the integration suite.

---

## Project Structure

```
Medikart/
├── apps/
│   ├── admin/               # React 18 + Vite admin dashboard (SPA)
│   └── web/                 # Next.js customer storefront (SSR/SSG)
├── server/
│   ├── src/
│   │   ├── app.js
│   │   ├── config/          # db.js, redisClient.js
│   │   ├── middleware/       # auth.js, requireSuperAdmin.js, rateLimiter.js, errorHandler.js
│   │   ├── modules/
│   │   │   ├── activity-logs/
│   │   │   ├── admin-users/     # login, 2FA, password reset, account management
│   │   │   ├── categories/
│   │   │   ├── chatbot/         # Groq AI, narcotics filter, conversation log
│   │   │   ├── cities/
│   │   │   ├── contact-messages/ # Messages inbox (client-approved addition)
│   │   │   ├── discounts/
│   │   │   ├── integrations/    # Google Sheets sync queue
│   │   │   ├── orders/          # Standard, Instant, Narcotics, Cancellation
│   │   │   ├── otp/
│   │   │   ├── payments/        # Kuickpay provider, webhook handler
│   │   │   ├── prescriptions/
│   │   │   ├── products/        # CRUD, narcotics, images, bulk import
│   │   │   └── settings/
│   │   ├── jobs/            # weeklyReport.js scheduler
│   │   └── utils/           # errors.js, email.js, imageProcessor.js
│   ├── tests/
│   │   ├── unit/            # 23 Jest unit test suites
│   │   └── integration/     # medikartWorkflows.test.js (12 workflow tests)
│   ├── scripts/             # importProducts.js, seedAdmin.js
│   └── uploads/             # Self-hosted product images (WebP)
├── docs/
│   ├── design.md            # UI/UX design system — Midnight Teal & Mint Green
│   ├── phases.md            # Delivery phases 1–31 + approved addenda (A, B, C)
│   ├── rules.md             # Architecture & coding rules
│   └── PRD.pdf              # Product Requirements Document
├── nginx/                   # Reverse proxy configs (staging + production)
└── postman/                 # API collection
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | v18+ (v24+ recommended) |
| npm | v9+ (v10+ recommended) |
| MongoDB | Atlas Free (M0) cluster or local instance |
| Redis | v6+ (local or remote) |

---

## Setup & Running Locally

### 1. Install Dependencies

```bash
cd server      && npm install
cd apps/admin  && npm install
cd apps/web    && npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` inside `server/`, `apps/admin/`, and `apps/web/`, then fill in your values.

Key variables for `server/.env`:

```env
MONGODB_URI=        # MongoDB Atlas connection string
REDIS_URL=          # redis://localhost:6379
JWT_SECRET=         # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRY=8h
SMTP_HOST=          # Mailtrap sandbox or production SMTP
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
GROQ_API_KEY=       # Groq Cloud API key
```

### 3. Seed the Super Admin

```bash
cd server
node scripts/seedAdmin.js
```

Default **development** credentials (change in production):

| Field | Value |
|---|---|
| Email | `admin@medikart.pk` |
| Password | `medikart@admin123` |
| Role | `super_admin` |

### 4. Start All Services

```bash
# Backend API — http://localhost:5000
cd server && npm run dev

# Admin Dashboard — http://localhost:5173
cd apps/admin && npm run dev

# Customer Storefront — http://localhost:3000
cd apps/web && npm run dev
```

---

## Design System

The active UI theme is **Midnight Teal & Mint Green** — a dark design system explicitly approved by the client.

| Token | HEX | Role |
|---|---|---|
| Background | `#0a1628` | Root page background, sidebar base |
| Surface | `#0f2035` | Cards, panels, modal backgrounds |
| Surface Elevated | `#162845` | Dropdowns, nav drawers |
| **Primary (Mint Green)** | `#00d4aa` | CTAs, active states, highlights |
| Primary Hover | `#00b894` | Button hover / pressed states |
| Teal Accent | `#14b8a6` | Links, icon accents |
| Text Primary | `#e2e8f0` | Body text on dark surfaces |
| Text Secondary | `#94a3b8` | Labels, metadata, inactive tabs |
| Warning | `#f59e0b` | Narcotics alerts, prescription-pending states |
| Error | `#ef4444` | Validation errors, critical alerts |
| Success | `#10b981` | Confirmed orders, positive status badges |

Full specification including typography, animations, and accessibility: [`docs/design.md`](docs/design.md)

---

## Security Architecture

| Concern | Implementation |
|---|---|
| **Authentication** | JWT Bearer header on all admin routes — no session cookies, so CSRF is not applicable by design |
| **Authorization** | Role-based (`super_admin` / `admin`) + module-level permissions enforced server-side on every request |
| **2FA** | TOTP via speakeasy, optional per admin account |
| **Password storage** | bcrypt (cost factor 12); `passwordHash` field excluded from all queries by default (`select: false`) |
| **Rate limiting** | Redis-backed token-bucket limiter applied globally; stricter per-route limits on OTP, login, and chatbot |
| **Input validation** | Zod on all request bodies; explicit field allow-lists prevent mass-assignment |
| **File uploads** | Real MIME-type validation (not extension-only); Sharp processing before storage |
| **Timing attacks** | Constant-time bcrypt compare even when the user does not exist (dummy hash path) |

---

## Key Business Rules

- **Narcotics:** Any cart containing a narcotics-flagged product is **COD-only**. A prescription file is required. Admin must approve/reject before the order proceeds.
- **Delivery charges:** Calculated server-side exclusively — PKR 250 for configured cities, PKR 500 default. Clients cannot inject a charge value.
- **Discounts:** Product-level > Category-level > Storewide. Precedence model — never stacked.
- **Payments:** Card payment (Kuickpay hosted checkout) is never offered for narcotics orders. Webhook payloads are always independently verified via the status-check API before the order is marked paid.
- **Refunds:** Kuickpay has no refund/void API. Refunds are tracked manually (`refund_pending` → `refunded`) with admin sign-off and a mandatory activity log entry.
- **Chatbot:** Narcotics products are hard-filtered from all AI suggestions regardless of prompt. Every response includes the medical disclaimer.
- **Google Sheets sync:** Orders are queued and retried up to 4 times on failure — a Sheets outage never blocks order creation.

---

## Documentation

| File | Contents |
|---|---|
| [`docs/design.md`](docs/design.md) | Complete UI/UX design system — canonical Midnight Teal dark palette, typography, animations, accessibility guidelines |
| [`docs/phases.md`](docs/phases.md) | Delivery plan (Phases 1–31) + Addendum A (dark theme) + Addendum B (Messages inbox) + Addendum C (Kuickpay answer sheet) |
| [`docs/rules.md`](docs/rules.md) | Architecture, coding, and security rules enforced throughout the project |
| [`docs/PRD.pdf`](docs/PRD.pdf) | Original Product Requirements Document |

---

## Repository

**GitHub:** [https://github.com/mohsinshah12309/Medikart](https://github.com/mohsinshah12309/Medikart)  
**Account:** mohsinalishahnaqvi123@gmail.com
