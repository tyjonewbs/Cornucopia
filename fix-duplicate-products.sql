-- First, let's check the current state of the URLs
SELECT id, name, images[1] as current_url
FROM "Product"
WHERE array_length(images, 1) > 0
LIMIT 5;

-- Function to clean up URLs with duplicate 'products/' segments
CREATE OR REPLACE FUNCTION clean_url(url text) RETURNS text AS $$
DECLARE
  base_url text;
  file_path text;
  clean_path text;
BEGIN
  -- Extract the base URL (up to '/storage/v1/object/public/')
  base_url := substring(url from '^(https://[^/]+/storage/v1/object/public/)');
  
  -- Extract the file path (everything after '/public/')
  file_path := substring(url from '/public/(.*)$');
  
  -- Remove all 'products/' segments
  clean_path := regexp_replace(file_path, 'products/', '', 'g');
  
  -- Add back a single 'products/' at the beginning
  RETURN base_url || 'products/' || clean_path;
END;
$$ LANGUAGE plpgsql;

-- Test the function on one row
SELECT 
  id, 
  name, 
  images[1] as current_url,
  clean_url(images[1]) as fixed_url
FROM "Product"
WHERE array_length(images, 1) > 0
LIMIT 5;

-- If the fixed URLs look correct, update all rows
UPDATE "Product"
SET images = ARRAY[clean_url(images[1])];

-- Verify the update
SELECT id, name, images[1] as updated_url
FROM "Product"
WHERE array_length(images, 1) > 0
LIMIT 5;
