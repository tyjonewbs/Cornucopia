-- Cleanup script for removing all "Test Stand" market stands and their related data
-- This script will remove all test market stands named "Test Stand" along with:
-- - Products associated with these stands
-- - All product metrics and daily metrics
-- - All product reviews and status history
-- - All stand metrics and daily metrics
-- - All stand reviews and status history

BEGIN;

-- First, let's see what we're about to delete
SELECT 'Market Stands to delete:' as info, COUNT(*) as count 
FROM "MarketStand" 
WHERE name = 'Test Stand';

SELECT 'Products to delete:' as info, COUNT(*) as count 
FROM "Product" 
WHERE "marketStandId" IN (
    SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
);

SELECT 'Stand Reviews to delete:' as info, COUNT(*) as count 
FROM "StandReview" 
WHERE "marketStandId" IN (
    SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
);

SELECT 'Product Reviews to delete:' as info, COUNT(*) as count 
FROM "ProductReview" 
WHERE "productId" IN (
    SELECT id FROM "Product" 
    WHERE "marketStandId" IN (
        SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
    )
);

-- Store the IDs we're going to delete for reference
CREATE TEMP TABLE temp_test_stand_ids AS
SELECT id FROM "MarketStand" WHERE name = 'Test Stand';

CREATE TEMP TABLE temp_test_product_ids AS
SELECT id FROM "Product" 
WHERE "marketStandId" IN (SELECT id FROM temp_test_stand_ids);

-- Delete in proper order to respect foreign key constraints

-- 1. Delete ProductDailyMetrics (child of ProductMetrics)
DELETE FROM "ProductDailyMetrics"
WHERE "productMetricId" IN (
    SELECT id FROM "ProductMetrics"
    WHERE "productId" IN (SELECT id FROM temp_test_product_ids)
);

-- 2. Delete ProductMetrics
DELETE FROM "ProductMetrics"
WHERE "productId" IN (SELECT id FROM temp_test_product_ids);

-- 3. Delete ProductReviews
DELETE FROM "ProductReview"
WHERE "productId" IN (SELECT id FROM temp_test_product_ids);

-- 4. Delete ProductStatusHistory
DELETE FROM "ProductStatusHistory"
WHERE "productId" IN (SELECT id FROM temp_test_product_ids);

-- 5. Delete Products
DELETE FROM "Product"
WHERE id IN (SELECT id FROM temp_test_product_ids);

-- 6. Delete StandDailyMetrics (child of StandMetrics)
DELETE FROM "StandDailyMetrics"
WHERE "standMetricId" IN (
    SELECT id FROM "StandMetrics"
    WHERE "marketStandId" IN (SELECT id FROM temp_test_stand_ids)
);

-- 7. Delete StandMetrics
DELETE FROM "StandMetrics"
WHERE "marketStandId" IN (SELECT id FROM temp_test_stand_ids);

-- 8. Delete StandReviews
DELETE FROM "StandReview"
WHERE "marketStandId" IN (SELECT id FROM temp_test_stand_ids);

-- 9. Delete StandStatusHistory
DELETE FROM "StandStatusHistory"
WHERE "marketStandId" IN (SELECT id FROM temp_test_stand_ids);

-- 10. Finally, delete the MarketStands themselves
DELETE FROM "MarketStand"
WHERE id IN (SELECT id FROM temp_test_stand_ids);

-- Clean up temp tables
DROP TABLE temp_test_product_ids;
DROP TABLE temp_test_stand_ids;

-- Verify deletion
SELECT 'Remaining Test Stands:' as info, COUNT(*) as count 
FROM "MarketStand" 
WHERE name = 'Test Stand';

SELECT 'Remaining products from Test Stands:' as info, COUNT(*) as count 
FROM "Product" 
WHERE "marketStandId" IN (
    SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
);

COMMIT;

-- If you want to rollback instead of committing, use:
-- ROLLBACK;
