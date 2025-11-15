-- AlterTable: Add new profile fields to User table
-- These fields enable username-based anonymization and location tracking

-- Add username field (nullable for existing users, unique constraint)
ALTER TABLE "User" ADD COLUMN "username" VARCHAR(30);

-- Add optional name fields (make existing required fields nullable)
ALTER TABLE "User" ALTER COLUMN "firstName" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "profileImage" DROP NOT NULL;

-- Add location fields for push notifications
ALTER TABLE "User" ADD COLUMN "city" VARCHAR(100);
ALTER TABLE "User" ADD COLUMN "state" VARCHAR(50);
ALTER TABLE "User" ADD COLUMN "zipCode" VARCHAR(10);

-- Add tracking fields
ALTER TABLE "User" ADD COLUMN "profileComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "usernameLastChanged" TIMESTAMP(3);

-- Create unique constraint on username
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Create indexes for performance
CREATE INDEX "user_username_idx" ON "User"("username");
CREATE INDEX "user_username_changed_idx" ON "User"("usernameLastChanged");
