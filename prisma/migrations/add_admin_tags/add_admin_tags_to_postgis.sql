-- Update PostGIS functions to include adminTags and inventoryUpdatedAt columns
-- These are needed for the freshness badge system on the front page

-- Recreate get_products_within_radius with adminTags + inventoryUpdatedAt
DROP FUNCTION IF EXISTS get_products_within_radius(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION get_products_within_radius(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 250,
  max_results INTEGER DEFAULT 20,
  cursor_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  product_id TEXT,
  product_name VARCHAR,
  product_description TEXT,
  product_price DECIMAL,
  product_images TEXT[],
  product_inventory INTEGER,
  product_tags VARCHAR[],
  product_admin_tags VARCHAR[],
  product_inventory_updated_at TIMESTAMP,
  product_is_active BOOLEAN,
  product_delivery_available BOOLEAN,
  product_available_date TIMESTAMP,
  product_available_until TIMESTAMP,
  product_created_at TIMESTAMP,
  product_updated_at TIMESTAMP,
  market_stand_id TEXT,
  market_stand_name VARCHAR,
  market_stand_location_name VARCHAR,
  market_stand_latitude DOUBLE PRECISION,
  market_stand_longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
DECLARE
  user_location geography;
  radius_meters DOUBLE PRECISION;
BEGIN
  user_location := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
  radius_meters := radius_km * 1000;

  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.description AS product_description,
    p.price AS product_price,
    p.images AS product_images,
    p.inventory AS product_inventory,
    p.tags AS product_tags,
    p."adminTags" AS product_admin_tags,
    p."inventoryUpdatedAt" AS product_inventory_updated_at,
    p."isActive" AS product_is_active,
    p."deliveryAvailable" AS product_delivery_available,
    p."availableDate" AS product_available_date,
    p."availableUntil" AS product_available_until,
    p."createdAt" AS product_created_at,
    p."updatedAt" AS product_updated_at,
    ms.id AS market_stand_id,
    ms.name AS market_stand_name,
    ms."locationName" AS market_stand_location_name,
    ms.latitude AS market_stand_latitude,
    ms.longitude AS market_stand_longitude,
    ST_Distance(ms.location, user_location) / 1000 AS distance_km
  FROM "Product" p
  INNER JOIN "MarketStand" ms ON p."marketStandId" = ms.id
  WHERE
    p."isActive" = true
    AND ms."isActive" = true
    AND ms.location IS NOT NULL
    AND ST_DWithin(ms.location, user_location, radius_meters)
    AND (cursor_id IS NULL OR p.id > cursor_id)
  ORDER BY
    CASE
      WHEN p."availableDate" IS NULL OR p."availableDate" <= NOW() THEN 0
      ELSE 1
    END,
    ST_Distance(ms.location, user_location)
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Recreate get_home_products with adminTags + inventoryUpdatedAt
DROP FUNCTION IF EXISTS get_home_products(DOUBLE PRECISION, DOUBLE PRECISION, VARCHAR, DOUBLE PRECISION, INTEGER);

CREATE OR REPLACE FUNCTION get_home_products(
  user_lat DOUBLE PRECISION DEFAULT NULL,
  user_lng DOUBLE PRECISION DEFAULT NULL,
  user_zip VARCHAR DEFAULT NULL,
  radius_km DOUBLE PRECISION DEFAULT 250,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  product_id TEXT,
  product_name VARCHAR,
  product_description TEXT,
  product_price DECIMAL,
  product_images TEXT[],
  product_inventory INTEGER,
  product_tags VARCHAR[],
  product_admin_tags VARCHAR[],
  product_inventory_updated_at TIMESTAMP,
  product_is_active BOOLEAN,
  product_delivery_available BOOLEAN,
  product_available_date TIMESTAMP,
  product_available_until TIMESTAMP,
  product_created_at TIMESTAMP,
  product_updated_at TIMESTAMP,
  market_stand_id TEXT,
  market_stand_name VARCHAR,
  market_stand_location_name VARCHAR,
  market_stand_latitude DOUBLE PRECISION,
  market_stand_longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  has_delivery_to_zip BOOLEAN,
  delivery_zone_id TEXT,
  delivery_fee DECIMAL
) AS $$
DECLARE
  user_location geography;
  radius_meters DOUBLE PRECISION;
BEGIN
  IF user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
    user_location := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
    radius_meters := radius_km * 1000;
  END IF;

  RETURN QUERY
  WITH nearby_products AS (
    SELECT DISTINCT ON (p.id)
      p.id,
      p.name,
      p.description,
      p.price,
      p.images,
      p.inventory,
      p.tags,
      p."adminTags",
      p."inventoryUpdatedAt",
      p."isActive",
      p."deliveryAvailable",
      p."availableDate",
      p."availableUntil",
      p."createdAt",
      p."updatedAt",
      ms.id AS ms_id,
      ms.name AS ms_name,
      ms."locationName" AS ms_location_name,
      ms.latitude AS ms_lat,
      ms.longitude AS ms_lng,
      CASE
        WHEN user_location IS NOT NULL AND ms.location IS NOT NULL
        THEN ST_Distance(ms.location, user_location) / 1000
        ELSE NULL
      END AS dist_km,
      CASE
        WHEN user_zip IS NOT NULL AND p."deliveryAvailable" = true
        THEN EXISTS (
          SELECT 1 FROM "DeliveryZone" dz
          WHERE dz.id = p."deliveryZoneId"
            AND dz."isActive" = true
            AND user_zip = ANY(dz."zipCodes")
        )
        ELSE false
      END AS delivers_to_zip,
      p."deliveryZoneId" AS dz_id,
      (SELECT dz."deliveryFee" FROM "DeliveryZone" dz WHERE dz.id = p."deliveryZoneId") AS dz_fee
    FROM "Product" p
    LEFT JOIN "MarketStand" ms ON p."marketStandId" = ms.id
    WHERE
      p."isActive" = true
      AND (
        (
          user_location IS NOT NULL
          AND ms.location IS NOT NULL
          AND ms."isActive" = true
          AND ST_DWithin(ms.location, user_location, radius_meters)
        )
        OR (
          user_zip IS NOT NULL
          AND p."deliveryAvailable" = true
          AND EXISTS (
            SELECT 1 FROM "DeliveryZone" dz
            WHERE dz.id = p."deliveryZoneId"
              AND dz."isActive" = true
              AND user_zip = ANY(dz."zipCodes")
          )
        )
        OR (user_location IS NULL AND user_zip IS NULL)
      )
  )
  SELECT
    np.id::TEXT,
    np.name,
    np.description,
    np.price::DECIMAL(10, 2),
    np.images,
    np.inventory,
    np.tags,
    np."adminTags",
    np."inventoryUpdatedAt",
    np."isActive",
    np."deliveryAvailable",
    np."availableDate",
    np."availableUntil",
    np."createdAt",
    np."updatedAt",
    np.ms_id::TEXT,
    np.ms_name,
    np.ms_location_name,
    np.ms_lat,
    np.ms_lng,
    np.dist_km,
    np.delivers_to_zip,
    np.dz_id::TEXT,
    np.dz_fee::DECIMAL(10, 2)
  FROM nearby_products np
  ORDER BY
    CASE
      WHEN np."availableDate" IS NULL OR np."availableDate" <= NOW() THEN 0
      ELSE 1
    END,
    COALESCE(np.dist_km, 999999),
    np."updatedAt" DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;
