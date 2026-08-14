# Medikart — Pharmacy E-Commerce & Pharmacy Management System

Medikart is a custom Pharmacy E-Commerce and Pharmacy Management System.

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
