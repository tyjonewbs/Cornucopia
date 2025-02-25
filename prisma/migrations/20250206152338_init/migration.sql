-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "profileImage" TEXT NOT NULL,
    "connectedAccountId" VARCHAR(100),
    "stripeConnectedLinked" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketStand" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "images" TEXT[],
    "tags" VARCHAR(50)[],
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" VARCHAR(255) NOT NULL,
    "locationGuide" TEXT NOT NULL,
    "website" TEXT,
    "socialMedia" TEXT[],
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "averageRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarketStand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "tags" VARCHAR(50)[],
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "inventoryUpdatedAt" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "marketStandId" TEXT NOT NULL,
    "localId" TEXT,
    "averageRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT NOT NULL,
    "images" TEXT[],
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandReview" (
    "id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT NOT NULL,
    "images" TEXT[],
    "isVerifiedCustomer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "marketStandId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StandReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStatusHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "oldStatus" "Status" NOT NULL,
    "newStatus" "Status" NOT NULL,
    "changedById" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandStatusHistory" (
    "id" TEXT NOT NULL,
    "marketStandId" TEXT NOT NULL,
    "oldStatus" "Status" NOT NULL,
    "newStatus" "Status" NOT NULL,
    "changedById" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMetrics" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "addedToCart" INTEGER NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "revenue" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION,

    CONSTRAINT "ProductMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDailyMetrics" (
    "id" TEXT NOT NULL,
    "productMetricId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "addedToCart" INTEGER NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "revenue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductDailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandMetrics" (
    "id" TEXT NOT NULL,
    "marketStandId" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "averageOrderValue" DOUBLE PRECISION,
    "returningCustomers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StandMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandDailyMetrics" (
    "id" TEXT NOT NULL,
    "standMetricId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "revenue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StandDailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEngagement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastVisit" TIMESTAMP(3) NOT NULL,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "totalPurchases" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "favoriteStands" TEXT[],
    "searchHistory" TEXT[],
    "categoryViews" JSONB NOT NULL,

    CONSTRAINT "UserEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "deviceType" VARCHAR(50),
    "browser" VARCHAR(50),
    "ipAddress" VARCHAR(45),
    "pagesViewed" JSONB NOT NULL,

    CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Local" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "images" TEXT[],
    "farmingPractices" TEXT NOT NULL,
    "teamMembers" JSONB NOT NULL,
    "certifications" JSONB NOT NULL,
    "seasonalSchedule" JSONB NOT NULL,
    "events" JSONB NOT NULL,
    "operatingHours" JSONB NOT NULL,
    "wholesaleInfo" TEXT,
    "contactForm" BOOLEAN NOT NULL DEFAULT true,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" VARCHAR(255) NOT NULL,
    "locationGuide" TEXT NOT NULL,
    "website" TEXT,
    "socialMedia" TEXT[],
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Local_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalMetrics" (
    "id" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "contactFormSubmissions" INTEGER NOT NULL DEFAULT 0,
    "productViews" INTEGER NOT NULL DEFAULT 0,
    "eventSignups" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LocalMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "user_stripe_idx" ON "User"("connectedAccountId");

-- CreateIndex
CREATE INDEX "market_stand_location_idx" ON "MarketStand"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "market_stand_active_idx" ON "MarketStand"("isActive");

-- CreateIndex
CREATE INDEX "MarketStand_userId_idx" ON "MarketStand"("userId");

-- CreateIndex
CREATE INDEX "product_active_inventory_idx" ON "Product"("isActive", "inventory");

-- CreateIndex
CREATE INDEX "product_updated_at_idx" ON "Product"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "product_market_stand_idx" ON "Product"("marketStandId");

-- CreateIndex
CREATE INDEX "product_local_idx" ON "Product"("localId");

-- CreateIndex
CREATE INDEX "product_user_idx" ON "Product"("userId");

-- CreateIndex
CREATE INDEX "product_review_product_idx" ON "ProductReview"("productId", "isVisible");

-- CreateIndex
CREATE INDEX "ProductReview_userId_idx" ON "ProductReview"("userId");

-- CreateIndex
CREATE INDEX "stand_review_stand_idx" ON "StandReview"("marketStandId", "isVisible");

-- CreateIndex
CREATE INDEX "StandReview_userId_idx" ON "StandReview"("userId");

-- CreateIndex
CREATE INDEX "ProductStatusHistory_productId_idx" ON "ProductStatusHistory"("productId");

-- CreateIndex
CREATE INDEX "ProductStatusHistory_changedById_idx" ON "ProductStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "StandStatusHistory_marketStandId_idx" ON "StandStatusHistory"("marketStandId");

-- CreateIndex
CREATE INDEX "StandStatusHistory_changedById_idx" ON "StandStatusHistory"("changedById");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMetrics_productId_key" ON "ProductMetrics"("productId");

-- CreateIndex
CREATE INDEX "product_metrics_product_idx" ON "ProductMetrics"("productId");

-- CreateIndex
CREATE INDEX "ProductDailyMetrics_productMetricId_date_idx" ON "ProductDailyMetrics"("productMetricId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StandMetrics_marketStandId_key" ON "StandMetrics"("marketStandId");

-- CreateIndex
CREATE INDEX "stand_metrics_stand_idx" ON "StandMetrics"("marketStandId");

-- CreateIndex
CREATE INDEX "StandDailyMetrics_standMetricId_date_idx" ON "StandDailyMetrics"("standMetricId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserEngagement_userId_key" ON "UserEngagement"("userId");

-- CreateIndex
CREATE INDEX "UserEngagement_userId_idx" ON "UserEngagement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorSession_sessionId_key" ON "VisitorSession"("sessionId");

-- CreateIndex
CREATE INDEX "VisitorSession_userId_idx" ON "VisitorSession"("userId");

-- CreateIndex
CREATE INDEX "VisitorSession_sessionId_idx" ON "VisitorSession"("sessionId");

-- CreateIndex
CREATE INDEX "local_location_idx" ON "Local"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "local_active_idx" ON "Local"("isActive");

-- CreateIndex
CREATE INDEX "local_user_idx" ON "Local"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalMetrics_localId_key" ON "LocalMetrics"("localId");

-- CreateIndex
CREATE INDEX "local_metrics_local_idx" ON "LocalMetrics"("localId");

-- AddForeignKey
ALTER TABLE "MarketStand" ADD CONSTRAINT "MarketStand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_marketStandId_fkey" FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandReview" ADD CONSTRAINT "StandReview_marketStandId_fkey" FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandReview" ADD CONSTRAINT "StandReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStatusHistory" ADD CONSTRAINT "ProductStatusHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStatusHistory" ADD CONSTRAINT "ProductStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandStatusHistory" ADD CONSTRAINT "StandStatusHistory_marketStandId_fkey" FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandStatusHistory" ADD CONSTRAINT "StandStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMetrics" ADD CONSTRAINT "ProductMetrics_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDailyMetrics" ADD CONSTRAINT "ProductDailyMetrics_productMetricId_fkey" FOREIGN KEY ("productMetricId") REFERENCES "ProductMetrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandMetrics" ADD CONSTRAINT "StandMetrics_marketStandId_fkey" FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandDailyMetrics" ADD CONSTRAINT "StandDailyMetrics_standMetricId_fkey" FOREIGN KEY ("standMetricId") REFERENCES "StandMetrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEngagement" ADD CONSTRAINT "UserEngagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorSession" ADD CONSTRAINT "VisitorSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Local" ADD CONSTRAINT "Local_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalMetrics" ADD CONSTRAINT "LocalMetrics_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
