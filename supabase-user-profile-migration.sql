-- ============================================================================
-- User Profile Enhancement Migration
-- ============================================================================
-- This migration adds username, location data, and profile completion tracking
-- to the User table for anonymization and enhanced user profiles.
--
-- IMPORTANT: Run this in your Supabase SQL Editor
-- ============================================================================

BEGIN;

-- Step 1: Add username field (nullable for existing users, unique constraint)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" VARCHAR(30);

-- Step 2: Make existing profile fields nullable
ALTER TABLE "User" ALTER COLUMN "firstName" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "profileImage" DROP NOT NULL;

-- Step 3: Add location fields for push notifications
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" VARCHAR(100);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "state" VARCHAR(50);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "zipCode" VARCHAR(10);

-- Step 4: Add tracking fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "usernameLastChanged" TIMESTAMP(3);

-- Step 5: Create unique constraint on username (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'User_username_key'
    ) THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
    END IF;
END $$;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS "user_username_idx" ON "User"("username");
CREATE INDEX IF NOT EXISTS "user_username_changed_idx" ON "User"("usernameLastChanged");

-- Step 7: Verify changes
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'New columns added: username, city, state, zipCode, profileComplete, usernameLastChanged';
    RAISE NOTICE 'Modified columns: firstName, lastName, profileImage (now nullable)';
    RAISE NOTICE 'Indexes created: user_username_idx, user_username_changed_idx';
END $$;

COMMIT;

-- ============================================================================
-- Post-Migration Verification (Optional - Run separately to check)
-- ============================================================================
-- Uncomment and run these queries to verify the migration:
--
-- -- Check if new columns exist
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'User'
-- AND column_name IN ('username', 'city', 'state', 'zipCode', 'profileComplete', 'usernameLastChanged', 'firstName', 'lastName', 'profileImage')
-- ORDER BY column_name;
--
-- -- Check if indexes were created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'User'
-- AND indexname IN ('user_username_idx', 'user_username_changed_idx', 'User_username_key');
--
-- -- Check current user data (should all have profileComplete = false)
-- SELECT id, email, username, "profileComplete", "firstName", "lastName"
-- FROM "User"
-- LIMIT 5;
