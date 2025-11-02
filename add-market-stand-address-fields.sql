-- Add address fields to MarketStand table
-- Migration: add_market_stand_address_fields

ALTER TABLE "MarketStand" 
ADD COLUMN IF NOT EXISTS "streetAddress" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "zipCode" VARCHAR(10);

-- Add comments for documentation
COMMENT ON COLUMN "MarketStand"."streetAddress" IS 'The explicit street address for display/pickup';
COMMENT ON COLUMN "MarketStand"."city" IS 'City for location context';
COMMENT ON COLUMN "MarketStand"."zipCode" IS 'Zip Code for location context and delivery zone checks';
