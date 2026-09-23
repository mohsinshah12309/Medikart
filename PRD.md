# Medikart — Product Requirements Document (PRD)

> **Document Version:** 2.0 (Production Release)  
> **Target Domain:** `medikart.pk` | `www.medikart.pk` | `admin.medikart.pk`  
> **Platform Classification:** Licensed E-Pharmacy, Healthcare E-Commerce & Multi-Vendor Network  
> **Status:** Production-Ready  

---

## 1. Executive Summary & Vision

**Medikart** (`medikart.pk`) is an authentic digital healthcare and e-pharmacy platform built specifically for Pakistan's pharmaceutical and consumer wellness market. It bridges verified physical pharmacies with retail patients across Pakistan, providing rapid intra-city delivery (2–4 hours), nationwide express shipping (24–48 hours), automated chronic prescription refills, DRAP-compliant drug safety verification, and an AI-assisted pharmacist consultant.

### Key Value Propositions
- **100% Authentic Medications:** Direct integration with licensed pharmacy partners and cold-chain integrity.
- **Drug Regulatory Authority of Pakistan (DRAP) Compliance:** Strict separation between Over-The-Counter (OTC) remedies and controlled/narcotic pharmaceuticals.
- **Dvago-Style 3-Tier Search:** Zero-latency instant search categorizing matching keywords, live product cards, and category pathways with background focus blur.
- **Automated Chronic Care:** 30-day recurring prescription refill scheduler with automated email and WhatsApp alerts.
- **PWA Capabilities:** Instant home-screen installable application on Android and iOS devices.

---

## 2. System Architecture & Infrastructure

```mermaid
flowchart TD
    CF["Cloudflare Edge (Full strict SSL / DDoS Mitigation / CDN)"]
    NGINX["Hostinger VPS Nginx Reverse Proxy (:80 / :443)"]
    PM2_BACKEND["Express.js API Cluster (:5000)"]
    PM2_WEB["Next.js 14 App Router (:3000)"]
    ADMIN_DIST["React 18 + Vite Admin SPA (dist/)"]
    REDIS["Local Redis Server (Cache-Aside & Sliding Rate Limiter)"]
    ATLAS["MongoDB Atlas Cloud Cluster (Replica Set)"]

    CF -->|medikart.pk / www.medikart.pk| NGINX
    CF -->|admin.medikart.pk| NGINX
    NGINX -->|/api/* & /banners| PM2_BACKEND
    NGINX -->|/ (Storefront)| PM2_WEB
    NGINX -->|admin.medikart.pk| ADMIN_DIST
    NGINX -->|/uploads/*| NGINX_STATIC["Local Disk (/server/uploads)"]

    PM2_BACKEND <--> REDIS
    PM2_BACKEND <--> ATLAS
    PM2_WEB -->|SSR loopback :5000| PM2_BACKEND
```

### Technology Matrix
| Layer | Framework / Technology | Purpose |
| :--- | :--- | :--- |
| **Storefront** | Next.js 14 (App Router), React 18, Tailwind CSS | High-speed SSR/SSG consumer storefront, SEO metadata, PWA integration |
| **Admin Portal** | React 18, Vite 6, Tailwind CSS, Recharts | Single Page Application (SPA) for inventory, order processing, and commissions |
| **Backend API** | Node.js 20 LTS, Express.js | Modular REST API with PM2 cluster mode orchestration |
| **Database** | MongoDB Atlas (Mongoose ODM) | Document database with compound indexing and 30-day TTL auto-pruning |
| **Cache Layer** | Redis (`ioredis` + resilient in-memory fallback) | Cache-aside catalog caching & sliding-window rate limit counters |
| **AI Services** | Groq LLaMA & Google Gemini 1.5 | Clinical blog generation & OTC symptom consultation engine |
| **Reverse Proxy** | Nginx | SSL termination, HTTP/2, Gzip compression, and static asset serving |

---

## 3. User Roles & Permission Model

| Role | Access Scope | Capabilities |
| :--- | :--- | :--- |
| **Guest Visitor** | Public Storefront | Search catalog, view products, maintain persistent guest cart (UUID cookie), checkout via OTP |
| **Registered Customer** | Storefront & Account | Order tracking, saved addresses, wishlist, 30-day recurring refill subscriptions |
| **Pharmacy Partner** | Admin Panel (Scoped) | Manage assigned retail store stock, view assigned dispatch orders, track branch payouts |
| **Admin / Pharmacist** | Admin Panel | Review prescriptions, price instant orders, verify narcotics scripts, manage catalog |
| **Super Admin** | Full System Control | Multi-vendor commission ledger, user RBAC, TOTP 2FA enforcement, system settings |

---

## 4. Core Functional Modules

### 4.1. Dvago-Style 3-Tier Instant Search & Autocomplete
* **Tier 1 (Suggested Keywords):** Top trending search queries seeded with verified consumer medicines (excluding manufacturer brand names).
* **Tier 2 (Matching Products):** Instant medicine cards displaying price, unit dosage, prescription badge, and quick `+` Add-to-Cart / `❤️` Wishlist.
* **Tier 3 (Matching Categories):** Direct category shortcut pills for immediate catalog filtering.
* **UX:** Interactive backdrop blur with auto-focus and keyboard navigation.

### 4.2. Prescription Verification & Drug Safety Classification
* **OTC Products:** Direct online purchase and automated checkout.
* **Prescription Required (Rx):** Mandatory prescription attachment verified before dispatch.
* **Narcotics & Controlled Substances (Schedule X):** Hard-blocked from standard e-commerce carts and online card payments. Requires licensed pharmacist manual review and COD fulfillment.
* **Instant Order Flow (`/instant-order`):** Customer uploads prescription photo/PDF; pharmacist reviews slip in admin drawer, sets medicines and pricing, and triggers confirmation.

### 4.3. Monthly Chronic Refill Program (`/refill`)
* **Patient Maintenance:** Chronic therapy management for hypertension, diabetes, cardiac care, and asthma.
* **Automated 30-Day Scheduling:** Node-cron scheduler calculates `nextReminderAt`.
* **Multi-Channel Notification:** Dispatches reminder emails (via Mailjet API) and customer alerts 3 days prior to refill renewal.
* **One-Click Reorder:** Pre-populates customer cart with saved chronic medicine dosages.

### 4.4. Multi-Vendor Pharmacy & Commission Tracking
* **Pharmacy Management:** Multi-branch registration with unique license numbers, operating hours, and active toggles.
* **Commission Ledger:** Super Admin dashboard calculates platform commission vs pharmacy payout per order.
* **Automated Google Sheets Sync:** Resilient background queue synchronizes order records to Google Sheets for pharmacy fulfillment teams.

### 4.5. Clinical Content & AI Blog Engine (`/blogs`)
* **Medical Review Standards:** DRAP-compliant health guides featuring structured tables, dosage cautions, and physician disclaimers.
* **Sharp 1200x630 Engine:** Automated WebP banner optimization with zero compression artifacts.
* **Dual AI Integration:** Google Gemini API & Groq for medical drafting with manual pharmacist editorial oversight.

### 4.6. AI Pharmacist Assistant ("Medi" Chatbot)
* **Symptom Guide:** OTC suggestions with strict pediatric safety rules (syrups only for children, weight-based dosage warnings).
* **Narcotic Hard-Filter:** In-memory keyword and category blocker preventing any controlled drug recommendations.
* **Storefront Integration:** Proactive links to Instant Order, Monthly Refill, WhatsApp hotline, and Order Tracking.

### 4.7. Progressive Web App (PWA)
* **Standalone Execution:** Custom manifest (`manifest.webmanifest`) and service worker (`sw.js`).
* **Interactive Install Triggers:** App install button in header navbar, mobile drawer, and footer with device-specific instructions for iOS Safari and Android Chrome.

---

## 5. Payment Gateways & Banking Integrations

* **Cash on Delivery (COD):** Nationwide availability with intra-city dispatch options.
* **Digital Cards & Wallets (Kuickpay / 1Bill):**
  - Hosted checkout session (PCI-DSS SAQ-A compliant).
  - Webhook verification via constant-time HMAC-SHA256 signature checking.
  - Fallback status reconciliation API for delayed webhooks.
* **Meezan Bank & Local Banking:** Supports direct 1Bill / Kuickpay consumer number payments through Meezan Mobile App, Habib Metro, and local Pakistani Debit/Credit cards.

---

## 6. Non-Functional Requirements (NFRs)

### 6.1. Security & Compliance
* **NFR-SEC-01 (JWT & 2FA):** 32+ character secrets, bcrypt password hashing, TOTP 2FA for super administrators.
* **NFR-SEC-02 (CORS Strictness):** Explicit origin allowlist (`https://medikart.pk`, `https://www.medikart.pk`, `https://admin.medikart.pk`).
* **NFR-SEC-03 (File Upload Hardening):** Memory storage upload with magic-byte validation (Sharp metadata for images, `%PDF-` header for PDF scans). Public directory browsing disabled for `/uploads/prescriptions/`.
* **NFR-SEC-04 (Log Sanitization):** Recursive masking of sensitive tokens, CVVs, passwords, and OTPs in server audit logs.

### 6.2. High Availability & Concurrency
* **NFR-PERF-01 (PM2 Cluster Mode):** Zero-downtime reload across all VPS CPU cores with primary-worker-only cron scheduling.
* **NFR-PERF-02 (Redis Resilience):** Cache-aside with automatic in-memory fallback on connection interruption.
* **NFR-PERF-03 (Connection Pooling):** MongoDB connection pool (`min: 10`, `max: 100`) forced over IPv4 to prevent DNS resolution latency.
* **NFR-PERF-04 (HTTP Response Caching):** Public catalog queries cached with `public, max-age=60, s-maxage=300` for Cloudflare CDN caching; private cart and auth endpoints protected with strict `no-store`.

---

## 7. Production Domain & Deployment Specifications

* **Primary Storefront:** `https://medikart.pk` & `https://www.medikart.pk`
* **Admin Dashboard:** `https://admin.medikart.pk`
* **Origin Server:** Single Hostinger VPS (Ubuntu/Debian) running Nginx reverse proxy, Node 20, PM2, and Redis.
* **SSL/TLS Mode:** Cloudflare **Full (strict)** with Let's Encrypt / Cloudflare Origin CA certificates.
