# Cornucopia — Project Context

**Read this at the start of every session involving this project.**
**Last updated: 2026-03-20**

---

## What It Is

Cornucopia is a local food marketplace connecting small-scale farmers and producers (sellers) with local consumers (buyers).

- **Live site:** https://www.cornucopialocal.com
- **Codebase:** `/home/tyler/Desktop/Cornucopia`
- **Stack:** Next.js 15, TypeScript, Prisma, Supabase (PostgreSQL + Auth), Tailwind, Vercel
- **Status:** Pre-launch — first real producers being onboarded

---

## Who Tyler Is

- Owner and sole developer (using AI assistance)
- Telegram: 876179490
- Email: tylerlnewberry@gmail.com
- Google Voice: (775) 525-0128
- Timezone: America/Los_Angeles (PDT)
- Supabase Auth ID: `3449876d-d4b7-4707-980d-d965f1f00230`
- Site role: ADMIN, username "tyler"

---

## Key Infrastructure

| Service | Details |
|---------|---------|
| **Supabase (prod)** | `swhinhgrtcowjmpstozh` |
| **Supabase (dev)** | `xvbuqpckrjutzcnjlsvj` |
| **Supabase token** | `sbp_ca7f4875587411cddfdd6c6c66a026c0d7535d2c` |
| **Vercel** | Deploy via `vercel --prod` from codebase dir |
| **Cloudflare DNS** | cornucopialocal.com |
| **Stripe** | Test mode — keys in `.env.local` |
| **Resend** | `re_dPsHRpow_EbTX5uiaBUdwt6WiTiRiY1M2` |
| **QStash** | Warmup cron `scd_7V743xkkW14hLJDN1oFtr2bDPEyg` every 5min |
| **Google Maps** | APIs enabled, billing active |
| **Google Voice** | (775) 525-0128 → Tyler's personal phone |
| **Support email** | support@cornucopialocal.com → Cloudflare → Tyler's personal |

---

## Dev Environment

```bash
# Start dev server
cd /home/tyler/Desktop/Cornucopia && npm run dev > /tmp/nextdev.log 2>&1 &

# Deploy
cd /home/tyler/Desktop/Cornucopia && vercel --prod

# Push schema to prod DB
cd /home/tyler/Desktop/Cornucopia && npx prisma db push

# Wake screen (Wayland)
sudo -u tyler WAYLAND_DISPLAY=wayland-0 XDG_RUNTIME_DIR=/run/user/1000 qdbus org.kde.screensaver /ScreenSaver SimulateUserActivity
```

Elevated mode: `/elevated full` in Telegram session
Sudo: passwordless via `/etc/sudoers.d/tyler-nopasswd`

---

## ⚠️ LAYOUT RULE — CRITICAL

**Every flex child needs `min-w-0` or it will overflow on mobile.**

```tsx
<div className="flex-1 min-w-0 overflow-x-hidden w-full">   // dashboard clients
<main className="flex-1 min-w-0 px-3 overflow-x-hidden">    // main elements
```

This has been the #1 recurring bug. Always check new pages.

---

## Navigation Architecture

### Bottom Nav (4 tabs, mobile only)
| Tab | Consumer | Producer |
|-----|---------|---------|
| Home | Home feed | Home feed |
| Markets | Explore map | Explore map |
| Account | Profile/orders/saved/sign out | Profile/orders/saved/sign out |
| Sell → | `/onboarding/producer` CTA | `/dashboard` |

### Account Page (`/account`)
Consumer world: profile, My Orders, Saved Items, "Start Selling" CTA, Sign Out

### Dashboard (`/dashboard`)
Producer world ONLY. Single scrollable page:
- Greeting ("Good morning, Tyler")
- Stripe warning (if not connected)
- Per-stand section: status toggle + inline products with [-]/[+] inventory
- Delivery zones with inline products
- Orders (pending count)
- Events (upcoming)

Dashboard has its own mobile top bar: "≡ Overview ← App"

### Dashboard sub-pages (detailed management)
- `/dashboard/products` — full product list/edit
- `/dashboard/market-stand` — stand inventory management
- `/dashboard/delivery-zones` — delivery zone config
- `/dashboard/orders` — full order history
- `/dashboard/analytics` — analytics

---

## Business Model

- **Sellers (producers):** Farmers, ranchers, artisans
- **Buyers (consumers):** Local community members
- **Platform fee:** 5% of subtotal (min $0.50)
- **Payments:** Stripe Connect — sellers need connected accounts
- **Approval required:** All products and stands need admin (Tyler) review
- **No dropshipping:** Tyler manually reviews for local authenticity

---

## Core Data Model (Quick Reference)

### Three inventory sources
1. `Product.inventory` — legacy fallback
2. `ProductStandListing.customInventory` — per-stand (primary for display)
3. `ProductDeliveryListing.inventory` — per-day-per-zone delivery

### Product must have `marketStandId` set for geo search

### Status flow: PENDING → APPROVED (admin required)

### Stand open/close
- `MarketStand.isOpen` — manual toggle, takes priority
- `MarketStand.hours` — weekly schedule, fallback
- Auto-closes past scheduled hours (lazy eval on page load)
- No hours set → open indefinitely

---

## Features Built (as of 2026-03-20)

### Consumer Experience
- Home feed: geo-sorted mixed products/stands/events/delivery zones
- Expandable tiles: tap "X products ▾" to see product hamburger rows
- Search by zip: products + stands + events + delivery-eligible products
- Product page: "Where to get it" (zip proximity, stand rows, delivery rows, event rows in blue)
- Market stand page: hamburger product rows, back button
- Delivery zone page `/delivery-zone/[id]`: product hamburger rows
- Explore map: viewport-based filtering, green FAB

### Producer Tools
- **Onboarding wizard** `/onboarding/producer` — 4-step guided
- **Dashboard** `/dashboard` — single page producer portal
  - Stand status: "Tap to Open"/"Open Now" pill + immediate toggle
  - Inline product inventory: [-] [N] [+] per product, saves immediately
  - Show 3 products / expand for more
  - Delivery zones with same inline product controls
  - Add product / Create new product buttons
- **QR Stand Portal** `/stand-portal/[id]` — market day mode (open/close, cash/card)
- **Market stand form** — map picker (GPS + address search)
- **Hours** — optional, note directing to dashboard toggle

### Admin Tools
- `/admin/products` — pending review cards, rejection emails with Resend

### Infrastructure
- PWA service worker v5
- QStash warmup cron every 5 min
- Google Maps APIs with billing

---

## Stand Portal vs Dashboard (Design Decision)

**Dashboard** = management mode (at home)
- Bulk inventory editing
- Stand configuration
- Product management

**QR Stand Portal** = market day mode (in person)
- Open/close toggle (primary)
- Live product list with cash/card purchase
- Quick inventory updates
- No product photos needed

---

## How to Work on This Project

### Small fixes
Edit, commit, `vercel --prod`

### Features
```bash
cat > /tmp/task.md << 'TASK'
[spec here]
TASK
cd /home/tyler/Desktop/Cornucopia && claude --permission-mode bypassPermissions --print "$(cat /tmp/task.md)" 2>&1 &
```

### Task spec must include
1. Files to read first
2. Files NOT to modify
3. Existing actions/components to reuse
4. `npx tsc --noEmit` before finishing
5. `openclaw system event --text "Done: X" --mode now` at end

### QA checklist
- Mobile screenshots at 390px with Playwright
- Check for overflow (min-w-0 rule)
- TypeScript compiles clean
- Test on real device when possible

---

## Common Gotchas

- **min-w-0:** Every flex child needs it or mobile overflows
- **formatPrice:** Already divides by 100 — don't divide again before calling
- **Price stored as cents:** $4.00 = 400 in DB. Display: `(price/100).toFixed(2)`
- **marketStandId on Product:** Must be set for geo search
- **Supabase Auth ≠ User table:** Wiping User table doesn't wipe auth users
- **Tailwind JIT:** New utility classes → add to globals.css
- **.next cache:** `rm -rf .next` if MODULE_NOT_FOUND errors
- **Vercel cron:** Hobby plan = daily only. Use QStash instead
- **elevated:true on exec:** Kills long processes. Use background mode

---

## Current Priorities

1. **Test inline inventory controls** — verify [-]/[+] works on dashboard
2. **First real producer onboarded** — platform is ready
3. **Logo** — waiting on designer (horizontal lockup + white SVG)
4. **Gmail send-as** — Cloudflare routing done, sending not set up
5. **Global back button** — discussed, not built yet (in main header or content)
6. **Delivery zone on dashboard** — needs "add products" flow + upcoming orders

## Roadmap (see ROADMAP.md in repo)
- Cross-stand product listing (schema ready, no UI)
- Stand check-in twice daily
- Customer inventory self-reporting via QR
- Farm profile in search
- Events in "Where to get it" (blue rows — built, needs event-product linking)
