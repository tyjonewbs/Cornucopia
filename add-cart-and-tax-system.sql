-- Migration: Add Cart System and Tax Compliance
-- Description: Adds Cart, CartItem models and TaxCode to Product model
-- Date: November 4, 2025

-- Step 1: Add TaxCode enum
DO $$ BEGIN
  CREATE TYPE "TaxCode" AS ENUM ('RAW_FOOD', 'PREPARED_FOOD', 'NON_FOOD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add tax fields to Product table
ALTER TABLE "Product" 
  ADD COLUMN IF NOT EXISTS "taxCode" "TaxCode" NOT NULL DEFAULT 'RAW_FOOD',
  ADD COLUMN IF NOT EXISTS "taxable" BOOLEAN NOT NULL DEFAULT false;

-- Step 3: Update existing products to set taxable flag based on taxCode
UPDATE "Product" 
SET "taxable" = ("taxCode" != 'RAW_FOOD')
WHERE "taxable" = false;

-- Step 4: Create Cart table
CREATE TABLE IF NOT EXISTS "Cart" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 5: Create indexes for Cart
CREATE INDEX IF NOT EXISTS "Cart_userId_idx" ON "Cart"("userId");

-- Step 6: Create CartItem table
CREATE TABLE IF NOT EXISTS "CartItem" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "cartId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  "fulfillmentType" TEXT NOT NULL,
  "deliveryDate" TIMESTAMP(3),
  "deliveryZoneId" TEXT,
  "marketStandId" TEXT,
  "pickupTime" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CartItem_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CartItem_marketStandId_fkey" FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Step 7: Create unique constraint for CartItem (prevent duplicate cart entries)
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_unique" 
  ON "CartItem"("cartId", "productId", "deliveryDate", "pickupTime");

-- Step 8: Create indexes for CartItem
CREATE INDEX IF NOT EXISTS "CartItem_cartId_idx" ON "CartItem"("cartId");
CREATE INDEX IF NOT EXISTS "CartItem_productId_idx" ON "CartItem"("productId");

-- Step 9: Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'Cart') THEN
    RAISE NOTICE 'Cart table created successfully';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'CartItem') THEN
    RAISE NOTICE 'CartItem table created successfully';
  END IF;
  
  IF EXISTS (SELECT FROM pg_type WHERE typname = 'TaxCode') THEN
    RAISE NOTICE 'TaxCode enum created successfully';
  END IF;
END $$;

-- Step 10: Display summary
SELECT 
  'Migration completed successfully!' as status,
  (SELECT COUNT(*) FROM "Cart") as carts_created,
  (SELECT COUNT(*) FROM "CartItem") as cart_items_created,
  (SELECT COUNT(*) FROM "Product" WHERE "taxCode" IS NOT NULL) as products_with_tax_code;
