-- Create indexes for geospatial queries and common filters
CREATE INDEX IF NOT EXISTS "product_active_updated_idx" ON "Product" ("isActive", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "market_stand_active_location_idx" ON "MarketStand" ("isActive", "latitude", "longitude");
CREATE INDEX IF NOT EXISTS "market_stand_product_idx" ON "Product" ("marketStandId", "isActive", "updatedAt" DESC);

-- Add comment explaining the purpose of these indexes
COMMENT ON INDEX "product_active_updated_idx" IS 'Improves performance of queries filtering by isActive and sorting by updatedAt';
COMMENT ON INDEX "market_stand_active_location_idx" IS 'Improves performance of geospatial queries on active market stands';
COMMENT ON INDEX "market_stand_product_idx" IS 'Improves performance of queries joining products with market stands';
