-- Add delivery scheduling fields to Product table
-- This migration adds support for recurring weekly deliveries and one-time scheduled deliveries

-- Create DeliveryType enum
CREATE TYPE "DeliveryType" AS ENUM ('RECURRING', 'ONE_TIME');

-- Add new columns to Product table
ALTER TABLE "Product" 
  ADD COLUMN "deliveryType" "DeliveryType",
  ADD COLUMN "deliverySchedule" JSONB,
  ADD COLUMN "deliveryDates" TIMESTAMP(3)[];

-- Add index for deliveryType
CREATE INDEX "Product_deliveryType_idx" ON "Product"("deliveryType");

-- Add comment explaining the fields
COMMENT ON COLUMN "Product"."deliveryType" IS 'Type of delivery: RECURRING for weekly schedules, ONE_TIME for specific dates';
COMMENT ON COLUMN "Product"."deliverySchedule" IS 'JSON object with weekly schedule for RECURRING delivery type. Format: {"Monday": {"enabled": true, "inventory": 20}, ...}';
COMMENT ON COLUMN "Product"."deliveryDates" IS 'Array of specific dates for ONE_TIME delivery type';
