-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS "product_active_inventory_idx" ON "Product" ("isActive", "inventory") WHERE "isActive" = true AND "inventory" > 0;
CREATE INDEX IF NOT EXISTS "product_updated_at_idx" ON "Product" ("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "product_market_stand_idx" ON "Product" ("marketStandId");
CREATE INDEX IF NOT EXISTS "product_user_idx" ON "Product" ("userId");

-- Add indexes for market stand location queries
CREATE INDEX IF NOT EXISTS "market_stand_location_idx" ON "MarketStand" ("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "market_stand_active_idx" ON "MarketStand" ("isActive") WHERE "isActive" = true;

-- Add indexes for user queries
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "user_stripe_idx" ON "User" ("connectedAccountId") WHERE "connectedAccountId" IS NOT NULL;

-- Add indexes for reviews and metrics
CREATE INDEX IF NOT EXISTS "product_review_product_idx" ON "ProductReview" ("productId", "isVisible");
CREATE INDEX IF NOT EXISTS "stand_review_stand_idx" ON "StandReview" ("marketStandId", "isVisible");
CREATE INDEX IF NOT EXISTS "product_metrics_product_idx" ON "ProductMetrics" ("productId");
CREATE INDEX IF NOT EXISTS "stand_metrics_stand_idx" ON "StandMetrics" ("marketStandId");
