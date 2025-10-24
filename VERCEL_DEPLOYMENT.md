# Vercel Deployment Guide

## ⚠️ SECURITY NOTICE
**NEVER commit actual credentials to version control**. Always use placeholders in documentation files. Set real values only in:
- `.env.local` (gitignored, for local development)
- Vercel Dashboard → Settings → Environment Variables (for production)

## Environment Variables Setup

This project requires environment variables to be configured in Vercel for successful deployment.

### Required Environment Variables

Add these variables in your Vercel project dashboard:

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click on "Settings" tab
   - Select "Environment Variables"

2. **Add the following variables with YOUR OWN VALUES:**

```bash
# Supabase Configuration - GET FROM YOUR SUPABASE DASHBOARD
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# Database Connection - GET FROM SUPABASE DASHBOARD
# Use session pooler connection string for serverless environments
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Application URL - REPLACE with your actual Vercel deployment URL
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app

# Optional: Google Maps (if using maps features)
NEXT_PUBLIC_GOOGLE_MAPS=your_google_maps_api_key_here

NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Optional: Stripe (if using payment features)
NEXT_PUBLIC_STRIPE_KEY=pk_test_your_stripe_publishable_key

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Optional: Redis Cache (if using caching)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io

UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

**IMPORTANT NOTES:**
- **NEVER** commit these actual values to git
- Get all Supabase values from your Supabase Dashboard (see below)
- The database URLs use the session pooler (required for serverless environments)
- Replace ALL placeholder values with your actual credentials

3. **Set Environment Scope**
   - For each variable, select which environments it applies to:
     - ✓ Production
     - ✓ Preview
     - ✓ Development

## How to Find Your Supabase Values

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click "Settings" → "API"
   - **Project URL**: Copy this for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: Copy this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **JWT Secret**: Copy this for `SUPABASE_JWT_SECRET`
4. Click "Settings" → "Database"
   - **Connection string** → Choose "Session mode (port 5432)" for `DATABASE_URL`
   - Use the same connection string for `DIRECT_URL`
   - **Important**: Use the session pooler connection string, not the direct connection

## 🔒 Security Best Practices

1. **Never commit credentials**: Always use `.env.local` (gitignored) for local development
2. **Rotate exposed credentials immediately**: If credentials are accidentally exposed, rotate them in Supabase
3. **Use environment-specific secrets**: Different credentials for dev, preview, and production
4. **Enable GitHub Secret Scanning**: Helps prevent accidental credential exposure
5. **Limit database user permissions**: Use role-based access control in Supabase

## Changes Made to Fix Deployment

### Problem
The original environment configuration tried to read `.env` files from the filesystem during build, which doesn't work on Vercel because:
- `.env.local` is gitignored (correctly, for security)
- Vercel provides environment variables through `process.env` directly
- Build-time file reading caused deployment failures

### Solution
Refactored environment handling to:
- ✓ Remove file-reading logic (Next.js handles this automatically)
- ✓ Use `process.env` directly (works with Vercel's environment injection)
- ✓ Add runtime validation with helpful error messages
- ✓ Prevent build failures from missing optional variables
- ✓ Validate URL format to catch configuration errors early

## Local Development

For local development, create a `.env.local` file (which is gitignored):

```bash
# .env.local (this file stays on your machine, NEVER committed to git)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_JWT_SECRET=your_actual_jwt_secret
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
# ... add other variables as needed
```

Next.js automatically loads `.env.local` during local development.

## Deployment Process

1. **Set environment variables in Vercel Dashboard** (one-time setup)

2. **Push to GitHub** - Vercel automatically deploys:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

3. **Monitor build logs** in Vercel dashboard
   - The validation will show if any required variables are missing
   - Clear error messages will guide you to fix any issues

## Troubleshooting

### "Invalid supabaseUrl" Error
This means `NEXT_PUBLIC_SUPABASE_URL` is either:
- Not set in Vercel environment variables
- Set to an invalid value (not a valid URL)
- Set to a value from a different Supabase project

**Fix**: Verify the value in Vercel Dashboard matches your Supabase project URL

### Authentication Errors / "Missing anon key"
The `NEXT_PUBLIC_SUPABASE_ANON_KEY` must match the same Supabase project as the URL.

**Fix**: Get both values from the same project in Supabase Dashboard → Settings → API

### Build Fails Locally
1. Ensure `.env.local` exists in project root
2. Check that all required variables are set
3. Restart your development server after changing variables
4. Run `npm run build` to test the build locally

### Variables Not Updating on Vercel
After changing environment variables in Vercel:
1. Go to Deployments tab
2. Click "..." menu on latest deployment
3. Select "Redeploy"
4. Uncheck "Use existing Build Cache"

### Database Connection Issues
If using Prisma/database features:
- Ensure you're using the **Session Pooler** connection string (port 5432)
- The pooler is required for serverless environments like Vercel
- Don't use the direct connection (port 6543 with pgbouncer)
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:5432/postgres`
