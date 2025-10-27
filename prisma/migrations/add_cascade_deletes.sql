-- Migration: Add CASCADE DELETE behaviors to foreign key constraints
-- This migration adds ON DELETE CASCADE to foreign key constraints so that
-- when parent records are deleted, all related child records are automatically deleted.

-- Drop and recreate foreign key constraints with CASCADE DELETE

-- Product -> MarketStand (CASCADE)
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_marketStandId_fkey";
ALTER TABLE "Product" ADD CONSTRAINT "Product_marketStandId_fkey" 
  FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product -> Local (SET NULL)
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_localId_fkey";
ALTER TABLE "Product" ADD CONSTRAINT "Product_localId_fkey" 
  FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ProductReview -> Product (CASCADE)
ALTER TABLE "ProductReview" DROP CONSTRAINT IF EXISTS "ProductReview_productId_fkey";
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StandReview -> MarketStand (CASCADE)
ALTER TABLE "StandReview" DROP CONSTRAINT IF EXISTS "StandReview_marketStandId_fkey";
ALTER TABLE "StandReview" ADD CONSTRAINT "StandReview_marketStandId_fkey" 
  FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProductStatusHistory -> Product (CASCADE)
ALTER TABLE "ProductStatusHistory" DROP CONSTRAINT IF EXISTS "ProductStatusHistory_productId_fkey";
ALTER TABLE "ProductStatusHistory" ADD CONSTRAINT "ProductStatusHistory_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StandStatusHistory -> MarketStand (CASCADE)
ALTER TABLE "StandStatusHistory" DROP CONSTRAINT IF EXISTS "StandStatusHistory_marketStandId_fkey";
ALTER TABLE "StandStatusHistory" ADD CONSTRAINT "StandStatusHistory_marketStandId_fkey" 
  FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProductMetrics -> Product (CASCADE)
ALTER TABLE "ProductMetrics" DROP CONSTRAINT IF EXISTS "ProductMetrics_productId_fkey";
ALTER TABLE "ProductMetrics" ADD CONSTRAINT "ProductMetrics_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProductDailyMetrics -> ProductMetrics (CASCADE)
ALTER TABLE "ProductDailyMetrics" DROP CONSTRAINT IF EXISTS "ProductDailyMetrics_productMetricId_fkey";
ALTER TABLE "ProductDailyMetrics" ADD CONSTRAINT "ProductDailyMetrics_productMetricId_fkey" 
  FOREIGN KEY ("productMetricId") REFERENCES "ProductMetrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StandMetrics -> MarketStand (CASCADE)
ALTER TABLE "StandMetrics" DROP CONSTRAINT IF EXISTS "StandMetrics_marketStandId_fkey";
ALTER TABLE "StandMetrics" ADD CONSTRAINT "StandMetrics_marketStandId_fkey" 
  FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StandDailyMetrics -> StandMetrics (CASCADE)
ALTER TABLE "StandDailyMetrics" DROP CONSTRAINT IF EXISTS "StandDailyMetrics_standMetricId_fkey";
ALTER TABLE "StandDailyMetrics" ADD CONSTRAINT "StandDailyMetrics_standMetricId_fkey" 
  FOREIGN KEY ("standMetricId") REFERENCES "StandMetrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LocalMetrics -> Local (CASCADE)
ALTER TABLE "LocalMetrics" DROP CONSTRAINT IF EXISTS "LocalMetrics_localId_fkey";
ALTER TABLE "LocalMetrics" ADD CONSTRAINT "LocalMetrics_localId_fkey" 
  FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Verify the changes
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    confdeltype AS on_delete_action
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
  AND confdeltype IN ('c', 'n')  -- c = CASCADE, n = SET NULL
ORDER BY conrelid::regclass::text, conname;
