/*
  Warnings:

  - Added the required column `updatedAt` to the `MarketStand` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- DropIndex
DROP INDEX "MarketStand_userId_key";

-- AlterTable
ALTER TABLE "MarketStand" ADD COLUMN     "averageRating" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "averageRating" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
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
    "rating" INTEGER NOT NULL,
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
    "date" TIMESTAMP(3) NOT NULL,
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
    "date" TIMESTAMP(3) NOT NULL,
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
    "deviceType" TEXT,
    "browser" TEXT,
    "ipAddress" TEXT,
    "pagesViewed" JSONB NOT NULL,

    CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductMetrics_productId_key" ON "ProductMetrics"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "StandMetrics_marketStandId_key" ON "StandMetrics"("marketStandId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEngagement_userId_key" ON "UserEngagement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorSession_sessionId_key" ON "VisitorSession"("sessionId");

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
