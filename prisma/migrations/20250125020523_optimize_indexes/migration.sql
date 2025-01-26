/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "MarketStand_latitude_longitude_idx" ON "MarketStand"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "MarketStand_isActive_idx" ON "MarketStand"("isActive");

-- CreateIndex
CREATE INDEX "MarketStand_userId_idx" ON "MarketStand"("userId");

-- CreateIndex
CREATE INDEX "MarketStand_status_isActive_idx" ON "MarketStand"("status", "isActive");

-- CreateIndex
CREATE INDEX "MarketStand_createdAt_idx" ON "MarketStand"("createdAt");

-- CreateIndex
CREATE INDEX "MarketStand_updatedAt_idx" ON "MarketStand"("updatedAt");

-- CreateIndex
CREATE INDEX "MarketStand_isActive_updatedAt_idx" ON "MarketStand"("isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "Product_isActive_updatedAt_idx" ON "Product"("isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "Product_marketStandId_isActive_idx" ON "Product"("marketStandId", "isActive");

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "Product"("userId");

-- CreateIndex
CREATE INDEX "Product_status_isActive_idx" ON "Product"("status", "isActive");

-- CreateIndex
CREATE INDEX "Product_inventory_isActive_idx" ON "Product"("inventory", "isActive");

-- CreateIndex
CREATE INDEX "Product_price_isActive_idx" ON "Product"("price", "isActive");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "Product_inventoryUpdatedAt_idx" ON "Product"("inventoryUpdatedAt");

-- CreateIndex
CREATE INDEX "ProductDailyMetrics_productMetricId_date_idx" ON "ProductDailyMetrics"("productMetricId", "date");

-- CreateIndex
CREATE INDEX "ProductDailyMetrics_date_idx" ON "ProductDailyMetrics"("date");

-- CreateIndex
CREATE INDEX "ProductMetrics_views_idx" ON "ProductMetrics"("views");

-- CreateIndex
CREATE INDEX "ProductMetrics_purchases_idx" ON "ProductMetrics"("purchases");

-- CreateIndex
CREATE INDEX "ProductMetrics_revenue_idx" ON "ProductMetrics"("revenue");

-- CreateIndex
CREATE INDEX "ProductReview_productId_isVisible_idx" ON "ProductReview"("productId", "isVisible");

-- CreateIndex
CREATE INDEX "ProductReview_userId_isVisible_idx" ON "ProductReview"("userId", "isVisible");

-- CreateIndex
CREATE INDEX "ProductReview_rating_idx" ON "ProductReview"("rating");

-- CreateIndex
CREATE INDEX "ProductReview_helpfulVotes_idx" ON "ProductReview"("helpfulVotes");

-- CreateIndex
CREATE INDEX "ProductStatusHistory_productId_createdAt_idx" ON "ProductStatusHistory"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductStatusHistory_changedById_idx" ON "ProductStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "StandDailyMetrics_standMetricId_date_idx" ON "StandDailyMetrics"("standMetricId", "date");

-- CreateIndex
CREATE INDEX "StandDailyMetrics_date_idx" ON "StandDailyMetrics"("date");

-- CreateIndex
CREATE INDEX "StandMetrics_totalViews_idx" ON "StandMetrics"("totalViews");

-- CreateIndex
CREATE INDEX "StandMetrics_totalOrders_idx" ON "StandMetrics"("totalOrders");

-- CreateIndex
CREATE INDEX "StandMetrics_totalRevenue_idx" ON "StandMetrics"("totalRevenue");

-- CreateIndex
CREATE INDEX "StandReview_marketStandId_isVisible_idx" ON "StandReview"("marketStandId", "isVisible");

-- CreateIndex
CREATE INDEX "StandReview_userId_isVisible_idx" ON "StandReview"("userId", "isVisible");

-- CreateIndex
CREATE INDEX "StandReview_rating_idx" ON "StandReview"("rating");

-- CreateIndex
CREATE INDEX "StandReview_helpfulVotes_idx" ON "StandReview"("helpfulVotes");

-- CreateIndex
CREATE INDEX "StandStatusHistory_marketStandId_createdAt_idx" ON "StandStatusHistory"("marketStandId", "createdAt");

-- CreateIndex
CREATE INDEX "StandStatusHistory_changedById_idx" ON "StandStatusHistory"("changedById");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_stripeConnectedLinked_idx" ON "User"("stripeConnectedLinked");

-- CreateIndex
CREATE INDEX "UserEngagement_lastVisit_idx" ON "UserEngagement"("lastVisit");

-- CreateIndex
CREATE INDEX "UserEngagement_totalPurchases_idx" ON "UserEngagement"("totalPurchases");

-- CreateIndex
CREATE INDEX "UserEngagement_totalSpent_idx" ON "UserEngagement"("totalSpent");

-- CreateIndex
CREATE INDEX "VisitorSession_userId_startTime_idx" ON "VisitorSession"("userId", "startTime");

-- CreateIndex
CREATE INDEX "VisitorSession_startTime_idx" ON "VisitorSession"("startTime");

-- CreateIndex
CREATE INDEX "VisitorSession_endTime_idx" ON "VisitorSession"("endTime");
