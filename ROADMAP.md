# Cornucopia Feature Roadmap

**Last Updated:** 2026-03-18
**Purpose:** Planned features with design decisions captured from founder conversations.

---

## Feature 1: QR Stand Portal (Medium Priority — Pre-Launch)

### Concept
A permanent QR code URL per market stand that acts as a physical presence gate. Scanning it opens a simplified "at the stand" shopping experience distinct from the main delivery-focused flow.

### User Flows

#### Customer Flow
1. Scans QR at physical stand → opens `/stand-portal/[standId]`
2. Must be **logged in** to interact (reduces abuse)
3. Sees all products available at this stand with live inventory
4. Two purchase paths:
   - **Credit (Stripe):** Tap "Buy" → simplified checkout (no delivery date, no address — just quantity + payment). New lightweight checkout flow, reusable cart logic from existing system.
   - **Cash:** Tap "Paid Cash" → decrements inventory, records cash sale (no payment captured). Requires login to prevent spam.
5. Cross-listed products look identical — revenue split is invisible to customer

#### Producer Flow
1. Scans same QR (or accesses via dashboard)
2. Gets "owner view" — same product list but with:
   - Bulk inventory update controls
   - Restock buttons
   - Stand open/close toggle
   - Sales summary for the day

#### Stand Open/Close Toggle
- Producer checks in **twice a day** (open + close)
- When **closed**: Cash decrement disabled. Credit purchases still allowed (async)
- When **open**: Full functionality unlocked
- Replaces the vague "general hours" with real-time status
- Future: push notification to subscribers when stand opens

### Technical Design

#### New Route
`app/stand-portal/[standId]/page.tsx`
- Public URL (anyone can view)
- Interaction requires auth

#### New Cart Type
- Separate from delivery cart but reuses `CartItem` model
- New `fulfillmentType: 'QR_PURCHASE'` on CartItem
- No delivery date, no address required
- Checkout creates order with `type: 'PICKUP'`, `paymentStatus: 'PAID'` (credit) or `'CASH'` (new enum value)

#### Schema Changes Needed
```prisma
model MarketStand {
  // Add:
  isOpen        Boolean   @default(false)
  openedAt      DateTime?
  closedAt      DateTime?
  lastCheckedIn DateTime?
}

enum PaymentStatus {
  // Add:
  CASH  // self-reported cash purchase
}

enum OrderType {
  // Add:
  QR_PURCHASE  // in-person via QR portal
}
```

#### QR Code
- URL: `https://www.cornucopialocal.com/stand-portal/[standId]`
- Static — never changes, no expiry
- Already partially implemented: `components/QRPaymentCallout.tsx` (repurpose/extend)

### Open Questions
- Does cash decrement create an `Order` record (with $0 payment) for tracking? → Recommend yes, for analytics
- Should the producer's "owner view" be the same URL with role detection, or a separate dashboard route?

---

## Feature 2: Cross-Stand Product Listing (Advanced — Post-Launch)

### Concept
A producer from out of town (or a niche producer) can request to have their products sold at another stand owner's location. The stand owner approves and sets their commission. Revenue is automatically split at checkout.

### Schema Status
**Already designed in Prisma schema** — needs UI only:
- `ProductStandListing.status` (ListingRequestStatus): PENDING, APPROVED, REJECTED, CANCELLED, REMOVED
- `ProductStandListing.commissionType`: PERCENTAGE or FIXED
- `ProductStandListing.commissionRate`: % of sale
- `ProductStandListing.commissionFixed`: flat fee per unit
- `ProductStandListing.respondedById`: who approved

### User Flows

#### Producer Flow (requests to list)
1. Browses market stands on the platform
2. Clicks "List my product here" on a stand they want to join
3. Selects which product(s), sets inventory allocation for that stand
4. Sends request → stand owner gets notification

#### Stand Owner Flow (approves/rejects)
1. Receives notification: "Tyler wants to list Eggs at your stand"
2. Reviews product, sets their commission rate (e.g., 10%)
3. Approves or rejects
4. If approved: product appears at their stand with the producer's set inventory

#### Both Directions
- Stand owner can also **invite** a producer: "I want your eggs at my stand"
- Producer receives invite notification, can accept/decline
- Stand owner still sets commission when inviting

### Inventory Management
- Producer allocates inventory **per location independently**
  - 30 eggs → Idlewild (own stand)
  - 20 eggs → Thursday Market (cross-listed)
  - 50 eggs → Delivery (Pine Valley zone)
- System **warns** if total allocations exceed a declared "total stock" number (optional field)
- Producer has a **unified dashboard** showing all locations:
  ```
  Product: Eggs
  ├── Idlewild Farm Stand (own)     30 remaining  [Update]
  ├── Thursday Reno Market (listed)  12 remaining  [Update]
  └── Pine Valley Delivery (zone)    44 remaining  [Update]
  ```
- Inventory updates flow: producer updates → reflected immediately at that location

### Revenue Split (3-way)
- **Platform:** 5% of subtotal (taken from producer's cut)
- **Stand owner:** Their commission % (set at approval)
- **Producer:** Remainder
- Example: $10 egg sale, 10% stand commission, 5% platform fee
  - Stand owner: $1.00
  - Platform: $0.45 (5% of $9)
  - Producer: $8.55
- Stripe implementation: `transfer_group` already exists, add second transfer to stand owner's connected account

### Credit Card Only for Cross-Listed Products
- Cross-listed products at another owner's stand: **credit card required**
- Reason: cash transactions at a third-party stand can't be reliably tracked or split
- UI: cash option hidden/disabled for cross-listed items in QR portal

### Stand Owner Requirements
- Must have a Stripe Connected account to receive commission payments
- Same onboarding flow as producers (`/api/stripe/connect`)

### Dashboard Changes Needed

#### Producer Dashboard
- `/dashboard/products` → add per-location inventory view
- `/dashboard/listings` (new) → manage cross-listing requests sent/received
- `/dashboard/listings/[id]` → view specific listing, update inventory

#### Stand Owner Dashboard
- `/dashboard/market-stand/listings` (new) → pending requests + active cross-listings
- Approve/reject UI with commission rate input
- View cross-listed product inventory and sales

### Technical Notes
- `ProductStandListing.isPrimary` (currently unused) → mark the producer's own stand as primary
- All existing `standListings` queries need to include cross-listed products
- Checkout webhook needs to handle variable number of transfers per order
- `PendingCheckout.transfers` already designed as an array — just needs additional entries

---

## Feature 3: Customer Inventory Self-Reporting (Future)

### Concept
Logged-in customers at a stand (via QR portal) can decrement inventory when paying cash, keeping stock accurate without producer intervention.

### Design Decisions
- **Logged in required** — prevents anonymous abuse
- Recorded as a cash `Order` with `paymentStatus: CASH`
- Tied to stand's open/close status — only when stand is open
- Producer can see who decremented (audit trail via userId)

### Abuse Prevention
- Requires login
- Limited to realistic quantities (max per transaction configurable per product)
- Stand must be in "open" state
- Future: flag anomalous behavior (same user decrements 10x in 5 min)

---

## Feature 4: Stand Check-In System (Alongside QR Portal)

### Concept
Producers check in twice daily — morning open, evening close. Replaces vague "general hours."

### Design
- Simple toggle in QR portal owner view + dashboard
- Records `openedAt` / `closedAt` timestamps on `MarketStand`
- `lastCheckedIn` tracks engagement (producers who never check in → flagged)
- Future: notify subscribed customers when their favorite stand opens
- Future: show "Open Now" / "Closed" badge on stand cards in search

### Schema
```prisma
model MarketStand {
  isOpen        Boolean   @default(false)
  openedAt      DateTime? // most recent open
  closedAt      DateTime? // most recent close
  lastCheckedIn DateTime? // either open or close
}
```

---

## Priority Order

| Feature | Priority | Complexity | Blocks |
|---------|----------|------------|--------|
| QR Portal (basic — open/close + inventory) | High | Medium | Nothing |
| QR Portal (credit purchase) | High | Medium | Needs new checkout flow |
| Stand Check-In | Medium | Low | QR Portal |
| Cross-listing (producer request flow) | Low | High | Stripe Connect for stand owners |
| Cross-listing (revenue split) | Low | High | Cross-listing request flow |
| Customer self-reporting | Low | Low | QR Portal + Check-In |

---

## Notes from Founder

- "Tracking inventory at the market stand is going to be a real pressure point"
- Cash + credit coexist at own stands; cross-listed stands are credit-only
- Delivery is always pre-sold; stand inventory is never pre-sold
- Producer needs to check in twice a day — morning open, evening close
- Consumer experience should be identical whether product is cross-listed or not
- QR portal is the physical presence gate — not geo-locked, but requires login to interact

## Stand Portal vs Dashboard — Design Decision (2026-03-19)

### Decision: Keep both, make purposes distinct

**Dashboard `/dashboard/market-stand`** = "Management mode" (at home)
- Bulk inventory editing
- Stand settings/configuration
- Historical data, last restocked times
- Product management
- NO open/close toggle (that belongs to portal)

**QR Stand Portal `/stand-portal/[id]`** = "Market day mode" (in person)
- Primary: Open/close toggle (checking in for the day)
- Live product list for customers + producer
- Cash/card purchase
- Quick inventory updates
- No product photos needed — you're already there, you can see the product
- Access via QR code = physical presence confirmation

### Future: Portal enhancements
- Customer can scan QR → decrement inventory (cash purchase self-service)
- Show "I'm here" to subscribers (notify people who follow the stand)
- Check-in timestamp visible to customers ("Tyler opened 20 min ago")
