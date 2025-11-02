-- Create listings for existing products that have marketStandId
-- This migrates the old single-stand model to the new cross-listing model

INSERT INTO "ProductStandListing" (
  "id",
  "productId", 
  "marketStandId",
  "isActive",
  "isPrimary",
  "customInventory",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  p.id,
  p."marketStandId",
  p."isActive",
  true, -- Set as primary listing
  p.inventory, -- Migrate inventory to listing
  p."createdAt",
  NOW()
FROM "Product" p
WHERE p."marketStandId" IS NOT NULL
ON CONFLICT ("productId", "marketStandId") DO NOTHING;

-- Note: We keep Product.marketStandId for backwards compatibility
-- It can be deprecated and removed in a future migration
