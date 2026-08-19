# Medikart — Pharmacy E-Commerce & Pharmacy Management System

Medikart is a custom Pharmacy E-Commerce and Pharmacy Management System.

## Implementation Status

Backend development is complete through **Phase 15 — Narcotics Order Workflow**. The
project follows a backend-first delivery plan: each API workflow is implemented and verified before
it is consumed by the admin dashboard or customer storefront.

### Completed Phases (1–15)

1. **Project scaffolding** — Established the monorepo, base Express/Next.js/React applications,
   environment examples, Git hygiene, and a health endpoint.
2. **Database connection** — Added MongoDB Atlas development connectivity and database status in
   the health check.
3. **Core data models** — Created the catalog schemas for products, categories, and delivery cities.
4. **Product and category management** — Added validated admin CRUD APIs with explicit request
   field allow-lists.
5. **Admin authentication and roles** — Added JWT-protected admin routes, roles, permissions, and
   Super Admin authorization support.
6. **Admin password reset** — Added short-lived, single-use password-reset tokens and reset email
   endpoints.
7. **Cities and delivery pricing** — Added city management and server-side delivery-charge
   calculation (configured active cities vs. the default charge).
8. **Discounts** — Implemented product, category, and storewide discounts with the documented
   product → category → storewide precedence.
9. **Bulk Excel import** — Added validated product catalog import with row-level error reporting.
10. **Product image pipeline** — Added multi-image uploads, Sharp-based WebP processing, primary
    image selection, deletion, and placeholder-image handling.
11. **Narcotics flagging and audit** — Added single and bulk narcotics controls, a filtered view,
    and audit logging for every change.
12. **Email OTP verification** — Added generation, delivery, verification, expiry, and rate
    limiting for order-verification OTPs.
13. **Standard COD orders** — Added the cart-to-checkout workflow: valid OTP verification,
    server-calculated delivery charge and totals, MongoDB order creation, and confirmation email.
14. **Instant orders** — Added prescription upload + contact-details ordering with empty items,
    admin pricing, and structured totals.
15. **Narcotics order workflow** — Added prescription verification gating, the
    `requiresVerification` snapshot (FR-AD-16), `pending_verification` status, and
    approve/reject review endpoints.

### Automated Test Suites

The backend logic and compliance requirements for Phases 1–15 are fully covered by automated Jest test suites in `server/tests/unit/` (11 test suites covering unit logic, access control, Zod validation, instant/narcotics orders, and rate limiting).

## Project Structure

This project is laid out as a monorepo consisting of the following key directories:

- `apps/web/` — Public customer storefront built using Next.js (SSR/SSG).
- `apps/admin/` — Authenticated pharmacy staff dashboard built with React + Vite (SPA).
- `server/` — Express API backend server.
- `docs/` — Reference specification and design documents.
- `nginx/` — Reverse proxy configurations for staging and production.

## Prerequisites

- **Node.js**: v18 or later (v24+ recommended)
- **npm**: v9 or later (v10+ recommended)
- **MongoDB**: Atlas Free (M0) cluster or local MongoDB instance
- **Redis**: Local or remote instance for caching and rate limiting

## Initial Setup

1. **Install Dependencies**:
   Run `npm install` inside each of the folders:
   - `server/`
   - `apps/web/`
   - `apps/admin/`

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` in each respective app folder and adjust the settings.

## Running Locally

- **Express Server**: Run `npm run dev` in `server/` (runs on port 5000 by default).
- **Admin Dashboard**: Run `npm run dev` in `apps/admin/` (runs on port 5173 by default).
- **Customer Storefront**: Run `npm run dev` in `apps/web/` (runs on port 3000 by default).
