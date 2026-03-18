# Cornucopia Codebase Reference

**Last Updated:** March 18, 2026
**Purpose:** Complete technical reference for AI assistants working on this codebase. Dense, precise, no fluff.

---

## 1. What This App Is

**Cornucopia** is a local food marketplace connecting small-scale farmers/producers (sellers) with local consumers (buyers).

- **Current Status:** Pre-launch / live on cornucopialocal.com
- **Business Model:** Platform takes commission on sales, sellers need Stripe Connected accounts
- **Fulfillment:** Pickup at market stands OR delivery via producer-defined delivery zones
- **Payment:** Stripe Checkout for online purchases, QR codes for in-person cash/card payments

### Tech Stack
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Server Actions
- **Database:** PostgreSQL (Supabase) with PostGIS extension for geo queries
- **Auth:** Supabase Auth (magic link, OAuth)
- **Storage:** Supabase Storage for images
- **Payments:** Stripe (Connect for multi-party payments)
- **Caching:** Upstash Redis
- **Deployment:** Vercel (main branch → production)
- **DNS:** Cloudflare
- **Analytics:** PostHog
- **Email:** Resend

---

## 2. Data Model & Relationships

### Core Models

#### **User** (lines 15-58 in schema.prisma)
- Central identity model for all actors (buyers, sellers, admins)
- **Key Fields:**
  - `id` (String): Supabase Auth UUID, **not auto-generated** by Prisma
  - `email`, `firstName`, `lastName`, `profileImage`
  - `connectedAccountId` (String?): Stripe Connected Account ID for sellers
  - `stripeConnectedLinked` (Boolean): Whether Stripe account is fully onboarded
  - `role` (UserRole): `USER`, `ADMIN`, or `SUPER_ADMIN`
  - `username` (String?, unique): Optional public handle
  - `city`, `state`, `zipCode`: User location for delivery/search
  - `profileComplete` (Boolean): Whether onboarding is finished
  - `usernameLastChanged` (DateTime?): For enforcing username change cooldown

- **Relations:**
  - One-to-many: products, marketStands, locals, deliveryZones, orders, reviews
  - One-to-one: cart, engagement

- **Gotchas:**
  - User records are created on-demand in server actions (see `app/actions.ts:104-121`) when Supabase auth user makes their first action
  - Supabase Auth is source of truth; this table is denormalized cache

---

#### **MarketStand** (lines 60-98)
- Physical location where products are sold (farmer's market booth, farm stand, pop-up)
- **Key Fields:**
  - `name`, `description`, `images`, `tags`
  - `latitude`, `longitude`: Required for geo search
  - `location` (Unsupported("geography")): PostGIS geography column (auto-populated from lat/lng)
  - `locationName` (String): Human-readable address (e.g., "Downtown Farmer's Market")
  - `locationGuide` (String): Detailed directions ("Look for the blue tent near the fountain")
  - `hours` (Json?): Weekly schedule (parsed by `MarketStandHours` component)
  - `streetAddress`, `city`, `zipCode`: Optional structured address fields
  - `status` (Status): `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED` (admin workflow)
  - `isActive` (Boolean): Soft delete flag
  - `userId` (String): Owner reference

- **Relations:**
  - One-to-many: products (direct via `marketStandId`), productListings (junction table)
  - Many-to-one: user

- **Indexes:**
  - GIST index on `location` column for PostGIS spatial queries
  - B-tree indexes on `latitude`, `longitude`, `isActive`, `userId`

---

#### **Product** (lines 100-153)
- An item for sale (e.g., "Organic Tomatoes, 1 lb")
- **Key Fields:**
  - `name`, `description`, `images`, `tags` (user-defined)
  - `adminTags` (String[]): Admin-assigned freshness badges (override auto-derived tags)
  - `price` (Int): **Stored in cents** (e.g., $5.99 = 599)
  - `inventory` (Int): Global inventory count (deprecated for multi-stand products)
  - `inventoryUpdatedAt` (DateTime?): When inventory was last manually updated (drives "Fresh Today" badges)
  - `status` (Status): `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
  - `isActive` (Boolean): Soft delete
  - `userId` (String): Producer who created the product
  - `marketStandId` (String?): **Critical for geo search** — primary stand where product is sold
  - `localId` (String?): Link to farm profile page
  - `deliveryAvailable` (Boolean): Whether this product offers delivery
  - `deliveryZoneId` (String?): Primary delivery zone
  - `deliveryType` (DeliveryType?): `ONE_TIME` or `RECURRING`
  - `deliverySchedule` (Json?): Legacy field, use `deliveryDates` or `ProductDeliveryListing` instead
  - `deliveryDates` (DateTime[]): Specific delivery dates for `ONE_TIME` deliveries
  - `availableDate`, `availableUntil` (DateTime?): Pre-order / seasonal availability window
  - `taxCode` (TaxCode): `RAW_FOOD`, `PREPARED_FOOD`, `NON_FOOD` (for sales tax)
  - `taxable` (Boolean): Whether to charge tax

- **Relations:**
  - Many-to-one: user, marketStand (primary), local, deliveryZone
  - One-to-many: standListings (ProductStandListing), deliveryListings (ProductDeliveryListing)
  - One-to-many: cartItems, orderItems, reviews

- **Critical Design Decision: marketStandId vs standListings**
  - `marketStandId` is a **direct FK** set to the first stand in the listings when product is created (see `app/actions.ts:211-222`)
  - Required for PostGIS `get_home_products` function to filter by stand location
  - `standListings` is a **junction table** (ProductStandListing) allowing products to be sold at multiple stands
  - Stand profile pages use `standListings` to show all products available at that stand
  - **Both exist** because:
    1. PostGIS function needs a single FK for join performance
    2. Products can genuinely be available at multiple locations (cross-listing)

- **Inventory Sources (3 places to check):**
  1. `Product.inventory`: Global/fallback inventory
  2. `ProductStandListing.customInventory`: Per-stand inventory override
  3. `ProductDeliveryListing.inventory`: Per-delivery-day inventory

---

#### **ProductStandListing** (lines 523-562)
- Junction table: Product ↔ MarketStand many-to-many relationship
- **Purpose:** Allow a product to be sold at multiple stands with different inventory/pricing per location
- **Key Fields:**
  - `productId`, `marketStandId` (unique together)
  - `isActive` (Boolean): Whether this listing is currently shown
  - `isPrimary` (Boolean): Whether this is the "home" stand (currently unused, may be removed)
  - `customPrice` (Int?): Override price for this stand (in cents)
  - `customInventory` (Int?): Override inventory for this stand
  - `status` (ListingRequestStatus?): `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `REMOVED`
  - `commissionType`, `commissionRate`, `commissionFixed`: For revenue sharing if product is cross-listed at another seller's stand
  - `totalUnitsSold`, `totalRevenue`, `totalCommission`: Tracking metrics

- **Relations:**
  - Many-to-one: product, marketStand, respondedBy (User who approved/rejected)
  - One-to-many: OrderItem (links orders to specific stand listings)

- **Used By:**
  - `components/tiles/ProductHamburgerRow.tsx`: Compact product row on stand profile page
  - `components/AlsoAvailableAt.tsx`: "Also available at" section on product page
  - `components/OtherProductsFromStand.tsx`: Related products from same stand

---

#### **ProductDeliveryListing** (lines 564-580)
- Junction table: Product ↔ DeliveryZone per day-of-week inventory
- **Purpose:** RECURRING deliveries need different inventory for each day (e.g., 10 loaves on Tuesday, 5 on Friday)
- **Key Fields:**
  - `productId`, `deliveryZoneId`, `dayOfWeek` (unique together)
  - `dayOfWeek` (String): "Monday", "Tuesday", etc.
  - `inventory` (Int): Available qty for this product on this day in this zone

- **Used By:**
  - `app/actions/check-delivery-eligibility.ts`: Generates delivery options with per-day inventory
  - `components/DeliveryOptionsCard.tsx`: Shows available delivery dates
  - `components/form/RecurringDeliveryScheduler.tsx`: Producer sets per-day inventory

---

#### **DeliveryZone** (lines 485-521)
- Geographic service area for home delivery
- **Key Fields:**
  - `userId` (String): Producer who owns this zone
  - `name` (String): e.g., "Downtown SF", "Berkeley Hills"
  - `description` (String?): Additional details
  - `zipCodes` (String[]): List of 5-digit zip codes served
  - `cities` (String[]): List of city names (alternative to zips)
  - `states` (String[]): List of state abbreviations (for broad zones)
  - `deliveryFee` (Int): Flat fee in cents
  - `freeDeliveryThreshold` (Int?): Minimum order for free delivery
  - `minimumOrder` (Int?): Minimum order to qualify for delivery
  - `deliveryDays` (String[]): Days of week (e.g., `["Tuesday", "Friday"]`)
  - `deliveryTimeWindows` (Json?): Map of day → time window (e.g., `{ "Tuesday": "10am-2pm" }`)
  - `deliveryType` (DeliveryType): `RECURRING` or `ONE_TIME`
  - `scheduledDates` (Json?): For ONE_TIME zones, specific delivery dates
  - `isActive` (Boolean): Soft delete
  - `flaggedForReview`, `isSuspended`: Admin moderation flags

- **Relations:**
  - Many-to-one: user
  - One-to-many: products, productListings, orders, deliveries

- **Eligibility Check:** See `app/actions/check-delivery-eligibility.ts`
  - Matches user's zip code against `zipCodes` array
  - OR matches user's city+state against `cities` + `states`
  - Returns list of available delivery dates with inventory

---

#### **Delivery** (lines 582-604)
- Scheduled delivery run (new system, preferred over legacy product.deliveryDates)
- **Key Fields:**
  - `userId` (String): Producer running this delivery
  - `date` (DateTime): Delivery date
  - `status` (DeliveryStatus): `SCHEDULED`, `OPEN`, `CLOSED`, `IN_TRANSIT`, `COMPLETED`, `CANCELLED`
  - `timeWindow` (String?): e.g., "9am-5pm"
  - `note` (String?): Instructions for customers

- **Relations:**
  - Many-to-one: user
  - Many-to-many: zones (DeliveryZone[])
  - One-to-many: products (DeliveryProduct[]), orders, cartItems

- **Purpose:** Allows producer to set specific inventory caps per product per delivery run (see DeliveryProduct model)

---

#### **DeliveryProduct** (lines 606-620)
- Links a specific Delivery run to a Product with optional cap
- **Key Fields:**
  - `deliveryId`, `productId` (unique together)
  - `cap` (Int?): Max quantity of this product for this delivery run

- **Used By:**
  - `components/delivery/DeliveryProductManager.tsx`: UI for managing per-delivery inventory
  - `app/actions/check-delivery-eligibility.ts:99-149`: Checks Delivery records first, falls back to legacy system

---

#### **Local** (lines 337-382)
- Farm profile page (distinct from MarketStand)
- **Purpose:** Rich storytelling page about the farm/producer (mission, history, practices)
- **Key Fields:**
  - `name`, `slug`, `description`, `tagline`, `story`
  - `missionStatement`, `values`, `certifications`, `teamMembers` (Json)
  - `farmingPractices` (String): Long-form description
  - `images`, `videoUrl`
  - `latitude`, `longitude`, `location` (geography): For map display
  - `locationName`, `locationGuide`
  - `socialMedia`, `instagramHandle`, `facebookPageUrl`, `website`
  - `foundedYear`, `acreage`, `generationNumber`: Farm stats
  - `seasonalSchedule`, `events`, `operatingHours` (Json)
  - `wholesaleInfo` (String?): Bulk purchasing details
  - `contactForm` (Boolean): Whether to show contact form
  - `status`, `isActive`

- **Relations:**
  - Many-to-one: user
  - One-to-many: products (via `localId` FK)

- **Difference vs MarketStand:**
  - **MarketStand:** Transactional (where to buy)
  - **Local:** Narrative (who you're buying from, their story)
  - A producer can have multiple MarketStands but typically one Local profile

---

#### **Event** (lines 701-750)
- Farmer's markets, farm tours, workshops, festivals
- **Key Fields:**
  - `name`, `slug`, `description`, `shortDescription`
  - `images`, `tags`
  - `eventType` (EventType): `FARMERS_MARKET`, `FARM_TOUR`, `WORKSHOP`, `FESTIVAL`, `POP_UP`, `SEASONAL`, `OTHER`
  - `startDate`, `endDate` (DateTime)
  - `isRecurring` (Boolean): Weekly/monthly events
  - `recurringSchedule` (Json?): iCal-style recurrence rules
  - `latitude`, `longitude`, `location` (geography)
  - `locationName`, `locationGuide`, `streetAddress`, `city`, `state`, `zipCode`
  - `maxVendors`, `maxAttendees` (Int?): Capacity limits
  - `vendorFee` (Int?): Fee to participate as vendor
  - `isVendorApplicationOpen` (Boolean)
  - `website`, `socialMedia`, `contactEmail`, `contactPhone`
  - `status` (EventStatus): `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED`
  - `organizerId` (String): User who created the event

- **Relations:**
  - Many-to-one: organizer (User)
  - One-to-many: vendors (EventVendor), metrics, statusHistory

- **EventVendor** (lines 752-773): Junction table for producer → event participation
  - `status` (EventVendorStatus): `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `WITHDRAWN`
  - `boothNumber`, `boothLocation`, `specialNotes`

---

#### **Order** (lines 397-438)
- A completed purchase by a customer
- **Key Fields:**
  - `orderNumber` (String, unique): Human-readable ID (e.g., "ORD-20250101-ABC123")
  - `userId` (String): Customer
  - `marketStandId` (String): Stand where order was placed (for PICKUP) or primary stand (for DELIVERY with multiple items)
  - `type` (OrderType): `PICKUP` or `DELIVERY`
  - `status` (OrderStatus): `PENDING`, `CONFIRMED`, `READY`, `COMPLETED`, `CANCELLED`, `DELIVERED`
  - `paymentStatus` (PaymentStatus): `UNPAID`, `PAID`, `REFUNDED`, `PARTIALLY_REFUNDED`, `FAILED`
  - `totalAmount`, `subtotal`, `tax`, `fees`, `platformFee` (Int, in cents)
  - `pickupTime` (DateTime?): For PICKUP orders
  - `deliveryAddress` (String?): For DELIVERY orders
  - `deliveryZoneId`, `deliveryDate`, `deliveryId`: For DELIVERY orders
  - `stripeSessionId`, `stripePaymentIntentId`, `stripeTransferGroup`: Stripe metadata for multi-party payments

- **Relations:**
  - Many-to-one: user, marketStand, deliveryZone, delivery
  - One-to-many: items (OrderItem), issues (OrderIssue)

- **Flow:** Cart → Checkout API → Stripe Checkout → Webhook → Order creation
  - See `app/api/checkout/route.ts` for checkout session creation
  - Webhook handler creates Order + OrderItems + transfers funds to sellers

---

#### **OrderItem** (lines 440-455)
- Line item in an order
- **Key Fields:**
  - `orderId`, `productId`, `quantity`
  - `priceAtTime` (Int): Price snapshot at checkout (in cents)
  - `listingId` (String?): Reference to ProductStandListing if item was from a cross-listing
  - `commissionAmount` (Int?): Platform fee for this item

---

#### **Cart** & **CartItem** (lines 647-680)
- Shopping cart (one per user)
- **CartItem Fields:**
  - `cartId`, `productId`, `quantity`
  - `fulfillmentType` (String): "PICKUP" or "DELIVERY"
  - `deliveryDate` (DateTime?): Selected delivery date (for DELIVERY)
  - `deliveryZoneId`, `deliveryId`: Delivery details
  - `marketStandId` (String?): Selected stand (for PICKUP)
  - `pickupTime` (DateTime?): Selected pickup time

- **Unique Constraint:** (`cartId`, `productId`, `deliveryDate`, `pickupTime`)
  - Allows same product with different fulfillment options in one cart

---

#### **PendingCheckout** (lines 682-699)
- Snapshot of cart data during checkout flow
- **Purpose:** Stripe metadata has size limits; this stores full cart details for webhook processing
- **Key Fields:**
  - `stripeSessionId` (String, unique): Links to Stripe Checkout Session
  - `userId`, `cartId`
  - `transferGroup` (String): Links Stripe payment → transfers
  - `platformFee`, `subtotal`, `tax`, `deliveryFees` (Int)
  - `items` (Json): Array of cart items with snapshot data
  - `transfers` (Json): Array of seller transfer instructions
  - `expiresAt` (DateTime): TTL for cleanup (24h)

---

### Supporting Models

#### **ProductReview** (lines 155-173)
- User reviews on products
- `isVerifiedPurchase` (Boolean): Whether reviewer bought the product
- `helpfulVotes`, `reportCount`, `isVisible`: Moderation system

#### **StandReview** (lines 175-193)
- User reviews on market stands
- Similar structure to ProductReview

#### **ProductStatusHistory**, **StandStatusHistory**, **EventStatusHistory**
- Audit log for admin actions (PENDING → APPROVED, etc.)
- Stores `oldStatus`, `newStatus`, `changedById`, `note`, `createdAt`

#### **ProductMetrics**, **StandMetrics**, **EventMetrics**, **LocalMetrics**
- Analytics data (views, purchases, revenue)
- Daily rollups in `*DailyMetrics` tables

#### **UserEngagement** (lines 282-295)
- Per-user analytics (last visit, total visits, total purchases, favorite stands, search history)

#### **SavedProduct** (lines 457-468)
- User's "wishlist" / saved products
- Unique on (`userId`, `productId`)

#### **MarketStandSubscription** (lines 470-483)
- User subscriptions to stand notifications (new products, price changes, back in stock, etc.)
- `notificationTypes` (NotificationType[]): Opt-in per category

#### **ContactSubmission** (lines 297-319)
- Contact form submissions
- `category` (ContactCategory): `GENERAL`, `SUPPORT`, `FEEDBACK`
- `status` (ContactStatus): `NEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- `priority` (ContactPriority): `LOW`, `MEDIUM`, `HIGH`

#### **OrderIssue** (lines 622-645)
- Customer-reported problems with orders
- `issueType` (IssueType): `NOT_DELIVERED`, `WRONG_ITEMS`, `DAMAGED`, `POOR_QUALITY`, `LATE`, `OTHER`
- `status` (IssueStatus): `PENDING`, `INVESTIGATING`, `RESOLVED`, `REFUNDED`, `ESCALATED`

#### **VisitorSession** (lines 321-335)
- Anonymous session tracking
- `sessionId` (String, unique), `userId` (String?, optional link after login)
- `pagesViewed` (Json): Array of page paths

---

## 3. Key Business Logic

### Geo Search (PostGIS)
**Files:**
- `lib/repositories/geoProductRepository.ts`: TypeScript wrapper
- `prisma/migrations/add_admin_tags/add_admin_tags_to_postgis.sql`: SQL function definitions

**How it works:**
1. Product **must have** `marketStandId` set (not null) to appear in geo results
2. MarketStand **must have** `location` geography column populated (auto-generated from lat/lng)
3. PostGIS function `get_home_products(lat, lng, zipCode, radiusKm, limit)`:
   - Filters products where `marketStand.location` is within `radiusKm` of user location (using ST_DWithin)
   - Calculates distance in kilometers (ST_Distance)
   - Also checks delivery eligibility: if `zipCode` is in product's `deliveryZone.zipCodes`
   - Returns combined result set sorted by availability → distance

**Performance:**
- Uses GIST spatial index on `MarketStand.location` column
- Query executes in ~50-100ms for 250km radius
- Redis caching (lib/cache/redis.ts) with 5-minute TTL for home page

**Fallback:** If PostGIS fails or no location provided, falls back to standard Prisma queries sorted by `updatedAt DESC`

---

### Delivery Eligibility
**File:** `app/actions/check-delivery-eligibility.ts`

**Logic:**
1. Check if product has `deliveryAvailable = true` and `deliveryZone` is set
2. Match user's zip code against `deliveryZone.zipCodes` array (OR city+state)
3. If match:
   - **New path:** Query `Delivery` table for scheduled delivery runs (lines 99-149)
     - Returns actual Delivery records with `DeliveryProduct` inventory caps
   - **Legacy path:** Generate delivery options from `product.deliveryType` + `product.deliveryDates` OR `deliveryZone.deliveryDays` (lines 152-245)
     - For `ONE_TIME`: Returns specific dates from `product.deliveryDates` (future dates only)
     - For `RECURRING`: Generates next 56 days of delivery dates matching `deliveryZone.deliveryDays`
     - Uses `ProductDeliveryListing.inventory` for per-day inventory (lines 189-220)
4. Returns `SerializedDeliveryEligibilityResult` with array of `SerializedDeliveryOption[]`

**Displayed by:** `components/WhereToGetIt.tsx` (unified purchase options UI)

---

### Freshness Badges
**Files:**
- `components/tiles/FreshnessBadge.tsx`: Badge component + derivation logic
- `lib/utils/product-badges.ts`: Server-side badge calculation

**Auto-Derived Tags:**
- `fresh-this-hour`: `inventoryUpdatedAt` < 1 hour ago
- `fresh-today`: `inventoryUpdatedAt` < 12 hours ago
- `last-few`: `inventory <= 3`
- `limited-stock`: `inventory 4-10`
- `new-arrival`: `createdAt` < 48 hours ago
- `pre-order`: `availableDate` > now
- `seasonal`: `availableUntil` >= now
- `back-in-stock`: (requires previous inventory state, not fully implemented)

**Admin Tags:** `Product.adminTags` array overrides auto-derived tags (take priority)

**Usage:**
- `ProductTile.tsx` (home page grid): Shows primary + secondary badge
- `ProductHamburgerRow.tsx` (stand profile): Shows primary badge only
- `deriveFreshnessTags()` function returns sorted array (most urgent first)

---

### Product Status Flow
1. **Create:** Product starts as `status: PENDING`, `isActive: true`
2. **Admin Review:** Admin calls `/api/admin/product/approve` or `/api/admin/product/reject`
   - Approve: Sets `status: APPROVED`
   - Reject: Sets `status: REJECTED`, `isActive: false`
   - Records change in `ProductStatusHistory` table
3. **Suspend:** Admin can suspend approved product → `status: SUSPENDED`, `isActive: false`
4. **Public Visibility:** Only products with `status: APPROVED` AND `isActive: true` appear in search/home page

**Same flow applies to MarketStand and Event models**

---

### QR Payment System
**Purpose:** Allow in-person cash/card payments at market stands

**Files:**
- `components/QRPaymentCallout.tsx`: Displays QR code + instructions
- `components/PaymentTab.tsx`: Generates QR code with Stripe payment link

**How it works:**
1. Producer must have `user.connectedAccountId` (Stripe Connect onboarded)
2. QR code encodes URL: `${APP_URL}/payment/stand/${standId}?amount=${price}`
3. Customer scans → redirected to payment page → Stripe Checkout
4. Funds deposited directly to producer's connected account (minus platform fee)

**Note:** Currently implemented but not heavily used; may be deprecated in favor of online-only checkout

---

### Cart → Order → Payment Flow
**Files:**
- `app/api/checkout/route.ts`: Creates Stripe Checkout session
- `app/api/stripe/route.ts`: Webhook handler (processes completed payments)
- `lib/cart/calculations.ts`: Cart totals logic
- `lib/stripe/fees.ts`: Platform fee calculation

**Flow:**
1. User adds items to cart (`CartItem` records)
2. Clicks "Checkout" → POST `/api/checkout`
3. Backend:
   - Validates cart (inventory, seller Stripe accounts)
   - Groups items by seller + fulfillment type
   - Calculates totals: `subtotal + tax + deliveryFees`
   - Calculates platform fee (5% of subtotal, see `lib/stripe/fees.ts`)
   - Creates `PendingCheckout` snapshot
   - Creates Stripe Checkout session with `transfer_group` for multi-party payment
4. User pays via Stripe → webhook fires → `app/api/stripe/route.ts`
5. Webhook handler:
   - Fetches `PendingCheckout` by `stripeSessionId`
   - Creates `Order` + `OrderItem[]` records
   - Queues Stripe Transfers to each seller (minus platform fee)
   - Clears user's cart

**Platform Fee:** 5% of subtotal (minimum $0.50), see `calculatePlatformFee()` in `lib/stripe/fees.ts`

---

## 4. Architecture Decisions & Gotchas

### Why marketStandId Exists on Product (in addition to ProductStandListing)
**Problem:** Products can be sold at multiple stands (cross-listing), but PostGIS geo queries need a single FK for join performance.

**Solution:**
- `Product.marketStandId`: Direct FK to "primary" stand (first stand in listings when product is created)
- `ProductStandListing`: Junction table for all stands where product is available (including primary)
- **PostGIS function** joins on `marketStandId` for fast spatial filtering
- **Stand profile pages** query `ProductStandListing` to show all products available at that stand

**Code:** See `app/actions.ts:211-222` (sets marketStandId when creating product)

---

### Tailwind pb-24/pb-20 Classes May Not Apply
**Problem:** Tailwind JIT compiler only includes classes used in source files at build time.

**Solution:** For new utility classes (e.g., `pb-96`, `h-128`), add them to `globals.css` as custom CSS:
```css
.pb-96 {
  padding-bottom: 96px;
}
```

**Example:** `.mobile-content-wrapper` in `globals.css:76-84` adds 96px bottom padding to clear fixed mobile nav.

---

### Dev Server: Never Use elevated:true for Long-Running Processes
**Correct:**
```bash
nohup npm run dev > /tmp/nextdev.log 2>&1 &
```

**Incorrect:**
```bash
npm run dev  # blocks terminal
```

**Reason:** Dev server runs indefinitely; using `nohup` + background (`&`) prevents terminal lockup.

---

### .next Cache Corruption
**Symptom:** `MODULE_NOT_FOUND` errors after dependency changes or branch switches.

**Fix:**
```bash
rm -rf .next
npm run dev
```

**Reason:** Next.js caches compiled pages/modules; stale cache can reference old imports.

---

### Supabase Pooler Configuration
**Two connection strings:**
1. **Transaction Pooler** (port 6543, `?pgbouncer=true`): For Prisma queries
   - Use this for `DATABASE_URL` in production
   - Handles connection pooling via PgBouncer
2. **Direct Connection** (port 5432): For migrations
   - Use this for `DIRECT_URL` in schema.prisma
   - Required for schema changes (DDL statements)

**Code:** See `lib/db.ts:23-33` (appends `connection_limit=3` to avoid overwhelming pooler)

---

### Vercel Hobby Tier: 10-Second Cold Start Limit
**Problem:** Serverless functions on Hobby tier timeout after 10s on cold start. Database queries + Prisma Client initialization can exceed this.

**Solutions:**
1. **Warmup Endpoint:** `/api/health/warmup` (hit periodically to keep instance warm)
2. **Optimize Prisma:** Use `engineType: "binary"` in schema.prisma (faster startup than `library`)
3. **Minimize imports:** Avoid large barrel exports, use direct imports
4. **Database indexing:** Ensure all frequently-queried fields have indexes

**See:** `COLD_START_OPTIMIZATION.md` for detailed analysis

---

### Environment Variables
**Critical vars (must be set):**
- `DATABASE_URL`: Supabase Transaction Pooler (port 6543)
- `DIRECT_URL`: Supabase Direct Connection (port 5432)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public client key
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side admin key
- `STRIPE_SECRET_KEY`: Stripe API key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe client key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: Redis cache

**See:** `.env.example` for full list

---

## 5. File Structure Map

### Critical Files & What They Do

#### Server Actions (app/actions/)
- `actions.ts`: **Main product/stand CRUD** (SellProduct, CreateMarketStand, UpdateMarketStand, UpdateInventory)
- `home-products.ts`: Home page product fetching with distance calculation
- `global-search.ts`: Unified search (products + stands + farms + events)
- `check-delivery-eligibility.ts`: Delivery zone matching + option generation
- `geo-products.ts`: Wrapper for geoProductRepository (PostGIS queries)
- `cart.ts`: Add/remove/update cart items
- `orders.ts`: Fetch user's orders
- `deliveries.ts`: Fetch/create/update delivery runs
- `delivery-zones.ts`: CRUD for delivery zones
- `market-stands.ts`: Fetch stands (grid, map, nearby)
- `products.ts`: Fetch products (with filters, pagination)
- `auth.ts`: Supabase auth helpers
- `upload.ts`: Supabase Storage file uploads
- `geocode.ts`: Google Maps Geocoding API wrapper

#### API Routes (app/api/)
- `checkout/route.ts`: **Creates Stripe Checkout session** (cart → payment)
- `stripe/route.ts`: **Webhook handler** (payment → order creation + transfers)
- `admin/*`: Admin endpoints (approve/reject/suspend products/stands/events)
- `auth/callback/route.ts`: OAuth callback handler
- `market-stand/[id]/products/route.ts`: Fetch products for a stand (public API)

#### Repositories (lib/repositories/)
- `geoProductRepository.ts`: **PostGIS queries** (get_home_products, get_products_within_radius)
- `productRepository.ts`: Standard Prisma product queries
- `marketStandRepository.ts`: Standard Prisma stand queries

#### Components (components/)
- `WhereToGetIt.tsx`: **Unified purchase options** (pickup + delivery) on product page
  - Shows all stands where product is available (sorted by distance)
  - Shows delivery options (if eligible)
  - Zip code input for distance calculation + delivery eligibility check
- `tiles/ProductTile.tsx`: Product card for **home page / search grid**
  - Shows freshness badges, pickup/delivery indicators, distance
- `tiles/ProductHamburgerRow.tsx`: Compact product row for **stand profile page**
  - Used in `app/market-stand/[id]/farm-profile.tsx`
- `tiles/FreshnessBadge.tsx`: Floating badges ("Fresh Today", "Last Few", etc.)
- `MobileBottomNav.tsx`: Fixed bottom navigation bar (Home, Markets, Saved, Purchases, Menu)
  - Uses `pb-96` in globals.css to clear bottom nav
- `DeliveryOptionsCard.tsx`: Calendar picker for delivery dates
- `ProductLocationMap.tsx`: Google Maps embed for stand location
- `MarketStandHours.tsx`: Parses `MarketStand.hours` JSON and displays weekly schedule
- `QRPaymentCallout.tsx`: QR code for in-person payments

#### Utilities (lib/utils/)
- `product-badges.ts`: `deriveFreshnessTags()`, `calculateProductBadge()` — server-side badge logic
- `distance.ts`: Haversine distance calculation (km → miles)
- `format.ts`: Date/time/currency formatting helpers
- `delivery-format.ts`: Delivery schedule formatting
- `location-cache.ts`: LocalStorage caching for user zip code

#### Styling (app/)
- `globals.css`: **Critical custom classes**
  - `.mobile-content-wrapper` (line 76): 96px bottom padding for mobile nav clearance
  - `.safe-area-bottom` (line 65): iOS notch padding
  - Input number spin button removal (line 87)

#### Config
- `next.config.mjs`: Next.js config (image domains, CSP headers, standalone output)
- `vercel.json`: Vercel deployment config (10s function timeout, env vars)
- `middleware.ts`: Rate limiting, auth checks
- `prisma/schema.prisma`: Database schema

---

## 6. Environment & Infrastructure

### Supabase
- **Production Project:** `swhinhgrtcowjmpstozh`
- **Dev Project:** `xvbuqpckrjutzcnjlsvj`
- **Database:** PostgreSQL 15 with PostGIS extension
- **Auth:** Magic link + OAuth (Google)
- **Storage:** Public bucket for product/stand images

### Vercel
- **Deployment:** Main branch → production (auto-deploy)
- **Domain:** cornucopialocal.com (Cloudflare DNS)
- **Build Command:** `prisma generate && next build` (see vercel.json)
- **Function Timeout:** 10s (Hobby tier limit)

### Stripe
- **Mode:** Live (production keys)
- **Connect:** Onboarding flow at `/api/stripe/connect`
- **Webhook:** `/api/stripe/route` (handles `checkout.session.completed` event)
- **Platform Fee:** 5% of subtotal (min $0.50)

### Redis (Upstash)
- **Purpose:** Caching product listings, geo queries
- **TTL:** 5 minutes for product lists, 1 hour for stand data
- **Implementation:** `lib/cache/redis.ts` (cacheAside pattern)

### Google Maps
- **API Key:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Usage:** Geocoding (zip → lat/lng), map embeds, directions links
- **Component:** `@react-google-maps/api` (react wrapper)

### Cloudflare
- **DNS:** Manages cornucopialocal.com
- **CDN:** Proxies traffic to Vercel

### PostHog
- **Analytics:** Client-side event tracking
- **Provider:** `components/providers/PostHogProvider.tsx`

---

## 7. Known Issues & Technical Debt

### Inventory Management
- **Problem:** Three different inventory sources (Product.inventory, ProductStandListing.customInventory, ProductDeliveryListing.inventory) are confusing
- **Impact:** Producers sometimes update wrong field, leading to "out of stock" products that actually have inventory
- **TODO:** Consolidate to single source of truth (likely ProductStandListing.customInventory becomes primary)

### marketStandId Denormalization
- **Problem:** Product.marketStandId is denormalized from ProductStandListing (first listing becomes marketStandId)
- **Impact:** If primary listing is deleted, marketStandId becomes null → product drops from geo search
- **TODO:** Add constraint or trigger to ensure marketStandId is always set if standListings exist

### Delivery System Complexity
- **Problem:** Two parallel systems (legacy product.deliveryDates vs new Delivery model)
- **Impact:** Confusion for producers, inconsistent UX
- **TODO:** Migrate all delivery-enabled products to use Delivery model exclusively

### QR Payment Underutilization
- **Problem:** QR payment feature is built but not heavily promoted or used
- **Impact:** Dead code / maintenance burden
- **TODO:** Either push feature adoption or remove it

### Cold Start Performance
- **Problem:** Vercel Hobby tier 10s timeout occasionally exceeded on cold start
- **Impact:** Users see 504 Gateway Timeout on first load
- **Mitigation:** Warmup endpoint (cron job), Prisma binary engine
- **TODO:** Upgrade to Pro tier OR optimize Prisma Client initialization

### Missing Test Coverage
- **Problem:** No unit/integration tests for critical flows (checkout, delivery eligibility)
- **Impact:** Regressions caught late (in production)
- **TODO:** Add Playwright tests for checkout flow, delivery eligibility

### Tailwind JIT Gotcha
- **Problem:** New utility classes (e.g., pb-96) don't work unless added to globals.css
- **Impact:** Developer confusion, inconsistent styling
- **TODO:** Document pattern OR switch to static Tailwind config

---

## 8. Current Sprint / Recent Changes

### Logo Integration (Recent)
- **Status:** Partial — logo added to Navbar, Footer
- **TODO:** Designer needs to deliver horizontal lockup for mobile nav
- **Files:** `components/Navbar.tsx`, `components/Footer.tsx`, `public/logo.svg`

### WhereToGetIt Component (Recent)
- **Purpose:** Unified UI for pickup + delivery options on product page
- **Features:**
  - Zip code proximity calculation (shows distance to stands)
  - Delivery eligibility check (green "Eligible" badge if zip matches)
  - Expandable delivery calendar
  - Multiple pickup locations (if product is cross-listed)
- **File:** `components/WhereToGetIt.tsx`

### Search Expanded (Recent)
- **Changes:**
  - Added delivery-only products (no marketStandId) to search results
  - Added Events to search (upcoming events within radius)
  - Improved relevance scoring (distance + availability)
- **Files:** `app/actions/global-search.ts`, `app/search/search-client.tsx`

### Mobile Bottom Nav Fixes (Recent)
- **Changes:**
  - Fixed nav overlapping content (added `.mobile-content-wrapper` class)
  - Added safe-area-inset-bottom for iOS notch
  - Replaced "Account" tab with "Menu" (sheet with full dashboard sidebar)
- **Files:** `components/MobileBottomNav.tsx`, `app/globals.css`

### Product Hamburger Stacks (Recent)
- **Purpose:** Compact product rows for stand profile page (replaces bulky tile grid)
- **File:** `components/tiles/ProductHamburgerRow.tsx`
- **Used By:** `app/market-stand/[id]/farm-profile.tsx`

---

## Quick Reference

### Common Queries

**Get products near user:**
```typescript
import { geoProductRepository } from '@/lib/repositories/geoProductRepository';
const products = await geoProductRepository.getHomeProducts({ lat, lng, zipCode, radiusKm: 250, limit: 20 });
```

**Check delivery eligibility:**
```typescript
import { checkDeliveryEligibility } from '@/app/actions/check-delivery-eligibility';
const result = await checkDeliveryEligibility({ productId, userZipCode });
```

**Add item to cart:**
```typescript
import { addToCart } from '@/app/actions/cart';
await addToCart({ productId, quantity, fulfillmentType: 'PICKUP', marketStandId });
```

### Database Migrations

**Create migration:**
```bash
npx prisma migrate dev --name add_new_field
```

**Apply to production:**
```bash
npx prisma migrate deploy
```

**Regenerate Prisma Client:**
```bash
npx prisma generate
```

### Deployment

**Vercel auto-deploys on push to main.**

**Manual deploy:**
```bash
git push origin main
```

**Environment variables:**
Set in Vercel dashboard → Settings → Environment Variables

---

## AI Assistant Notes

When starting a new session:
1. **Read this file first** to understand the codebase structure
2. **Check recent changes** in git log (`git log --oneline -20`) to see what's been worked on
3. **Ask clarifying questions** before making assumptions about business logic
4. **Test locally** before committing (especially checkout flow, delivery eligibility)
5. **Document gotchas** if you discover new ones (add to this file)

Key patterns:
- Server Actions (`'use server'`) for data fetching/mutations
- Client Components (`'use client'`) for interactivity
- PostGIS for geo queries (don't reinvent with JS distance calculations)
- Redis caching for expensive queries (5-minute TTL)
- Stripe Connect for multi-party payments (always use transfer_group)
- Supabase Auth for identity (User model is denormalized cache)

Be careful with:
- Inventory updates (three sources: Product.inventory, ProductStandListing.customInventory, ProductDeliveryListing.inventory)
- marketStandId nullability (breaks geo search if null)
- Tailwind JIT (new utility classes need globals.css entry)
- Cold start timeouts (optimize Prisma queries, avoid large imports in API routes)

---

**End of CODEBASE.md**
*This file is living documentation. Update it when making architectural changes.*
