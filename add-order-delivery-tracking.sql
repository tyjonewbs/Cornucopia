-- Add delivery tracking fields to Order table
-- This enables tracking which delivery zone and date each order is for

-- Add columns
ALTER TABLE "Order"
ADD COLUMN "deliveryZoneId" TEXT,
ADD COLUMN "deliveryDate" TIMESTAMP(3);

-- Add foreign key constraint for deliveryZoneId
ALTER TABLE "Order"
ADD CONSTRAINT "Order_deliveryZoneId_fkey"
FOREIGN KEY ("deliveryZoneId")
REFERENCES "DeliveryZone"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "Order_deliveryZoneId_idx" ON "Order"("deliveryZoneId");
CREATE INDEX "Order_deliveryDate_idx" ON "Order"("deliveryDate");
CREATE INDEX "Order_deliveryZoneId_deliveryDate_idx" ON "Order"("deliveryZoneId", "deliveryDate");

-- Add comment to explain the fields
COMMENT ON COLUMN "Order"."deliveryZoneId" IS 'The delivery zone this order is associated with (for delivery orders only)';
COMMENT ON COLUMN "Order"."deliveryDate" IS 'The scheduled delivery date for this order (for delivery orders only)';
