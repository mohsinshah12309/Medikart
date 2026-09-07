# 🏥 Medikart — Complete Design System & UI/UX Specification

> **Version:** 2.0 — Premium White & Golden Yellow  
> **Platform:** Next.js 14 Storefront + Vite/React Admin Dashboard + Express Backend  
> **Design Philosophy:** *"Clinical Authority with Warm Human Care"*

---

## Table of Contents

1. [Brand Identity & Philosophy](#1-brand-identity--philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Iconography](#4-iconography)
5. [Layout & Grid System](#5-layout--grid-system)
6. [Component Library — Storefront](#6-component-library--storefront)
7. [Component Library — Admin Panel](#7-component-library--admin-panel)
8. [Micro-Interactions & Motion Design](#8-micro-interactions--motion-design)
9. [Mobile-First & Responsive Strategy](#9-mobile-first--responsive-strategy)
10. [3D & Interactive Elements](#10-3d--interactive-elements)
11. [Accessibility (WCAG 2.2 AA/AAA)](#11-accessibility-wcag-22-aaaaa)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Brand Identity & Philosophy

### Brand Promise
Medikart is Pakistan's premium digital pharmacy — projecting **certified pharmaceutical trust** while making the experience of ordering medicine **comforting, fast, and stress-free**.

### Design Pillars

| Pillar | Principle | Expression |
|:---|:---|:---|
| **🔬 Clinical Authority** | Licensed, regulated, trustworthy | Deep slate text, regulatory seals, clean whitespace, structured layouts |
| **☀️ Warm Human Care** | Approachable, optimistic, healing | Golden yellow accents, soft gradients, friendly typography, smooth animations |
| **⚡ Effortless Speed** | Fast discovery, minimal friction | Prominent search, instant filters, smart autocomplete, 1-tap reorder |
| **🛡️ Safety First** | Narcotics compliance, Rx gating | Clear prescription badges, verification flows, dosage clarity |

### Brand Personality
- **Voice:** Professional yet warm. Like a trusted family pharmacist who greets you by name.
- **Tone:** Reassuring, clear, never clinical-cold. Uses plain language over medical jargon in UI copy.
- **Visual Feel:** Clean medical white spaces energized by warm golden sunlight accents — like a modern pharmacy bathed in morning light.

### Logo System (Historical v2.0)
The Medikart logo was initially prototyped as a procedural CSS capsule:
- **Top Half:** Vivid yellow gradient (`from-yellow-300 to-yellow-500`) with white specular shine
- **Bottom Half:** Deep slate gradient (`from-slate-700 to-slate-900`) with white shine
- **Wordmark:** "Medikart" in slate-900, punctuated with an animated yellow dot (`.`)

---

## 1.1 Official Brand Identity & Canonical Tokens (2026 Master Revision)

> [!IMPORTANT]
> **Superseding Specification:** This section defines the official, client-approved brand identity extracted directly from master vector assets and marketing compositions (`media_1788806774980.jpg`, `media_1788806774988.jpg`, and `media_1788806774974.jpg`). It supersedes earlier provisional tokens while preserving historical references.

### 1. Master Logo Anatomy
The official Medikart logo is composed of three harmonious elements:
1. **Dynamic Shopping Cart Icon**:
   - High-velocity shopping cart moving swiftly to the right, trailed by three rounded motion streaks.
   - **Glossy Medical Capsule**: An angled white and golden-yellow capsule resting inside the basket, with subtle specular highlight.
   - **Certified Medical Cross**: A bold white embossed cross (`+`) centered on the front face of the cart.
   - **Cart Wheels**: Two golden amber circular wheels (`#F59E0B` to `#FBBF24`).
2. **Rounded Wordmark**:
   - Lowercase bold, friendly sans-serif typography (`medikart`).
   - **Leaf Accent**: The dot of the letter `i` is replaced by an organic, upward-tilted green leaf (`#10B981`), symbolizing natural wellness, vitality, and purity.
3. **Official Tagline**:
   - Primary: `"Medicines. Delivered Fast."` (Storefront Nav, Admin Shell, Social Mockups)
   - Localized / Hero Variant: `"Medicines. Nearest to you."` (Surfacing immediate proximity and local pharmacy dispatch)

### 2. Canonical Color Tokens

| Token Name | Hex / CSS Value | Description & WCAG Contrast |
|:---|:---|:---|
| `--color-brand-gradient` | `linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #FACC15 100%)` | Primary interactive gradient for CTA buttons, cart highlights, active indicators |
| `--color-brand-amber` | `#F59E0B` | Deep warm amber base (4.5:1+ contrast on cream) |
| `--color-brand-gold` | `#FBBF24` | Vivid golden yellow center tone |
| `--color-brand-yellow` | `#FACC15` | Bright warm sunlight accent |
| `--color-brand-bg` | `#FAF8F5` | Warm cream/off-white page canvas (eliminates harsh clinical blue-gray glare) |
| `--color-brand-surface` | `#FFFFFF` | Elevated cards, dialogs, drawers, dropdowns |
| `--color-brand-border` | `#F3EFE6` | Soft warm border separating cards from cream canvas |
| `--color-brand-border-amber`| `#FEF3C7` | Amber-tinted active/featured card border |
| `--color-brand-badge-bg` | `#FEF9C3` | Soft pastel yellow circle fill for trust badges and category icon backdrops |
| `--color-brand-navy` | `#1E293B` | Deep Navy Charcoal primary typography (**15.6:1 AAA contrast** on canvas) |
| `--color-brand-slate` | `#475569` | Secondary descriptive text (**7.2:1 AAA contrast**) |
| `--color-brand-muted` | `#64748b` | Tertiary metadata, placeholders, inactive tabs (**4.6:1 AA contrast**) |
| `--color-brand-green` | `#10B981` | Leaf green accent on "i", DRAP verified badges, stock confirmations |
| `--color-brand-script` | `#D97706` | Warm honey-amber handwritten script annotations |

### 3. Typography Hierarchy & Pairings
- **Headings**: `Plus Jakarta Sans` (`font-extrabold`, tracking-tight, `#1E293B`)
- **Body & UI**: `Inter` / `system-ui` (400 regular, 500 medium, 600 semi-bold, `#475569`)
- **Editorial Script Annotations**: `Caveat` (`font-semibold`, 22px–28px, italic feel, `#D97706`)
  - `"Same medicines. Faster delivery."` (Hero right annotation)
  - `"Trusted pharmacies. Real people. ♡"` (Category strip annotation)
  - `"Health made easier. ♡"` (Social highlights annotation)

### 4. Corner Radius & Elevation Tokens
- **Pills & Buttons**: `border-radius: 9999px` (`rounded-full`) — used for all primary CTAs, city selectors, and status chips.
- **Cards & Surfaces**: `border-radius: 20px` to `24px` (`rounded-2xl` / `rounded-3xl`) — generous organic rounding.
- **Amber Glow Shadow**: `box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35)` — applied to primary CTA buttons on hover.
- **Warm Card Shadow**: `box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)`

### 5. Four Core Trust Badges
Presented as soft cream/yellow circular pills with icons and bold labels:
1. ⚡ **Fast Delivery**: Rapid order dispatch and hyper-local rider routing.
2. 📍 **Nearest Pharmacies**: Connected directly to licensed local pharmacies in your city.
3. 🛡️ **Trusted & Genuine**: 100% authentic medicines sourced from licensed distributors.
4. ❤️ **Better Health**: Dedicated patient wellness and pharmacist guidance.

---

## 2. Color System

### Why Yellow?
Yellow radiates optimism, warmth, vital energy, and wellness. Leading pharmacy innovators like **GoodRx** and **Capsule** broke the cold clinical "hospital blue" tradition with warm, uplifting tones. For Medikart, yellow symbolizes the dawn of better health.

> [!IMPORTANT]
> **The Cardinal Accessibility Rule:** NEVER use yellow text on white, and NEVER use white text on yellow. Both fail WCAG contrast standards catastrophically. Always pair yellow backgrounds with dark charcoal (`#0f172a`) text.

### Primary Brand Palette

| Role | Name | Hex | Swatch | Usage |
|:---|:---|:---|:---|:---|
| **Page Canvas** | Clean Alabaster | `#f8fafc` | 🟦 | Root background for all pages — subtle cool-gray tint separating sections from pure white cards |
| **Surface / Cards** | Pure Medical White | `#ffffff` | ⬜ | Cards, modals, inputs, table rows, elevated panels |
| **Primary CTA** | Vivid Golden Sun | `#eab308` | 🟡 | Primary buttons, active tabs, highlights, logo accent, rating stars |
| **Primary Hover** | Deep Amber | `#ca8a04` | 🟠 | Hover state on all primary interactive elements |
| **Primary Pressed** | Burnt Amber | `#a16207` | 🟤 | Active/pressed state feedback |
| **Primary Light Tint** | Morning Sunlight | `#fef9c3` | 🌕 | Badge backgrounds, featured card highlights, active row tints, banner fills |
| **Primary Ultra-Light** | Warm Cream | `#fefce8` | 🌤️ | Subtle section backgrounds, hover row fills, tooltip backgrounds |
| **Primary Glow** | Amber Halo | `rgba(234,179,8,0.45)` | ✨ | Focus rings, card hover glow halos, pulse animations |

### Text Hierarchy

| Role | Name | Hex | Contrast on White | Usage |
|:---|:---|:---|:---|:---|
| **Text Primary** | Deep Midnight Slate | `#0f172a` | **17.85:1** (AAA ✅) | Headlines, body text, button labels on yellow |
| **Text Secondary** | Cool Slate | `#475569` | **7.58:1** (AAA ✅) | Subtitles, dosages, field labels, metadata |
| **Text Muted** | Slate Gray | `#64748b` | **4.76:1** (AA ✅) | Timestamps, SKUs, placeholders, tertiary info |

### Structural Neutrals

| Role | Hex | Usage |
|:---|:---|:---|
| **Border Subtle** | `#e2e8f0` | Card borders, dividers, input borders (resting) |
| **Border Focus** | `#eab308` | Input focus rings, active card outlines |
| **Background Hover** | `#f1f5f9` | Table row hover, sidebar item hover |
| **Scrollbar Track** | `#f1f5f9` | Custom scrollbar track |
| **Scrollbar Thumb** | `#cbd5e1` → `#eab308` on hover | Scrollbar thumb with yellow hover accent |

### Semantic & Clinical Accents

| Role | Name | Background | Text/Icon | Usage |
|:---|:---|:---|:---|:---|
| **Success / In Stock** | Clinical Emerald | `#dcfce7` | `#166534` | "In Stock", "Verified", "Order Confirmed" badges |
| **Prescription / Rx** | Narcotics Amber | `#fef3c7` | `#92400e` | "Rx Required", "Prescription Needed" badges |
| **Error / Danger** | Alert Ruby | `#fee2e2` | `#991b1b` | Form errors, "Expired", "Out of Stock", cancellation |
| **Info / Authority** | Medical Blue | `#dbeafe` | `#1e40af` | Doctor badges, license seals, regulatory notices |
| **WhatsApp** | Brand Green | — | `#25D366` | Floating WhatsApp CTA button |
| **Destructive Action** | Vivid Red | — | `#dc2626` / `#ef4444` | Delete buttons, cancel order CTAs |

### Gradient Compositions

```css
/* Hero Banner — Warm sunrise feel */
background: linear-gradient(135deg, #ffffff 0%, rgba(254,249,195,0.4) 50%, rgba(254,243,199,0.5) 100%);

/* Primary CTA Button — Golden depth */
background: linear-gradient(135deg, #facc15 0%, #eab308 100%);

/* Card Hover Glow — Ambient warmth */
box-shadow: 0 0 0 1px rgba(234,179,8,0.15), 0 8px 25px -5px rgba(234,179,8,0.12);

/* Glass Panel — Frosted medical white */
background: rgba(255, 255, 255, 0.88);
backdrop-filter: blur(14px);
border: 1px solid rgba(226, 232, 240, 0.85);

/* Credit Card Front — Premium golden foil */
background: linear-gradient(135deg, #f59e0b, #facc15, #fde047);
```

---

## 3. Typography

### Philosophy
Pharmacy sites demand **instant legibility**. Users may be unwell, stressed, or elderly. Typefaces must feature open apertures, distinct letterforms (especially `1` vs `l` vs `I`, and `0` vs `O`), and robust number sets for dosage figures.

### Font Stack

| Role | Font | Weights | Fallback Stack |
|:---|:---|:---|:---|
| **Headings** | **Plus Jakarta Sans** | 600 SemiBold, 700 Bold | `system-ui, -apple-system, sans-serif` |
| **Body & UI** | **Inter** | 400 Regular, 500 Medium | `ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif` |
| **Monospace** | **JetBrains Mono** | 400 Regular, 500 Medium | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |

> [!TIP]
> Enable OpenType features for Inter: `font-feature-settings: "cv02", "cv03", "cv04", "cv11"` — this activates contextual alternates optimized for UI readability and distinct numeral rendering.

### Type Scale

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|:---|:---|:---|:---|:---|:---|
| **Display** | `2.25rem` (36px) | Bold 700 | 1.2 | `-0.025em` | Hero headlines |
| **H1** | `1.875rem` (30px) | Bold 700 | 1.3 | `-0.02em` | Page titles |
| **H2** | `1.5rem` (24px) | SemiBold 600 | 1.35 | `-0.015em` | Section headers |
| **H3** | `1.25rem` (20px) | SemiBold 600 | 1.4 | `-0.01em` | Card titles, modal headers |
| **Body Large** | `1rem` (16px) | Regular 400 | 1.6 | `0` | Primary body copy |
| **Body** | `0.875rem` (14px) | Regular 400 | 1.5 | `0` | Secondary content, descriptions |
| **Caption** | `0.75rem` (12px) | Medium 500 | 1.4 | `0.01em` | Badges, timestamps, dosage labels |
| **Overline** | `0.625rem` (10px) | SemiBold 600 | 1.2 | `0.08em` | Uppercase category tags, section labels |

### Medicine-Specific Typography Rules

- **Drug Names:** Always render brand name in **SemiBold** and generic/salt name in *italic Regular* muted slate
- **Dosage Strength:** Display in **Medium weight**, muted slate (`#475569`), directly under brand title — e.g., `Paracetamol 500mg`
- **Pricing:** Current price in **Bold**, PKR symbol in Regular, struck-through MRP in muted with `line-through`
- **SKU Codes:** Always `font-mono` in muted slate — e.g., `MED-PAN-500`
- **Minimum Font Size:** Never below `12px` for any user-visible text. Critical disclaimers minimum `12px`.

---

## 4. Iconography

### Strategy: Unicode Emoji-First + Inline SVG Accents

Medikart uses a **zero-dependency icon system** — no external icon library bundles required.

| Layer | Technology | Examples | When to Use |
|:---|:---|:---|:---|
| **Primary** | Unicode Emoji | 🛒 💊 📦 🔍 ⚙️ 🏥 🩺 📋 💬 🎉 | Navigation, section headers, status labels, quick visual cues |
| **Structural** | Inline SVG | WhatsApp logo, EMV chip, contactless waves | Brand-specific icons, payment visuals, complex shapes |
| **Decorative** | CSS Shapes | Capsule pill, badge circles, progress dots | Logo, loading states, status indicators |

### Key Icon Mappings

| Context | Icon | Usage Location |
|:---|:---|:---|
| Cart | 🛒 | Navbar, empty cart state, cart badge |
| Search | 🔍 | Search bar, filter triggers |
| Products | 💊 | Admin nav, product cards |
| Orders | 📦 | Admin nav, order tracking |
| Prescription | 🩺 | Rx badges, narcotics alerts |
| Categories | 📁 | Admin nav, sidebar |
| Settings | ⚙️ | Admin nav |
| WhatsApp | SVG Logo | Floating CTA, order confirmation |
| Celebration | 🎉 ✨ | Order confirmed overlay |
| Warning | ⚠️ | Dosage alerts, narcotics warnings |
| AI Assistant | 🤖 | Chatbot header |
| Location | 📍 | City selection, delivery info |
| Clock | 🕒 | Operating hours, OTP countdown |

---

## 5. Layout & Grid System

### Page Shell Structure

```
┌─────────────────────────────────────────────────────────┐
│  HEADER — Sticky, glass-blur, white/90 backdrop         │
│  ┌─ Logo ─┬─ Nav Links ─┬─ Search ─┬─ Cart Icon ─┐     │
│  └────────┴─────────────┴──────────┴─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  MAIN CONTENT — bg-[#f8fafc] with tech-grid overlay     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  White cards float above the alabaster canvas    │   │
│  │  with subtle borders and hover glow effects     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  FOOTER — Clean white, nav links, compliance badges     │
├─────────────────────────────────────────────────────────┤
│  FLOATING OVERLAYS:                                     │
│  └─ Bottom-Left: WhatsApp FAB (#25D366)                 │
│  └─ Bottom-Right: AI Chatbot FAB (Yellow)               │
└─────────────────────────────────────────────────────────┘
```

### Spacing Scale (8px Base Unit)

| Token | Value | Usage |
|:---|:---|:---|
| `space-1` | `4px` | Tight inline gaps, badge padding |
| `space-2` | `8px` | Icon-to-text gaps, compact padding |
| `space-3` | `12px` | Form field internal padding |
| `space-4` | `16px` | Card padding, standard gaps |
| `space-5` | `20px` | Section internal padding |
| `space-6` | `24px` | Card-to-card gaps, section margins |
| `space-8` | `32px` | Major section spacing |
| `space-10` | `40px` | Page-level vertical rhythm |
| `space-12` | `48px` | Hero section padding |
| `space-16` | `64px` | Between major page sections |

### Border Radius Scale

| Token | Value | Usage |
|:---|:---|:---|
| `rounded-sm` | `6px` | Badges, small tags, inline pills |
| `rounded-md` | `8px` | Input fields, buttons |
| `rounded-lg` | `12px` | Cards, modals, dropdowns |
| `rounded-xl` | `16px` | Featured cards, hero sections |
| `rounded-2xl` | `20px` | Hero banner, promotional cards |
| `rounded-3xl` | `24px` | Main hero container |
| `rounded-full` | `9999px` | Pill badges, avatar circles, FABs |

### Shadow Scale

```css
/* Resting card */
shadow-sm: 0 1px 2px rgba(0,0,0,0.04);

/* Hovered card — warm amber lift */
shadow-card-hover: 0 0 0 1px rgba(234,179,8,0.15),
                   0 8px 25px -5px rgba(234,179,8,0.12);

/* Modal / Elevated panel */
shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.08),
           0 8px 10px -6px rgba(0,0,0,0.04);

/* Floating FAB buttons */
shadow-fab: 0 4px 14px rgba(0,0,0,0.15);

/* Primary button glow */
shadow-yellow: 0 4px 14px rgba(234,179,8,0.35);
```

---

## 6. Component Library — Storefront

### 6.1 Header / Navigation Bar
- **Container:** `sticky top-0 z-50`, `bg-white/90 backdrop-blur-md`, `border-b border-slate-200`
- **Logo:** Interactive CSS capsule with float animation + "Medikart" wordmark
- **Nav Links:** `Home`, `Instant Order`, `About`, `Contact` — each with animated yellow underline bar on hover (2px height, scales from center on `hover`)
- **Cart Icon:** 🛒 with floating yellow badge counter (pulsing `animate-pulse-glow` when items are added)

### 6.2 Hero Banner
- **Container:** `rounded-3xl`, warm sunrise gradient, `border border-slate-200`
- **Trust Badge:** Pulsing amber dot + "Licensed Pharmacy Partner" in uppercase caption
- **Headline:** Display size, "Your Gateway to Health & Wellness"
- **Dual CTAs:**
  - Primary: "Upload Prescription" — golden gradient button with upload icon
  - Secondary: "Browse Catalog" — white outline button with arrow

### 6.3 Product Card (with 3D Tilt)
```
┌──────────────────────────┐
│  ┌─────────────────────┐ │ ← TiltCard3D wrapper (perspective, rotateX/Y on cursor)
│  │   Product Image      │ │
│  │  ┌──────┐  ┌──────┐  │ │ ← Overlay badges (top corners)
│  │  │-15%  │  │Rx ONLY│  │ │
│  │  │ OFF  │  │      │  │ │
│  │  └──────┘  └──────┘  │ │
│  └─────────────────────┘ │
│                          │
│  PARACETAMOL 500MG       │ ← Overline: generic salt, uppercase, muted
│  Panadol Advance         │ ← Title: SemiBold, 2-line clamp
│  Strip of 24 Tablets     │ ← Subtitle: Regular, muted
│                          │
│  PKR 850  ̶P̶K̶R̶ ̶1̶,̶1̶0̶0̶     │ ← Pricing: Bold current + struck MRP
│  ┌─────────┐             │
│  │Save 22% │             │ ← Honey yellow savings pill badge
│  └─────────┘             │
│                          │
│  ┌──────────────────────┐│
│  │   🛒 View Details    ││ ← Yellow CTA button (full-width)
│  └──────────────────────┘│
└──────────────────────────┘
```

**Badge Variants:**
- **Discount:** Red background `#fee2e2`, text `#991b1b` — "-15% OFF"
- **Narcotics/Rx:** Amber background `#fef3c7`, text `#92400e` — "🩺 Rx ONLY"
- **Out of Stock:** Slate disabled state — button becomes "Out of Stock" in gray
- **3D Available:** "🌐 3D View" badge appears on hover

### 6.4 Category Sidebar
- **Desktop:** Sticky left panel, white card, category list with Rx indicator tags
- **Mobile:** Full slide-out drawer triggered by hamburger button
- **Active State:** Yellow left border accent + `bg-yellow-50` tint
- **Search:** Inline filter input (visible when >8 categories)

### 6.5 Cart Page
- **Empty State:** Floating 🛒 emoji with gentle bob animation + "Your cart is waiting" + "Start Shopping" yellow CTA
- **Narcotics Alert:** Amber banner — "Items marked 🩺 require a valid prescription upload at checkout"
- **Item Rows:** Thumbnail (64px) + title + dosage + quantity stepper (`-` `[count]` `+`) + line total + remove `✕`
- **Summary Card:** Sticky sidebar with subtotal, delivery charge, total, "Proceed to Checkout" button

### 6.6 Checkout Flow

```
┌─ STEP 1: Customer Details ──────────────────────────┐
│  Full Name, Email, Phone, Delivery Address, City    │
│  (City dropdown with dynamic delivery charges)      │
└─────────────────────────────────────────────────────┘
          ↓
┌─ STEP 2: Prescription Upload (if Rx items) ─────────┐
│  Drag-and-drop zone with camera/file upload         │
│  Supported: JPG, PNG, PDF (no ZIP/archive)          │
│  Preview thumbnail with ✓ validation indicator      │
└─────────────────────────────────────────────────────┘
          ↓
┌─ STEP 3: Payment Method ────────────────────────────┐
│  Toggle: 💵 Cash on Delivery │ 💳 Online Card       │
│  (Card option renders interactive CardFlip3D)       │
└─────────────────────────────────────────────────────┘
          ↓
┌─ STEP 4: OTP Verification ──────────────────────────┐
│  6-digit input, 60-second countdown timer           │
│  "Request OTP" → "Verify & Place Order"             │
└─────────────────────────────────────────────────────┘
          ↓
┌─ ORDER CONFIRMED OVERLAY ───────────────────────────┐
│  🎉 ✨ Celebration animation                        │
│  Animated checkmark ring (green → gold)             │
│  Order Reference ID (copyable, monospace)           │
│  📦 WhatsApp tracking CTA                           │
│  4-step fulfillment pipeline tracker                │
└─────────────────────────────────────────────────────┘
```

### 6.7 Order Confirmation Page
- **Hero:** Celebration badge with confetti particles
- **Order Card:** White elevated card with order reference (monospace, copyable), items summary, payment method, delivery estimate
- **Pipeline Tracker:** 4-step horizontal progress — `1. Placed` → `2. Verification` → `3. Packing` → `4. Dispatched` — active step glows yellow
- **WhatsApp CTA:** Pre-filled message with order details for instant support

### 6.8 About & Contact Pages
- **About:** Hero card + dynamic mission content from backend + 3 trust pillar cards (Authenticity, Logistics, Rx Compliance) + animated metric counters
- **Contact:** 2-column layout — left: pharmacy details, hours (`Monday — Sunday: 12:00 AM — 12:00 PM PKT`), WhatsApp link; right: interactive message form

### 6.9 AI Chatbot Widget
- **Trigger:** Floating yellow FAB at bottom-right with 💬 icon
- **Panel:** Slide-up dialog with header `🤖 Symptom Assistant`, medical disclaimer banner, conversational stream, and input
- **Behavior:** Suggests only safe OTC catalog items; never prescribes

### 6.10 Footer
- **Layout:** Clean white background, 3-column grid
- **Content:** Navigation links, compliance badges ("Cash on Delivery", "Online Payments", "Narcotics Compliance Active"), copyright
- **Trust Seals:** Pharmacy license, HIPAA-compliant data handling, 256-bit SSL encryption

---

## 7. Component Library — Admin Panel

### 7.1 Admin Shell Layout
```
┌──────────────────────────────────────────────────────┐
│ SIDEBAR (240px fixed)     │  HEADER BAR              │
│ ┌──────────────────────┐  │  ┌────────────────────┐  │
│ │ 💊 Medikart. Admin   │  │  │ Welcome, Admin     │  │
│ ├──────────────────────┤  │  │ [Logout]           │  │
│ │ 📊 Overview          │  │  └────────────────────┘  │
│ │ 💊 Products          │  ├──────────────────────────┤
│ │ 📁 Categories        │  │                          │
│ │ 📦 Orders        ←●  │  │  MAIN CONTENT AREA      │
│ │ 📍 Cities            │  │                          │
│ │ ⚙️ Settings          │  │  White cards on          │
│ │ 📋 Activity Logs     │  │  #f8fafc canvas          │
│ │ 💬 Messages          │  │                          │
│ │ 👤 Admin Users       │  │                          │
│ ├──────────────────────┤  │                          │
│ │ v2.0 • Staff Role    │  │                          │
│ └──────────────────────┘  │                          │
└──────────────────────────────────────────────────────┘
```

- **Sidebar:** White background, `border-right: 1px solid #e2e8f0`
- **Active Nav Item:** Yellow left border (`4px #facc15`) + `bg-yellow-50` tint
- **Mobile:** Sidebar collapses into slide-over drawer with backdrop blur
- **Logo:** Micro CSS capsule (13×24px, top yellow / bottom slate) + "Medikart." wordmark

### 7.2 Overview Dashboard
- **KPI Stat Cards:** 4-column grid, each with colored left border accent:
  - Today's Orders: `#eab308` (yellow)
  - Total Products: `#0f172a` (slate)
  - Narcotics Pending: `#ef4444` (red)
  - Instant Pricing Pending: `#854d0e` (amber)

### 7.3 Data Tables
- **Header Row:** `bg-[#f8fafc]`, uppercase `text-xs font-semibold`, slate text
- **Body Rows:** White background, `border-b border-slate-100`
- **Hover State:** `bg-[#fefce8]` (warm cream tint)
- **Badges in Tables:**
  - Narcotic: `bg-[#fef3c7] text-[#92400e]` — "🩺 Narcotic"
  - Prescription: `bg-[#fee2e2] text-[#991b1b]` — "Rx Required"
  - Discount Active: `bg-[#dcfce7] text-[#166534]` — "15% Off"
  - Status Chips: Pending (amber), Confirmed (blue), Delivered (green), Cancelled (red)

### 7.4 Buttons

| Variant | Background | Text | Border | Hover | Usage |
|:---|:---|:---|:---|:---|:---|
| **Primary** | `#facc15` | `#0f172a` | none | `#eab308` | Main actions: Save, Create, Submit |
| **Secondary** | `#f1f5f9` | `#334155` | `#e2e8f0` | `#e2e8f0` bg | Cancel, Close, Back |
| **Danger** | `#dc2626` | `#ffffff` | none | `#b91c1c` | Delete, Cancel Order |
| **Outline** | transparent | `#0f172a` | `#e2e8f0` | `#f8fafc` bg | Secondary actions |
| **Ghost** | transparent | `#64748b` | none | `#f1f5f9` bg | Tertiary actions, icon-only |

### 7.5 Modals
- **Overlay:** `bg-black/50 backdrop-blur-sm`
- **Content:** White card, `rounded-xl`, `max-width: 560px`, `shadow-xl`
- **Header:** Title + `×` close button, `border-b border-slate-100`
- **Footer:** Right-aligned action buttons with `gap-3`

### 7.6 Order Cancellation Modal (Enhanced)
```
┌─────────────────────────────────────────────┐
│ ⚠️ Cancel Order                          ✕ │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ Order #A1B2C3        Status: pending    │ │ ← Red-tinted info card
│ │ Customer: Ali Ahmed                     │ │
│ │ Email: customer@example.com             │ │
│ │ Payment: 💵 Cash on Delivery (pending)  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ✉️ Customer will receive a cancellation │ │ ← Blue info callout
│ │    email with this reason note.         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Quick Reason Presets:                       │
│ [Prescription invalid] [Out of stock]       │ ← Pill-shaped chips
│ [Customer requested] [Address unreachable]  │
│ [Narcotics rejected] [Duplicate order]      │
│                                             │
│ Cancellation Reason / Note to Customer *    │
│ ┌─────────────────────────────────────────┐ │
│ │ Enter clear, polite details...          │ │ ← Required textarea
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│                    [Close] [Confirm Cancel] │
└─────────────────────────────────────────────┘
```

---

## 8. Micro-Interactions & Motion Design

Healthcare micro-interactions must prioritize **calm, clarity, and precision** — never playful distraction.

### Animation Tokens

```css
/* Durations */
--duration-fast:    150ms;   /* Button feedback, badge appearance */
--duration-normal:  250ms;   /* Card transitions, hover effects */
--duration-smooth:  400ms;   /* Page transitions, modal open/close */
--duration-float:   4000ms;  /* Continuous ambient animations */

/* Easings */
--ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);   /* Bouncy entrance */
--ease-smooth:      cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Smooth transition */
--ease-decelerate:  cubic-bezier(0, 0, 0.2, 1);           /* Entering elements */
```

### Key Interactions

| Trigger | Animation | Timing | Details |
|:---|:---|:---|:---|
| **Add to Cart** | Button depresses → checkmark morph → quantity stepper appears | 200ms ease-out | Scale to `0.97`, icon rotates to ✓, then expands to `- 1 +` stepper |
| **Card Hover** | Lift + warm glow | 250ms smooth | `translateY(-2px) scale(1.008)` + amber box-shadow bloom |
| **3D Card Tilt** | Perspective rotation + specular glare | Real-time on cursor | `rotateX/Y` ±8° max + radial gradient glare following cursor position |
| **Prescription Upload** | Golden progress ring → green checkmark | 300ms per step | Pulsing amber ring during upload → clean green ✓ on success |
| **OTP Countdown** | Circular countdown timer | 60s linear | Yellow ring depleting clockwise, number ticking down |
| **Order Confirmed** | Fireworks → checkmark ring → card slide-up | 600ms staggered | Golden particle burst → green ring draw → confirmation card slides in |
| **Logo Float** | Continuous vertical bob | 4s ease-in-out | `translateY(-4px)` infinite, capsule splits on hover |
| **Logo Hover** | Capsule split + crosses | 400ms spring | Rotates 180°, halves separate, `+` crosses float outward |
| **Nav Link Hover** | Yellow underline scales from center | 200ms ease | `scaleX(0) → scaleX(1)` yellow bar, `transform-origin: center` |
| **Scrollbar Hover** | Thumb turns yellow | 150ms | `#cbd5e1` → `#eab308` on scrollbar thumb hover |
| **Form Error** | Gentle horizontal shake | 300ms | 3–4px nudge left-right with inline amber/red helper text |
| **Pulse Glow** | Ambient yellow shadow pulse | 2.5s infinite | `box-shadow` oscillates between `rgba(234,179,8,0.35)` and `0.65` |
| **Fade In Up** | Entry animation | 450ms decelerate | `translateY(12px) opacity(0)` → `translateY(0) opacity(1)` |

---

## 9. Mobile-First & Responsive Strategy

> Over 72% of pharmacy orders in Pakistan originate from mobile devices.

### Breakpoints

| Name | Width | Layout Changes |
|:---|:---|:---|
| **Mobile** | `< 640px` | Single column, bottom nav, full-width cards, drawer menus |
| **Tablet** | `640px – 1023px` | 2-column grids, sidebar collapses to toggle |
| **Desktop** | `≥ 1024px` | Full sidebar, 3-4 column product grids, sticky panels |

### Mobile-Specific Patterns

1. **Sticky Bottom Navigation Bar (Storefront)**
   ```
   ┌──────┬──────┬──────┬──────┬──────┐
   │ 🏠   │ 📁   │ 🩺   │ 📦   │ 🛒   │
   │ Home │ Shop │ Rx   │Track │ Cart │
   └──────┴──────┴──────┴──────┴──────┘
   ```
   - Center "Rx Upload" button uses prominent yellow FAB elevation
   - Active tab: yellow icon + yellow dot indicator

2. **Bottom Sheet Drawers** — Drug facts, dosage guides, and substitute lists open as iOS-style bottom sheets instead of full-page navigations

3. **Touch-Optimized Controls** — Minimum touch target `44px × 44px` for all interactive elements

4. **Admin Mobile Sidebar** — Converts to slide-over drawer with backdrop blur at `< 1024px`

---

## 10. 3D & Interactive Elements

### 10.1 Product 3D Viewer (`Product3DViewer.jsx`)
- **Engine:** Three.js WebGLRenderer
- **Scene:** Chrome pedestal cylinder base (slate-200, `MeshPhysicalMaterial` with 0.5 transmission) + glowing yellow floating torus ring (`0xeab308` with emissive glow) + 3D product box with texture-mapped product images
- **Controls:** Mouse drag/pan rotation, wireframe toggle, auto-rotation toggle
- **Lighting:** Ambient + directional + point lights for pharmaceutical product showcase

### 10.2 TiltCard3D Wrapper (`TiltCard3D.jsx`)
- **Behavior:** Tracks cursor position relative to card center
- **Transform:** `rotateX(±8°) rotateY(±8°) scale3d(1.015, 1.015, 1.015)`
- **Glare:** Radial gradient specular overlay following cursor, simulating light reflection
- **Reset:** Smoothly animates back to flat on mouse leave (300ms spring easing)

### 10.3 CardFlip3D — Interactive Payment Card (`CardFlip3D.jsx`)
- **Front Face:** Golden gradient (`amber-500 → yellow-400 → yellow-300`), EMV chip, contactless icon, formatted card number, cardholder name, expiry
- **Back Face:** Dark slate gradient (`slate-800 → slate-900`), magnetic stripe, signature strip, CVV box
- **Trigger:** Auto-flips 180° on Y-axis when user focuses on CVV input field
- **Perspective:** `1000px`, `transform-style: preserve-3d`

---

## 11. Accessibility (WCAG 2.2 AA/AAA)

### Contrast Compliance Matrix

| Combination | Ratio | Grade | ✅/❌ |
|:---|:---|:---|:---|
| `#0f172a` text on `#ffffff` white | **17.85:1** | AAA | ✅ |
| `#0f172a` text on `#facc15` yellow button | **12.4:1** | AAA | ✅ |
| `#0f172a` text on `#eab308` yellow button | **9.31:1** | AAA | ✅ |
| `#0f172a` text on `#fef9c3` light yellow | **16.2:1** | AAA | ✅ |
| `#475569` text on `#ffffff` white | **7.58:1** | AAA | ✅ |
| `#64748b` text on `#ffffff` white | **4.76:1** | AA | ✅ |
| `#92400e` text on `#fef3c7` amber badge | **7.1:1** | AAA | ✅ |
| `#ffffff` text on `#eab308` yellow | **1.48:1** | FAIL | ❌ NEVER USE |
| `#eab308` text on `#ffffff` white | **1.48:1** | FAIL | ❌ NEVER USE |

### Accessibility Guidelines

1. **Focus States:** Double-ring focus indicator on all interactive elements: `ring-2 ring-amber-500 ring-offset-2`
2. **Keyboard Navigation:** All modals trap focus; Escape key closes; Tab order follows logical reading flow
3. **Screen Reader Labels:** Medical dosages use ARIA labels: `<span aria-label="500 milligrams">500 mg</span>`
4. **Font Scaling:** All layouts use `rem`/`em` units — supports browser font scaling up to 200% without layout breakage
5. **Reduced Motion:** Respect `prefers-reduced-motion: reduce` — disable float, tilt, 3D animations; keep only essential transitions
6. **Color Independence:** Never convey information through color alone — always pair with icons, text labels, or patterns
7. **Non-Text Contrast (SC 1.4.11):** Yellow buttons against white must include a 1px boundary (`#D97706` or shadow) to meet the 3:1 graphical element standard
8. **Touch Targets:** Minimum `44px × 44px` for all buttons, links, and form controls on mobile

---

## 12. Implementation Roadmap

### Phase 1: Typography & Font Loading
- [ ] Install `Plus Jakarta Sans` and `Inter` via `next/font/google`
- [ ] Configure font variables in Tailwind config
- [ ] Apply type scale across all components
- [ ] Enable OpenType features for Inter

### Phase 2: Color Token Migration
- [ ] Audit and consolidate all hardcoded color values
- [ ] Map to design system tokens in `tailwind.config.js` and `index.css`
- [ ] Verify WCAG contrast compliance for every text/background combination

### Phase 3: Component Refinement
- [ ] Standardize all product cards to the spec above
- [ ] Implement consistent badge system (Rx, OTC, Discount, Stock)
- [ ] Unify button variants across storefront and admin
- [ ] Polish modal system with consistent header/body/footer patterns

### Phase 4: Motion & Interaction Polish
- [ ] Implement animation token system (durations, easings)
- [ ] Add `prefers-reduced-motion` media query fallbacks
- [ ] Polish card hover, 3D tilt, and cart add animations
- [ ] Add order confirmed celebration sequence

### Phase 5: Mobile Optimization
- [ ] Implement sticky bottom navigation for storefront mobile
- [ ] Convert admin sidebar to responsive drawer
- [ ] Add bottom sheet drawers for product details on mobile
- [ ] Audit all touch targets for 44px minimum

### Phase 6: Accessibility Audit
- [ ] Run automated WCAG audit (axe-core / Lighthouse)
- [ ] Manual keyboard navigation testing across all flows
- [ ] Screen reader testing (NVDA / VoiceOver) for checkout flow
- [ ] Verify font scaling to 200% across all page layouts

---

> **This design system is a living document.** Update it as Medikart evolves. Every component, color, and interaction should trace back to the core philosophy: *Clinical Authority with Warm Human Care*.
