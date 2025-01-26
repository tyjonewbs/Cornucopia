-- DropIndex
DROP INDEX "MarketStand_createdAt_idx";

-- DropIndex
DROP INDEX "MarketStand_isActive_idx";

-- DropIndex
DROP INDEX "MarketStand_isActive_updatedAt_idx";

-- DropIndex
DROP INDEX "MarketStand_latitude_longitude_idx";

-- DropIndex
DROP INDEX "MarketStand_status_isActive_idx";

-- DropIndex
DROP INDEX "MarketStand_updatedAt_idx";

-- DropIndex
DROP INDEX "Product_createdAt_idx";

-- DropIndex
DROP INDEX "Product_inventoryUpdatedAt_idx";

-- DropIndex
DROP INDEX "Product_inventory_isActive_idx";

-- DropIndex
DROP INDEX "Product_isActive_updatedAt_idx";

-- DropIndex
DROP INDEX "Product_marketStandId_isActive_idx";

-- DropIndex
DROP INDEX "Product_price_isActive_idx";

-- DropIndex
DROP INDEX "Product_status_isActive_idx";

-- DropIndex
DROP INDEX "product_inventory_idx";

-- DropIndex
DROP INDEX "ProductDailyMetrics_productMetricId_date_idx";

-- DropIndex
DROP INDEX "ProductMetrics_purchases_idx";

-- DropIndex
DROP INDEX "ProductMetrics_revenue_idx";

-- DropIndex
DROP INDEX "ProductMetrics_views_idx";

-- DropIndex
DROP INDEX "ProductReview_helpfulVotes_idx";

-- DropIndex
DROP INDEX "ProductReview_productId_isVisible_idx";

-- DropIndex
DROP INDEX "ProductReview_rating_idx";

-- DropIndex
DROP INDEX "ProductReview_userId_isVisible_idx";

-- DropIndex
DROP INDEX "ProductStatusHistory_productId_createdAt_idx";

-- DropIndex
DROP INDEX "StandDailyMetrics_standMetricId_date_idx";

-- DropIndex
DROP INDEX "StandMetrics_totalOrders_idx";

-- DropIndex
DROP INDEX "StandMetrics_totalRevenue_idx";

-- DropIndex
DROP INDEX "StandMetrics_totalViews_idx";

-- DropIndex
DROP INDEX "StandReview_helpfulVotes_idx";

-- DropIndex
DROP INDEX "StandReview_marketStandId_isVisible_idx";

-- DropIndex
DROP INDEX "StandReview_rating_idx";

-- DropIndex
DROP INDEX "StandReview_userId_isVisible_idx";

-- DropIndex
DROP INDEX "StandStatusHistory_marketStandId_createdAt_idx";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_stripeConnectedLinked_idx";

-- DropIndex
DROP INDEX "UserEngagement_lastVisit_idx";

-- DropIndex
DROP INDEX "UserEngagement_totalPurchases_idx";

-- DropIndex
DROP INDEX "UserEngagement_totalSpent_idx";

-- DropIndex
DROP INDEX "VisitorSession_endTime_idx";

-- DropIndex
DROP INDEX "VisitorSession_userId_startTime_idx";

-- CreateIndex
CREATE INDEX "ProductDailyMetrics_productMetricId_idx" ON "ProductDailyMetrics"("productMetricId");

-- CreateIndex
CREATE INDEX "ProductMetrics_productId_idx" ON "ProductMetrics"("productId");

-- CreateIndex
CREATE INDEX "ProductReview_productId_idx" ON "ProductReview"("productId");

-- CreateIndex
CREATE INDEX "ProductReview_userId_idx" ON "ProductReview"("userId");

-- CreateIndex
CREATE INDEX "ProductStatusHistory_productId_idx" ON "ProductStatusHistory"("productId");

-- CreateIndex
CREATE INDEX "StandDailyMetrics_standMetricId_idx" ON "StandDailyMetrics"("standMetricId");

-- CreateIndex
CREATE INDEX "StandMetrics_marketStandId_idx" ON "StandMetrics"("marketStandId");

-- CreateIndex
CREATE INDEX "StandReview_marketStandId_idx" ON "StandReview"("marketStandId");

-- CreateIndex
CREATE INDEX "StandReview_userId_idx" ON "StandReview"("userId");

-- CreateIndex
CREATE INDEX "StandStatusHistory_marketStandId_idx" ON "StandStatusHistory"("marketStandId");

-- CreateIndex
CREATE INDEX "UserEngagement_userId_idx" ON "UserEngagement"("userId");

-- CreateIndex
CREATE INDEX "VisitorSession_userId_idx" ON "VisitorSession"("userId");

-- CreateIndex
CREATE INDEX "VisitorSession_sessionId_idx" ON "VisitorSession"("sessionId");
