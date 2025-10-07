-- Supabase Setup SQL Script
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/sql)

-- ============================================================================
-- STEP 1: Enable Required Extensions
-- ============================================================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ============================================================================
-- STEP 2: Create Storage Buckets
-- ============================================================================

-- Create bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for market stand images
INSERT INTO storage.buckets (id, name, public)
VALUES ('market-stand-images', 'market-stand-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for local/farm images
INSERT INTO storage.buckets (id, name, public)
VALUES ('local-images', 'local-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Storage Security Policies
-- ============================================================================

-- Product Images Policies
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public to view product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow users to update their own product images
CREATE POLICY "Users can update their own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own product images
CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Market Stand Images Policies
CREATE POLICY "Authenticated users can upload market stand images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'market-stand-images');

CREATE POLICY "Public can view market stand images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'market-stand-images');

CREATE POLICY "Users can update their own market stand images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'market-stand-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own market stand images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'market-stand-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Profile Images Policies
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Local/Farm Images Policies
CREATE POLICY "Authenticated users can upload local images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'local-images');

CREATE POLICY "Public can view local images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'local-images');

CREATE POLICY "Users can update their own local images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'local-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own local images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'local-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run Prisma migrations: npx prisma migrate deploy
-- 2. Configure Auth providers in Supabase dashboard
-- 3. Test the setup
-- ============================================================================
