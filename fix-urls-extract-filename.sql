-- First, let's check the current state of the URLs
SELECT id, name, images[1] as current_url
FROM "Product"
WHERE array_length(images, 1) > 0
LIMIT 5;

-- Function to extract just the filename and rebuild the URL
CREATE OR REPLACE FUNCTION rebuild_url(url text) RETURNS text AS $$
DECLARE
  filename text;
BEGIN
  -- Try to extract the filename using various patterns
  -- First try to get the last segment after the last slash
  filename := substring(url from '([^/]+)$');
  
  -- If that doesn't work, try to extract common filename patterns
  IF filename IS NULL OR length(filename) < 5 THEN
    -- Try to extract filenames like '173782505726-more_apples.jpeg'
    filename := substring(url from '(17[0-9]+-[a-zA-Z0-9_-]+\.[a-zA-Z]+)');
  END IF;
  
  -- If we still don't have a filename, use a default
  IF filename IS NULL OR length(filename) < 5 THEN
    filename := 'missing-filename.jpg';
  END IF;
  
  -- Build the correct URL
  RETURN 'https://fzlelklnibjzpgrquzrq.supabase.co/storage/v1/object/public/products/' || filename;
END;
$$ LANGUAGE plpgsql;

-- Test the function on a few rows
SELECT 
  id, 
  name, 
  images[1] as current_url,
  rebuild_url(images[1]) as fixed_url
FROM "Product"
WHERE array_length(images, 1) > 0
LIMIT 5;

-- If the fixed URLs look correct, update all rows
UPDATE "Product"
SET images = ARRAY[rebuild_url(images[1])];

-- Verify the update
SELECT id, name, images[1] as updated_url
FROM "Product"
WHERE array_length(images, 1) > 0
LIMIT 5;
