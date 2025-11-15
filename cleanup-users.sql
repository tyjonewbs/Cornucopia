-- Complete cleanup script - Run in Supabase SQL Editor
-- Deletes all data in correct order to avoid foreign key violations

BEGIN;

-- Delete metrics first (they reference other tables)
DELETE FROM "StandDailyMetrics";
DELETE FROM "StandMetrics";
DELETE FROM "ProductDailyMetrics";
DELETE FROM "ProductMetrics";
DELETE FROM "LocalMetrics";

-- Delete engagement and sessions
DELETE FROM "UserEngagement";
DELETE FROM "VisitorSession";

-- Delete status history
DELETE FROM "ProductStatusHistory";
DELETE FROM "StandStatusHistory";

-- Delete reviews
DELETE FROM "ProductReview";
DELETE FROM "StandReview";

-- Delete products (this should cascade to some related records)
DELETE FROM "Product";

-- Delete market stands
DELETE FROM "MarketStand";

-- Delete locals
DELETE FROM "Local";

-- Finally delete users
DELETE FROM "User";

-- Verify all tables are empty
SELECT 
  (SELECT COUNT(*) FROM "User") as users,
  (SELECT COUNT(*) FROM "MarketStand") as stands,
  (SELECT COUNT(*) FROM "Product") as products,
  (SELECT COUNT(*) FROM "Local") as locals;

COMMIT;

-- After running this, also delete users from Supabase Auth:
-- Go to Supabase Dashboard → Authentication → Users
-- Delete all users manually from the UI
