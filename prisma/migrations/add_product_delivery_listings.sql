-- Create ProductDeliveryListing table for managing product availability per delivery zone per day
CREATE TABLE IF NOT EXISTS "ProductDeliveryListing" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "deliveryZoneId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductDeliveryListing_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "ProductDeliveryListing" 
    ADD CONSTRAINT "ProductDeliveryListing_productId_fkey" 
    FOREIGN KEY ("productId") 
    REFERENCES "Product"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductDeliveryListing" 
    ADD CONSTRAINT "ProductDeliveryListing_deliveryZoneId_fkey" 
    FOREIGN KEY ("deliveryZoneId") 
    REFERENCES "DeliveryZone"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for efficient queries
CREATE INDEX "ProductDeliveryListing_productId_idx" ON "ProductDeliveryListing"("productId");
CREATE INDEX "ProductDeliveryListing_deliveryZoneId_idx" ON "ProductDeliveryListing"("deliveryZoneId");
CREATE INDEX "ProductDeliveryListing_dayOfWeek_idx" ON "ProductDeliveryListing"("dayOfWeek");

-- Composite index for common query pattern (get all products for a specific day and zone)
CREATE INDEX "ProductDeliveryListing_dayOfWeek_deliveryZoneId_idx" 
    ON "ProductDeliveryListing"("dayOfWeek", "deliveryZoneId");

-- Unique constraint to prevent duplicate listings (one product can't be listed twice for same zone on same day)
CREATE UNIQUE INDEX "ProductDeliveryListing_productId_deliveryZoneId_dayOfWeek_key" 
    ON "ProductDeliveryListing"("productId", "deliveryZoneId", "dayOfWeek");

-- Add check constraint for valid days of week
ALTER TABLE "ProductDeliveryListing" 
    ADD CONSTRAINT "ProductDeliveryListing_dayOfWeek_check" 
    CHECK ("dayOfWeek" IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'));

-- Add check constraint for non-negative inventory
ALTER TABLE "ProductDeliveryListing" 
    ADD CONSTRAINT "ProductDeliveryListing_inventory_check" 
    CHECK ("inventory" >= 0);

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_product_delivery_listing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_delivery_listing_updated_at_trigger
    BEFORE UPDATE ON "ProductDeliveryListing"
    FOR EACH ROW
    EXECUTE FUNCTION update_product_delivery_listing_updated_at();
