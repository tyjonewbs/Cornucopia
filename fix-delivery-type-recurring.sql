-- Fix existing products to set deliveryType to RECURRING
-- This will make delivery days from DeliveryZone show up for customers

-- Update all products that have delivery enabled but no deliveryType set
UPDATE "Product" 
SET "deliveryType" = 'RECURRING' 
WHERE "deliveryAvailable" = true 
  AND "deliveryType" IS NULL;

-- Verify the update
SELECT 
  id,
  name,
  "deliveryAvailable",
  "deliveryType",
  "deliveryZoneId"
FROM "Product"
WHERE "deliveryAvailable" = true
ORDER BY "updatedAt" DESC
LIMIT 10;
