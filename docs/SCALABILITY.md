# Medikart Scalability & Performance Architecture Guide

This document outlines the caching, performance optimization, and single-VPS scaling architecture implemented for Medikart, along with the concrete roadmap for scaling vertically and horizontally as traffic grows.

---

## 1. Executive Summary & Core Guarantees

Medikart is deployed on a **single Hostinger VPS** (Ubuntu Linux, Node.js/Express, MongoDB Atlas, Redis, Next.js storefront, React/Vite admin dashboard), fronted by **Cloudflare CDN/DNS**.

### Strict Architectural Invariants
1. **Stateless Node Application:** No session, cart, or authentication state is stored in Node.js server memory. JWTs authenticate requests, while carts and recurring refills persist in MongoDB/Redis. This allows the backend to scale across multiple CPU cores on the VPS via PM2 cluster mode today, and across multiple VPS instances tomorrow without rewriting application code.
2. **Strict Privacy & Isolation:** Authenticated customer routes (`/api/v1/cart/*`, `/api/v1/wishlist/*`, `/api/v1/customer/*`, `/api/v1/orders/*`, `/api/v1/auth/*`) and admin routes (`/api/v1/admin/*`) explicitly send `Cache-Control: no-store, no-cache, must-revalidate, private` headers. They are never cached by Redis or Cloudflare edge servers, eliminating cross-user data leakage.
3. **Security & Data Integrity Preserved:** All security checks (cryptographic HMAC/JWT verification, Zod input validation, atomic order creation, Redis-backed sliding-window rate limiters, prescription access controls) execute with zero degradation.

---

## 2. Multi-Layer Caching Architecture (Redis & Cloudflare Edge)

Medikart implements a 3-tier caching hierarchy:

```
[ Customer Browser ]
       │
       ▼ (1. Browser Cache & ETags)
[ Cloudflare Edge CDN ]  ─── (2. Edge Cache for Public Catalog & Static Assets)
       │
       ▼ (3. VPS Node.js / PM2 Cluster)
[ Redis Cache Layer ]    ─── (Hot-path In-Memory Cache: 5min-1hr TTL)
       │
       ▼ (Database Fallback)
[ MongoDB Atlas ]
```

### 2.1. Redis Caching Rules & TTLs

| Endpoint | Cache Key Pattern | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| **Product Catalog** (`GET /api/v1/products`) | `cache:storefront:products:search:*:cat:*:cond:*:narcotic:*:page:*:limit:*` | 5 min (300s) | Admin create/update/delete product, narcotic toggle, category edit |
| **Product Detail** (`GET /api/v1/products/:id`) | `cache:storefront:product:{id}` | 5 min (300s) | Admin edit/delete product, narcotic toggle, price update |
| **Category List** (`GET /api/v1/categories`) | `cache:storefront:categories` | 1 hour (3600s) | Admin create/update/delete category |
| **Dynamic Suggestions** (`GET /api/v1/search/suggestions`) | `cache:storefront:suggestions:{query}` | 60s | Product update or search record |
| **Trending Searches** (`GET /api/v1/trending-searches`) | `cache:storefront:trending-searches:limit:*` | 60s | Product update or search record |
| **Cities & Content** (`GET /api/v1/cities`, `GET /api/v1/content`) | `cache:storefront:cities`, `cache:storefront:content` | 5 min - 1 hour | Admin city or content settings update |

### 2.2. Automated Cache Invalidation
When an administrator modifies a product or category in the admin portal:
1. `invalidateProductCache(productId)` deletes the specific product key (`cache:storefront:product:${productId}`) and executes non-blocking chunked scan pattern deletion (`cache:storefront:products:*`, `cache:storefront:suggestions:*`, `cache:storefront:trending-searches:*`).
2. `invalidateCategoryCache()` clears `cache:storefront:categories` and related product listings.
3. Fresh data is instantly reflected on the storefront without waiting for TTL expiry.

### 2.3. Cloudflare Edge Caching Configuration

Cloudflare acts as the edge reverse proxy. Configure Cloudflare **Cache Rules** in the dashboard as follows:

#### Rule 1: Static Assets & Media (Aggressive Cache)
- **Expression:** `(http.request.uri.path contains "/uploads/") or (http.request.uri.path contains "/_next/static/") or (http.request.uri.path contains "/assets/")`
- **Action:**
  - Cache Eligibility: **Eligible for cache**
  - Edge TTL: **7 days to 30 days**
  - Browser TTL: **7 days**

#### Rule 2: Public Read Catalog (Edge Caching)
- **Expression:** `(http.request.uri.path eq "/api/v1/products") or (http.request.uri.path eq "/api/v1/categories") or (http.request.uri.path eq "/api/v1/banners") or (http.request.uri.path eq "/api/v1/conditions") or (http.request.uri.path eq "/api/v1/cities")`
- **Action:**
  - Cache Eligibility: **Eligible for cache**
  - Edge TTL: **Respect origin (5 minutes - 1 hour)**
  - Query String Sorting: **Enabled**

#### Rule 3: Dynamic, Authenticated & Customer Endpoints (Bypass Cache)
- **Expression:** `(http.request.uri.path contains "/api/v1/auth/") or (http.request.uri.path contains "/api/v1/cart") or (http.request.uri.path contains "/api/v1/wishlist") or (http.request.uri.path contains "/api/v1/customer/") or (http.request.uri.path contains "/api/v1/orders") or (http.request.uri.path contains "/api/v1/admin/")`
- **Action:**
  - Cache Eligibility: **Bypass Cache**

---

## 3. Single-VPS Scalability & Process Management

### 3.1. PM2 Cluster Mode Configuration
The Node.js backend uses PM2 cluster mode (`ecosystem.config.js`) to span all available CPU cores on the Hostinger VPS:
- **Clustering:** `instances: "max"` automatically forks a worker per CPU core.
- **Zero-Downtime Reload:** `pm2 reload ecosystem.config.js` reloads workers sequentially with zero dropped connections.
- **Memory Guard:** `max_memory_restart: "500M"` automatically recycles worker processes if memory exceeds 500MB.
- **Log Management:** Centralized log rotation with timestamps and error stream separation.

```bash
# Start backend in cluster mode
pm2 start ecosystem.config.js

# Zero-downtime rolling reload after code updates
pm2 reload ecosystem.config.js --update-env

# View live cluster process status
pm2 status
```

### 3.2. MongoDB Connection Pooling
Connection pooling is optimized in `server/src/config/db.js`:
- `maxPoolSize`: 100 concurrent sockets per worker process (reused across requests).
- `minPoolSize`: 10 pre-warmed connections ready for traffic spikes.
- `socketTimeoutMS`: 45000ms.
- `family`: 4 (IPv4 resolution avoids dual-stack DNS lookup overhead).

### 3.3. Database Indexing Summary
All high-traffic queries and filters are fully backed by compound/single B-tree and text indexes:
- **Products:** Text index `{ name: "text", genericName: "text" }`, compound `{ active: 1, categoryIds: 1, name: 1 }`, compound `{ active: 1, isNarcotic: 1, createdAt: -1 }`.
- **Orders:** Compound `{ "customer.email": 1, createdAt: -1 }`, compound `{ assignedPharmacyId: 1, status: 1, createdAt: -1 }`, compound `{ status: 1, createdAt: -1 }`.
- **Refills:** Compound `{ nextReminderAt: 1, reminderSentAt: 1 }`.
- **Commissions:** Compound `{ pharmacyId: 1, status: 1, createdAt: -1 }`.
- **Cart:** TTL index `{ updatedAt: 1 }` (30 days automatic cleanup of abandoned guest carts).

---

## 4. Empirical Performance Benchmark Results

Tested with concurrency = 20, 100 requests per endpoint:

| Endpoint | Cold (Direct MongoDB) | Warm (Redis Cache Hit) | Speedup | Warm Throughput |
| :--- | :--- | :--- | :--- | :--- |
| **Product Catalog** (`/api/v1/products`) | **1,163.66 ms** | **37.69 ms** (p50: 42.02 ms) | **30.9x faster** | **487.8 req/sec** |
| **Product Detail** (`/api/v1/products/:id`) | **204.08 ms** | **32.07 ms** (p50: 18.17 ms) | **6.4x faster** | **543.5 req/sec** |
| **Category List** (`/api/v1/categories`) | **84.28 ms** | **19.44 ms** (p50: 19.49 ms) | **4.3x faster** | **909.1 req/sec** |
| **Search Suggestions** (`/api/v1/search/suggestions`) | **622.56 ms** | **176.75 ms** (p50: 120.66 ms) | **3.5x faster** | **32.1 req/sec** |

---

## 5. Future Scaling Roadmap (Beyond 1 VPS)

When traffic grows beyond the capacity of a single Hostinger VPS, follow this 2-step scaling roadmap without altering application architecture:

```
[ Step 1: Current State ]
Single Hostinger VPS (4-8 Cores, 16GB RAM)
├── PM2 Cluster Mode (4-8 Node Workers)
├── Local Redis Instance
└── MongoDB Atlas Managed Cluster

       │ (When CPU/RAM reaches 75% sustained load)
       ▼
[ Step 2: Vertical Scaling — Simplest, Zero Code Change ]
Upgrade Hostinger VPS plan (e.g. 16 Cores, 32GB RAM)
└── PM2 cluster automatically expands to 16 workers

       │ (When single-node vertical scaling is maxed)
       ▼
[ Step 3: Horizontal Scaling — Multi-VPS Cluster ]
Cloudflare Load Balancing / Health-Checked DNS
├── VPS Node 1 (App Worker Cluster)
├── VPS Node 2 (App Worker Cluster)
├── Dedicated Redis Server (or AWS ElastiCache / Redis Cloud)
└── MongoDB Atlas Replica Set (M10+ Dedicated Cluster)
```

### Horizontal Scaling Prerequisites (Already Satisfied)
- [x] **No In-Memory Session/Cart State:** Shared Redis & Mongo store all cart and token data.
- [x] **Centralized Database:** MongoDB Atlas handles replica sets, sharding, and failover.
- [x] **Shared Redis Store:** External `REDIS_URL` connects all worker nodes to a single Redis cluster.
- [x] **Stateless JWT Authentication:** Any worker node can verify tokens without sticky sessions.
- [x] **Cloudflare Load Balancing Compatibility:** Health checks on `/health` endpoint report node connectivity.
