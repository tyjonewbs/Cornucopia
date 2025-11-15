-- Update existing rejected market stands to set isActive to false
-- This ensures consistency after the new rejection logic was implemented

UPDATE "MarketStand"
SET "isActive" = false
WHERE status = 'REJECTED' AND "isActive" = true;

-- Also update suspended stands to be inactive
UPDATE "MarketStand"
SET "isActive" = false
WHERE status = 'SUSPENDED' AND "isActive" = true;
