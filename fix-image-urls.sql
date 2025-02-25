-- First, let's test the transformation on one row to verify
SELECT 
  id,
  name,
  images[1] as current_url,
  REPLACE(images[1], '/public/', '/public/products/') as new_url
FROM "Product"
WHERE array_length(images, 1) > 0
LIMIT 1;

-- If the above looks correct, run this to update all rows
UPDATE "Product"
SET images = ARRAY[
  REPLACE(images[1], '/public/', '/public/products/')
];
