-- Migration: Add Delivery System Support
-- This migration adds support for delivery-only products and flexible product-stand relationships

-- Step 1: Make marketStandId optional on Product table
-- First, we need to drop the foreign key constraint
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_marketStandId_fkey";

-- Drop the NOT NULL constraint
ALTER TABLE "Product" ALTER COLUMN "marketStandId" DROP NOT NULL;

-- Recreate the foreign key with ON DELETE SET NULL instead of CASCADE
ALTER TABLE "Product" 
  ADD CONSTRAINT "Product_marketStandId_fkey" 
  FOREIGN KEY ("marketStandId") 
  REFERENCES "MarketStand"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Step 2: Create DeliveryZone table
CREATE TABLE "DeliveryZone" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "zipCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "states" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "deliveryFee" INTEGER NOT NULL DEFAULT 0,
  "freeDeliveryThreshold" INTEGER,
  "minimumOrder" INTEGER,
  "deliveryDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "deliveryTimeWindows" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create ProductStandListing table for many-to-many relationships
CREATE TABLE "ProductStandListing" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "marketStandId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "customPrice" INTEGER,
  "customInventory" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductStandListing_pkey" PRIMARY KEY ("id")
);

-- Step 4: Add delivery-related fields to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deliveryZoneId" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableDate" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableUntil" TIMESTAMP(3);

-- Step 5: Create foreign key constraints
ALTER TABLE "DeliveryZone"
  ADD CONSTRAINT "DeliveryZone_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "ProductStandListing"
  ADD CONSTRAINT "ProductStandListing_productId_fkey"
  FOREIGN KEY ("productId")
  REFERENCES "Product"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "ProductStandListing"
  ADD CONSTRAINT "ProductStandListing_marketStandId_fkey"
  FOREIGN KEY ("marketStandId")
  REFERENCES "MarketStand"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_deliveryZoneId_fkey"
  FOREIGN KEY ("deliveryZoneId")
  REFERENCES "DeliveryZone"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Step 6: Create indexes for performance
CREATE INDEX "DeliveryZone_userId_idx" ON "DeliveryZone"("userId");
CREATE INDEX "DeliveryZone_isActive_idx" ON "DeliveryZone"("isActive");

CREATE INDEX "ProductStandListing_productId_idx" ON "ProductStandListing"("productId");
CREATE INDEX "ProductStandListing_marketStandId_idx" ON "ProductStandListing"("marketStandId");
CREATE INDEX "ProductStandListing_isActive_idx" ON "ProductStandListing"("isActive");

CREATE INDEX "Product_deliveryZoneId_idx" ON "Product"("deliveryZoneId");
CREATE INDEX "Product_deliveryAvailable_idx" ON "Product"("deliveryAvailable");
CREATE INDEX "Product_availableDate_idx" ON "Product"("availableDate");
CREATE INDEX "Product_isActive_availableDate_idx" ON "Product"("isActive", "availableDate");

-- Step 7: Create unique constraint to prevent duplicate listings
CREATE UNIQUE INDEX "ProductStandListing_productId_marketStandId_key" 
  ON "ProductStandListing"("productId", "marketStandId");

-- Step 8: Migrate existing products to ProductStandListing
-- This creates a ProductStandListing entry for each existing product that has a marketStandId
INSERT INTO "ProductStandListing" ("id", "productId", "marketStandId", "isActive", "isPrimary", "createdAt", "updatedAt")
SELECT 
  extensions.uuid_generate_v4()::text as "id",
  "id" as "productId",
  "marketStandId",
  true as "isActive",
  true as "isPrimary",
  CURRENT_TIMESTAMP as "createdAt",
  CURRENT_TIMESTAMP as "updatedAt"
FROM "Product"
WHERE "marketStandId" IS NOT NULL;

-- Step 9: Add comment for documentation
COMMENT ON TABLE "DeliveryZone" IS 'Defines delivery zones for producers, including areas covered, fees, and schedules';
COMMENT ON TABLE "ProductStandListing" IS 'Many-to-many relationship allowing products to be listed in multiple market stands';
COMMENT ON COLUMN "Product"."deliveryAvailable" IS 'Whether this product is available for delivery';
COMMENT ON COLUMN "Product"."deliveryZoneId" IS 'Default delivery zone for this product';
COMMENT ON COLUMN "Product"."marketStandId" IS 'Primary market stand (nullable for delivery-only products)';
COMMENT ON COLUMN "Product"."availableDate" IS 'When product becomes available for purchase (null = available now)';
COMMENT ON COLUMN "Product"."availableUntil" IS 'When product stops being available (null = no end date)';
