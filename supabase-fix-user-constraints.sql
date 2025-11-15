-- ============================================================================
-- Fix User Foreign Key Constraints for Testing
-- ============================================================================
-- This script adds ON DELETE CASCADE to User foreign keys so you can easily
-- delete users for testing the profile completion flow
--
-- IMPORTANT: Run this in your Supabase SQL Editor
-- ============================================================================

BEGIN;

-- Drop existing foreign key constraints and recreate with CASCADE
-- This allows deleting users without orphaning related records

-- MarketStand
ALTER TABLE "MarketStand" 
  DROP CONSTRAINT IF EXISTS "MarketStand_userId_fkey";

ALTER TABLE "MarketStand"
  ADD CONSTRAINT "MarketStand_userId_fkey" 
  FOREIGN KEY ("userId") 
  REFERENCES "User"("id") 
  ON DELETE CASCADE;

-- Product
ALTER TABLE "Product"
  DROP CONSTRAINT IF EXISTS "Product_userId_fkey";

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE;

-- ProductReview
ALTER TABLE "ProductReview"
  DROP CONSTRAINT IF EXISTS "ProductReview_userId_fkey";

ALTER TABLE "ProductReview"
  ADD CONSTRAINT "ProductReview_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE;

-- StandReview
ALTER TABLE "StandReview"
  DROP CONSTRAINT IF EXISTS "StandReview_userId_fkey";

ALTER TABLE "StandReview"
  ADD CONSTRAINT "StandReview_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE;

-- ProductStatusHistory
ALTER TABLE "ProductStatusHistory"
  DROP CONSTRAINT IF EXISTS "ProductStatusHistory_changedById_fkey";

ALTER TABLE "ProductStatusHistory"
  ADD CONSTRAINT "ProductStatusHistory_changedById_fkey"
  FOREIGN KEY ("changedById")
  REFERENCES "User"("id")
  ON DELETE CASCADE;

-- StandStatusHistory
ALTER TABLE "StandStatusHistory"
  DROP CONSTRAINT IF EXISTS "StandStatusHistory_changedById_fkey";

ALTER TABLE "StandStatusHistory"
  ADD CONSTRAINT "StandStatusHistory_changedById_fkey"
  FOREIGN KEY ("changedById")
  REFERENCES "User"("id")
  ON DELETE CASCADE;

-- UserEngagement
ALTER TABLE "UserEngagement"
  DROP CONSTRAINT IF EXISTS "UserEngagement_userId_fkey";

ALTER TABLE "UserEngagement"
  ADD CONSTRAINT "UserEngagement_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE;

-- VisitorSession
ALTER TABLE "VisitorSession"
  DROP CONSTRAINT IF EXISTS "VisitorSession_userId_fkey";

ALTER TABLE "VisitorSession"
  ADD CONSTRAINT "VisitorSession_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE SET NULL;  -- SET NULL for sessions, they can exist without users

-- Local
ALTER TABLE "Local"
  DROP CONSTRAINT IF EXISTS "Local_userId_fkey";

ALTER TABLE "Local"
  ADD CONSTRAINT "Local_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE;

COMMIT;

-- ============================================================================
-- Verification and Helper Queries
-- ============================================================================

-- Verify cascade constraints are in place
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE ccu.table_name = 'User'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- ============================================================================
-- Optional: Reset YOUR profile to test profile completion
-- ============================================================================
-- Uncomment and replace YOUR_EMAIL to reset just your profile:
--
-- UPDATE "User" 
-- SET 
--   "username" = NULL,
--   "profileComplete" = false,
--   "usernameLastChanged" = NULL
-- WHERE email = 'YOUR_EMAIL_HERE';
--
-- Then sign out and sign back in to test the profile completion flow!

-- ============================================================================
-- Optional: Delete YOUR user completely to test fresh signup
-- ============================================================================
-- Uncomment and replace YOUR_EMAIL to delete your user (will cascade delete all related data):
--
-- DELETE FROM "User" WHERE email = 'YOUR_EMAIL_HERE';
--
-- WARNING: This will delete all your market stands, products, reviews, etc.
-- Only use for testing!
