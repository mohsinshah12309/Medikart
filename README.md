# Medikart — Pharmacy E-Commerce, Multi-Vendor & Clinical Content Platform

> **Pakistan's Modern Pharmacy & Healthcare Platform** — Prescription verification, narcotics compliance, multi-vendor pharmacy commissions, AI-powered blog content engine, Dvago-style 3-tier instant search, and automated refill reminders.

---

## 🚀 Live Repository

**GitHub:** [https://github.com/mohsinshah12309/Medikart](https://github.com/mohsinshah12309/Medikart)  
**Branch:** `master`

---

## 📊 System Overview & Status

| Layer | Status | Key Features |
|---|---|---|
| **Backend API** (Node / Express) | ✅ Production-Ready | Zod validation, JWT & TOTP 2FA, Redis caching, Groq AI & Google Gemini AI |
| **Admin Dashboard** (React / Vite) | ✅ Feature-Complete | Multi-vendor pharmacy management, commission audit, AI blog editor, order dispatch |
| **Customer Storefront** (Next.js 14) | ✅ Feature-Complete | SSR/SSG catalog, instant 3-tier search, 3D interactive hero, clinical blog directory |
| **Unit & Integration Tests** | ✅ 100% Passing | 24+ unit test suites (incl. `blogs.test.js`), 12 core workflow integration tests |

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose ODM), Redis (ioredis / in-memory fallback)
- **Storefront (apps/web):** Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons
- **Admin Portal (apps/admin):** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Image Processing & Assets:** Sharp (1200x630 WebP banners, real MIME validation)
- **AI Integrations:**
  - **Google Gemini API** (Structured clinical blog generation & SEO writing)
  - **Groq LLaMA** (OTC symptom assistant chatbot with narcotics hard-filter)
- **Payments & Logistics:** Kuickpay (Habib Metro Bank gateway), Cash on Delivery (COD)
- **Notifications & Jobs:** Nodemailer (SMTP), Node-cron (daily refill reminders, weekly reports)
- **Testing:** Jest, Supertest

---

## ✨ Features Implemented To Date

### 1. 📰 Clinical Blog & Content Management Engine
- **Structured Content Schema:** Mongoose model supporting typed blocks (`heading`, `paragraph`, `table`, `list`, `faq`, `callout`, `disclaimer`).
- **AI Content Generator:** Powered by **Google Gemini API** with clinical fallback, generating DRAP-compliant medicine tables, FAQ accordions, and pharmacist alerts.
- **60 Unique Clinical Photography Assets:** 60 dedicated, high-resolution clinical/medical photographs matching every specific health guide (zero repeated images).
- **Automated 1200x630 WebP Banner Engine:** Sharp-powered image optimization for edge-to-edge banners and OpenGraph previews.
- **Storefront Integration (`/blogs` & `/blogs/[slug]`):** Full-width hero photography, structured reader, and automated **Related Categories** and **Related Products** cards with live Add-to-Cart (`+`) and Wishlist (`❤️`) actions.
- **Admin Blog Portal:** Visual block editor, draft management, and one-click AI generation assistant.

### 2. 🔍 Dvago-Style 3-Tier Live Search & Background Blur
- **Instant Interactive Overlay:** Backdrop blur with smooth focus transitions.
- **3-Tier Grouped Results:**
  1. **Matching Searches:** Quick autocomplete keywords.
  2. **Matching Products:** Direct product cards with dosage, price, stock, and quick-action buttons (`+` Add to Cart, `❤️` Wishlist).
  3. **Matching Categories:** Instant category badges linking to catalog filters.

### 3. 📱 Dynamic Hero Section & 3D Interactive Smartphone Mockup
- **Vibrant Dual-Card Layout:** Warm Medikart amber branding with trust badges (*Fast Delivery*, *100% Genuine*, *Safe Packing*).
- **Proportional Smartphone Mockup:** Scaled mockup displaying 6 core clinical category photo tiles, interactive city switcher (`Lahore Hub`, etc.), and prescription upload action.
- **Balanced Floating Badges:** Perfectly anchored badges hovering cleanly outside the bezel without overlapping the in-app screen.

### 4. 🏥 Multi-Vendor Pharmacy & Commission Tracking
- **Pharmacy Onboarding & Role Management:** Dedicated pharmacy portals with active status toggling and inventory controls.
- **Superadmin Commission Audit:** Real-time dashboard showing total Medikart commissions earned, pharmacy breakdown, and date-range filtering.

### 5. 💊 Narcotics & Prescription Safety Compliance
- **DRAP & Narcotics Gating:** Prescription mandatory for restricted drugs; automated blocking of card payment for narcotics carts (COD only).
- **Prescription Verification Workflow:** Admin review drawer to approve, reject, or price instant prescription uploads.

### 6. ⏰ Refill Reminders & Scheduled Cron Jobs
- **Daily Cron:** Automated prescription refill reminders for chronic medication patients.
- **Weekly Report:** Automated performance and sales spreadsheet dispatched via email.

---

## 📁 Repository Structure

```
Medikart/
├── apps/
│   ├── admin/               # React 18 + Vite Admin Dashboard (SPA)
│   │   └── src/components/  # Overview, Products, Orders, Pharmacies, Blogs, Settings
│   └── web/                 # Next.js 14 Customer Storefront (SSR/SSG)
│       ├── app/             # App Router pages (/blogs, /products, /cart, /checkout)
│       ├── components/      # OfficialHeroSection, DvagoSearchBar, ProductCard, Header
│       ├── data/            # blogsData.js (60 curated clinical datasets)
│       └── public/images/   # 60 1200x630 unique clinical photography assets
├── server/
│   ├── src/
│   │   ├── config/          # db.js, redisClient.js, geminiClient.js
│   │   ├── middleware/      # auth.js, requireSuperAdmin.js, rateLimiter.js
│   │   ├── modules/
│   │   │   ├── admin-users/ # JWT auth, 2FA, password reset
│   │   │   ├── blogs/       # Blog model, AI service, thumbnail generator, controller
│   │   │   ├── commissions/ # Pharmacy commission ledger & superadmin analytics
│   │   │   ├── pharmacies/  # Multi-vendor pharmacy accounts
│   │   │   ├── products/    # Product CRUD, narcotics audit, bulk Excel import
│   │   │   ├── orders/      # Standard, Instant, Narcotics, and Cancellations
│   │   │   └── chatbot/     # Groq AI medical assistant
│   │   └── jobs/            # Refill reminders & weekly report cron schedulers
│   ├── scripts/             # updateAll60BlogPhotos.js, seedAdmin.js, importProducts.js
│   └── tests/
│       ├── unit/            # 24 Jest unit test suites (incl. blogs.test.js)
│       └── integration/     # medikartWorkflows.test.js (12 core workflows)
└── docs/                    # Architecture, design system, and PRD specifications
```

---

## 🧪 Testing & Verification

### Run Unit Tests (Server):
```bash
cd server
npm test
```

### Run Blog System Unit Tests:
```bash
cd server
npx jest tests/unit/blogs.test.js
```

### Run Core Workflows Integration Tests:
```bash
cd server
npx jest tests/integration/medikartWorkflows.test.js --forceExit
```

### Build Verification:
```bash
# Build Next.js Storefront
cd apps/web && npm run build

# Build Admin Portal
cd apps/admin && npm run build
```

---

## ⚡ Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd server     && npm install
cd apps/admin && npm install
cd apps/web   && npm install
```

### 2. Configure `.env`
Ensure `server/.env`, `apps/admin/.env`, and `apps/web/.env` contain required keys (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GROQ_API_KEY`).

### 3. Run Development Servers
```bash
# Terminal 1: Backend API (Port 5000)
cd server && npm run dev

# Terminal 2: Admin Dashboard (Port 5173)
cd apps/admin && npm run dev

# Terminal 3: Storefront (Port 3000)
cd apps/web && npm run dev
```

---

## 📝 License
Proprietary — Developed for Medikart Pakistan.
