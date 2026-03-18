-- Add adminTags column to Product table
-- These are admin-assigned freshness/incentive badges (e.g., "fresh-today", "popular", "vendor-verified")
-- separate from user-created tags

ALTER TABLE "Product" ADD COLUMN "adminTags" VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR(50)[];
