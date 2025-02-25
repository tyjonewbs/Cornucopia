-- Check the current state of image URLs
SELECT id, name, images[1] as current_url
FROM "Product"
WHERE array_length(images, 1) > 0
LIMIT 5;

-- Try a more specific fix if the previous one didn't work
-- This assumes the URLs might have a different format than expected
UPDATE "Product"
SET images = ARRAY[
  CASE 
    -- If URL already contains 'products/' in the right place, leave it as is
    WHEN images[1] LIKE '%/public/products/%' THEN images[1]
    -- If URL ends with '/public/', add 'products/'
    WHEN images[1] LIKE '%/public/' THEN 
      SUBSTRING(images[1], 1, LENGTH(images[1])) || 'products/'
    -- If URL contains '/public/' but not at the end, insert 'products/' after it
    WHEN images[1] LIKE '%/public/%' THEN 
      REPLACE(images[1], '/public/', '/public/products/')
    -- Otherwise, leave it as is
    ELSE images[1]
  END
];

-- Check if we need to add the filename to the URL
-- If the URLs end with 'products/' but don't have a filename, we need to extract it from the original path
SELECT 
  id, 
  name, 
  images[1] as current_url,
  CASE
    WHEN images[1] LIKE '%/products/' THEN
      -- Extract filename from the original path if needed
      images[1] || SUBSTRING(
        REVERSE(images[1]), 
        1, 
        POSITION('/' IN REVERSE(images[1])) - 1
      )
    ELSE images[1]
  END as fixed_url
FROM "Product"
WHERE array_length(images, 1) > 0
LIMIT 5;
