# Supabase Setup Guide for Cornucopia

This guide will walk you through completing the Supabase migration for your Cornucopia project.

## Current Progress

✅ New Supabase project created  
✅ Environment variables updated in `.env.local` and `.env`  
✅ Prisma client generated  
⏳ Database migrations running (in progress)

## Next Steps to Complete

### 1. Run SQL Setup Script in Supabase

Once the Prisma migration completes, go to your Supabase dashboard and run the SQL setup:

1. Navigate to: https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/sql
2. Open the file `supabase-setup.sql` in this project
3. Copy all the SQL content
4. Paste it into the Supabase SQL Editor
5. Click "Run" to execute

This will:
- Enable the `uuid-ossp` extension
- Create 4 storage buckets (product-images, market-stand-images, profile-images, local-images)
- Set up Row Level Security policies for all buckets

### 2. Configure Authentication Providers

#### Email Authentication

1. Go to: https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/auth/providers
2. Scroll to "Email" provider
3. Ensure it's **enabled**
4. Configure settings:
   - Enable email confirmations if desired
   - Customize email templates (optional)

#### Google OAuth

1. **First, get Google OAuth credentials:**
   - Go to: https://console.cloud.google.com/
   - Create a new project or select existing one
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add authorized redirect URIs:
     - `https://swhinhgrtcowjmpstozh.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local testing)
   - Save and copy the Client ID and Client Secret

2. **Configure in Supabase:**
   - Go to: https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/auth/providers
   - Find "Google" provider
   - Enable it
   - Enter your Client ID and Client Secret
   - Save

### 3. Configure Auth Settings

1. Go to: https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/auth/url-configuration
2. Set **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`
   - Add your production URLs when deploying

### 4. Update Upload Code for Supabase Storage

The file `app/actions/upload.ts` needs to be updated to use Supabase Storage instead of the current service. This will be done in the next step.

### 5. Test the Setup

Once everything is configured:

1. **Test Authentication:**
   ```bash
   npm run dev
   ```
   - Try signing up with email
   - Try logging in with Google
   - Verify you're redirected correctly

2. **Test Database:**
   - Create a test user
   - Create a test market stand
   - Verify data is saved in Supabase

3. **Test Image Upload:**
   - Once upload.ts is updated, test uploading images
   - Verify images appear in Supabase Storage

## Environment Variables Summary

Your project now uses these Supabase-related environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL="https://swhinhgrtcowjmpstozh.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"
DATABASE_URL="[transaction-pooler-connection-string]"
DIRECT_URL="[direct-connection-string]"
```

## Storage Buckets Created

1. **product-images** - For product photos
2. **market-stand-images** - For market stand photos  
3. **profile-images** - For user avatars
4. **local-images** - For farm/local page images

All buckets are public for easy image display, with RLS policies ensuring only authenticated users can upload and users can only delete their own images.

## Important Files

- `.env.local` - Next.js environment variables (used by the app)
- `.env` - Prisma environment variables (used by Prisma CLI)
- `supabase-setup.sql` - SQL script to run in Supabase dashboard
- `prisma/schema.prisma` - Your database schema

## Troubleshooting

**If migrations fail:**
- Check your DATABASE_URL is correct
- Ensure your database password is correct
- Try using DIRECT_URL instead of transaction pooler for migrations

**If auth doesn't work:**
- Verify redirect URLs are correct in Supabase dashboard
- Check that Site URL matches your app URL
- Ensure Google OAuth credentials are correct

**If images don't upload:**
- Verify storage buckets exist in Supabase dashboard
- Check RLS policies are in place
- Ensure upload.ts is updated to use Supabase Storage

## Next: Update Upload Service

The final step is to update `app/actions/upload.ts` to use Supabase Storage. This will allow your app to store images in Supabase instead of the previous service.
