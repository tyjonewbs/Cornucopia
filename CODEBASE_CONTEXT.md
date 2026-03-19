# Cornucopia — Project Context

**Read this at the start of every session involving this project.**

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
- His account on the site: ADMIN role, username "tyler"

---

## Key Infrastructure

| Service | Details |
|---------|---------|
| **Supabase (prod)** | Project: `swhinhgrtcowjmpstozh` |
| **Supabase (dev)** | Project: `xvbuqpckrjutzcnjlsvj` |
| **Supabase token** | `sbp_ca7f4875587411cddfdd6c6c66a026c0d7535d2c` |
| **Vercel** | Auto-deploy from `main` branch via `vercel --prod` CLI |
| **Cloudflare DNS** | cornucopialocal.com |
| **Stripe** | Test mode — keys in `.env.local` |
| **Resend** | `re_dPsHRpow_EbTX5uiaBUdwt6WiTiRiY1M2` — rejection emails from support@cornucopialocal.com |
| **QStash** | Warmup cron every 5min — `scd_7V743xkkW14hLJDN1oFtr2bDPEyg` |
| **Upstash Redis** | Caching layer |
| **Google Maps** | APIs enabled, billing active, key in .env.local |
| **Google Voice** | (775) 525-0128 → Tyler's personal phone |
| **Email** | support@cornucopialocal.com → Cloudflare routing → Tyler's personal email |

---

## Dev Environment

```bash
# Start dev server
cd /home/tyler/Desktop/Cornucopia && npm run dev > /tmp/nextdev.log 2>&1 &

# Deploy to production
cd /home/tyler/Desktop/Cornucopia && vercel --prod

# Push schema changes to prod DB
cd /home/tyler/Desktop/Cornucopia && npx prisma db push

# Restore Tyler as ADMIN after DB wipe
# His Supabase Auth ID: 3449876d-d4b7-4707-980d-d965f1f00230
```

**Laptop:** KDE Plasma, Wayland, Ubuntu. Suspend disabled. Screen blanks after 10 min.
- Wake screen: `sudo -u tyler WAYLAND_DISPLAY=wayland-0 XDG_RUNTIME_DIR=/run/user/1000 qdbus org.kde.screensaver /ScreenSaver SimulateUserActivity`
- Sudo: passwordless via `/etc/sudoers.d/tyler-nopasswd`
- Elevated mode: `/elevated full` in Telegram session

---

## ⚠️ LAYOUT RULE — Must Follow

**Every flex child needs `min-w-0` or it will overflow on mobile.**

```tsx
// Dashboard client component root:
<div className="flex-1 min-w-0 overflow-x-hidden w-full">

// Any <main> inside a flex layout:
<main className="flex-1 min-w-0 px-3 overflow-x-hidden">
```

Without `min-w-0`, flex items have `min-width: auto` and overflow their container.
This rule is in CODEBASE.md. Always check new pages.

---

## Business Model

- **Sellers (producers):** Farmers, ranchers, artisans — list products at market stands or via delivery zones
- **Buyers (consumers):** Local community members
- **Platform fee:** 5% of subtotal (min $0.50)
- **Payments:** Stripe Connect — sellers need connected accounts
- **Approval required:** All products and stands go through admin (Tyler) review
- **No dropshipping:** Tyler manually reviews each product for local authenticity

---

## Core Data Model (Quick Reference)

**Three inventory sources (important!):**
1. `Product.inventory` — legacy fallback, often 0
2. `ProductStandListing.customInventory` — per-stand inventory (primary)
3. `ProductDeliveryListing.inventory` — per-day-per-zone delivery inventory

**Product must have `marketStandId` set** to appear in geo/PostGIS search.

**Status flow:** PENDING → APPROVED (admin approval required)

**Stand open/close system:**
- `MarketStand.isOpen` (boolean) — manual toggle, takes priority
- `MarketStand.hours` (JSON) — weekly schedule, used as fallback
- Auto-close: if `isOpen=true` but past scheduled hours, resets on page load
- No hours set → toggle stays on indefinitely (firewood stand use case)

---

## Features Built (as of 2026-03-19)

### Producer Tools
- **Onboarding wizard** `/onboarding/producer` — 4-step guided flow
- **QR Stand Portal** `/stand-portal/[standId]` — open/close, cash/card purchase
- **Delivery zones** — RECURRING and ONE_TIME, zip-code matching
- **Dashboard** — inventory alerts, stand toggle, "Tap to Open"/"Open Now" pill
- **Market stand form** — map picker (GPS + address search), no lat/lng inputs
- **Hours** — optional on setup, note directing to dashboard toggle

### Consumer Experience
- **Home page** — geo-sorted products, freshness badges
- **Search** `/search?zip=` — products + stands + events, delivery by zip
- **Product page** — "Where to get it" with zip proximity, distance badges
- **Market stand page** — hamburger product rows, back button
- **Delivery zone page** `/delivery-zone/[id]` — products in that zone
- **Explore map** `/market-stand` — viewport-based filtering, green FAB

### Admin Tools
- `/admin/products` — pending tab with review cards, rejection emails

### Infrastructure
- **Service worker** for PWA
- **QStash warmup** every 5 min
- **Vercel cron** removed (Hobby plan limitation)
- **Google Maps** enabled with billing

---

## How to Work on This Project

### Small fixes
Edit directly, commit, `vercel --prod`

### Features
Write spec to `/tmp/task.md`, then:
```bash
cd /home/tyler/Desktop/Cornucopia && claude --permission-mode bypassPermissions --print "$(cat /tmp/task.md)" 2>&1 &
```

### Task spec must include:
1. Files to read first
2. Files NOT to modify
3. Existing actions/components to reuse
4. `npx tsc --noEmit` before finishing
5. `openclaw system event --text "Done: X" --mode now` at end

### QA checklist
- Take mobile screenshots (390px) with Playwright
- Check for overflow on mobile (the persistent width bug)
- Verify TypeScript compiles

### Common Gotchas
- **Tailwind JIT:** New utility classes → add to globals.css
- **`.next` cache:** `rm -rf .next` if MODULE_NOT_FOUND errors
- **Vercel cron:** Hobby plan = daily only. Use QStash instead.
- **`elevated:true` on exec:** Kills long-running processes. Use background mode.
- **Supabase Auth vs User table:** Wiping User table doesn't wipe Supabase Auth.
- **`marketStandId` on Product:** Must be set for geo search.
- **formatPrice:** Already divides by 100. Don't divide again before calling it.
- **Price display:** Always `price / 100` in display, stored as cents.

---

## Current Priorities

1. **First real producer onboarded** — everything is ready
2. **Logo** — waiting on designer for horizontal lockup + white SVG
3. **Gmail "send as"** — Cloudflare routing done, sending not set up
4. **QR portal** — test end-to-end with real payment
5. **Cross-listing** — future, schema ready, no UI

## Roadmap (see ROADMAP.md in repo)
- Cross-stand product listing
- Stand check-in system (twice daily)
- Customer inventory self-reporting via QR
- Farm profile in search results
