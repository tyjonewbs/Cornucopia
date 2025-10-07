-- Add composite indexes for optimized query performance
-- These indexes target common query patterns identified during the performance audit

-- Product composite indexes for frequently used filter combinations
CREATE INDEX IF NOT EXISTS "product_status_active_idx" ON "Product"("status", "isActive", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "product_stand_status_idx" ON "Product"("marketStandId", "status", "isActive");
CREATE INDEX IF NOT EXISTS "product_user_status_idx" ON "Product"("userId", "status", "isActive");

-- Market stand composite indexes for location and status queries
CREATE INDEX IF NOT EXISTS "market_stand_status_active_idx" ON "MarketStand"("status", "isActive", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "market_stand_location_active_idx" ON "MarketStand"("isActive", "latitude", "longitude");

-- Review indexes for filtering visible reviews and sorting
CREATE INDEX IF NOT EXISTS "product_review_visible_created_idx" ON "ProductReview"("isVisible", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "stand_review_visible_created_idx" ON "StandReview"("isVisible", "createdAt" DESC);

-- User engagement indexes for analytics queries
CREATE INDEX IF NOT EXISTS "user_engagement_last_visit_idx" ON "UserEngagement"("lastVisit" DESC);

-- Session indexes for analytics
CREATE INDEX IF NOT EXISTS "visitor_session_start_idx" ON "VisitorSession"("startTime" DESC);

-- Metrics indexes for analytics queries
CREATE INDEX IF NOT EXISTS "product_metrics_revenue_idx" ON "ProductMetrics"("revenue" DESC);
CREATE INDEX IF NOT EXISTS "stand_metrics_revenue_idx" ON "StandMetrics"("totalRevenue" DESC);

-- Daily metrics indexes for date-based queries
CREATE INDEX IF NOT EXISTS "product_daily_date_idx" ON "ProductDailyMetrics"("date" DESC);
CREATE INDEX IF NOT EXISTS "stand_daily_date_idx" ON "StandDailyMetrics"("date" DESC);
