-- Create index for inventory queries
CREATE INDEX IF NOT EXISTS "product_inventory_idx" ON "Product" ("inventory", "isActive", "updatedAt" DESC);

-- Add comment explaining the purpose of this index
COMMENT ON INDEX "product_inventory_idx" IS 'Improves performance of queries filtering by inventory and active status';
