# Vercel Deployment Guide

## Environment Variables Setup

This project requires environment variables to be configured in Vercel for successful deployment.

### Required Environment Variables

Add these variables in your Vercel project dashboard:

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click on "Settings" tab
   - Select "Environment Variables"

2. **Add the following variables:**

```bash
# Supabase Configuration - CRITICAL: Use the correct values for your project!
NEXT_PUBLIC_SUPABASE_URL=https://swhinhgrtcowjmpstozh.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3aGluaGdydGNvd2ptcHN0b3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY3OTksImV4cCI6MjA3NTM0Mjc5OX0.iE1Sd6CdF-weqqjMlZFJw56Uf-MxoF9dx-DRNVCSMek

SUPABASE_JWT_SECRET=ZYPX7/BjldmstZS0Wr9udSv3GboYOule1ef30W4N14OgXKNsXedq+X/kep/YZIN9O+97J3/frs3wi8Z1+Mo2FA==

# Database Connection - Use session pooler for serverless
DATABASE_URL=postgresql://postgres.swhinhgrtcowjmpstozh:tyler996@aws-1-us-east-2.pooler.supabase.com:5432/postgres

DIRECT_URL=postgresql://postgres.swhinhgrtcowjmpstozh:tyler996@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Application URL - REPLACE with your actual Vercel deployment URL
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app

# Optional: Google Maps (if using maps features) - Add your own keys
NEXT_PUBLIC_GOOGLE_MAPS=your_google_maps_api_key

NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Optional: Stripe (if using payment features) - Add your own keys
NEXT_PUBLIC_STRIPE_KEY=your_stripe_publishable_key

STRIPE_SECRET_KEY=your_stripe_secret_key

# Optional: Redis Cache (if using caching) - Add your own credentials
UPSTASH_REDIS_REST_URL=your_redis_url

UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

**IMPORTANT NOTES:**
- Replace `https://your-project-name.vercel.app` with your actual Vercel deployment URL
- All the Supabase values above are from YOUR actual project (`swhinhgrtcowjmpstozh`)
- The anon key and project URL MUST match the same Supabase project
- The database URLs use the session pooler (required for serverless environments like Vercel)
- Add your own API keys for optional services (Stripe, Maps, Redis)

3. **Set Environment Scope**
   - For each variable, select which environments it applies to:
     - ✓ Production
     - ✓ Preview
     - ✓ Development

## How to Find Your Supabase Values

If you need to verify or get fresh values:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (`swhinhgrtcowjmpstozh`)
3. Click "Settings" → "API"
   - **Project URL**: Copy this for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: Copy this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click "Settings" → "Database"
   - **Connection string** → Choose "Session mode" for `DATABASE_URL`
   - Use the same for `DIRECT_URL`

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

For local development, you use `.env.local` (which is gitignored):

```bash
# .env.local (this file stays on your machine, never committed to git)
NEXT_PUBLIC_SUPABASE_URL=https://swhinhgrtcowjmpstozh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3aGluaGdydGNvd2ptcHN0b3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY3OTksImV4cCI6MjA3NTM0Mjc5OX0.iE1Sd6CdF-weqqjMlZFJw56Uf-MxoF9dx-DRNVCSMek
# ... other variables from your actual .env.local
```

Next.js automatically loads `.env.local` during local development.

## Deployment Process

1. **Update environment variables in Vercel** (use the values above)

2. **Redeploy your application**:
   - Vercel automatically deploys when you push to GitHub
   - Or manually trigger: Go to Deployments → Click "..." → "Redeploy"

3. **Monitor the build logs** in Vercel dashboard
   - The new validation will show if any required variables are missing
   - Clear error messages will guide you to fix any issues

## Troubleshooting

### "Invalid supabaseUrl" Error
This means `NEXT_PUBLIC_SUPABASE_URL` is either:
- Not set in Vercel environment variables
- Set to an invalid value (not a valid URL)
- Set to a value from a different Supabase project

**Fix**: Verify in Vercel dashboard that `NEXT_PUBLIC_SUPABASE_URL` is set to:
```
https://swhinhgrtcowjmpstozh.supabase.co
```

### Authentication Errors / "Missing anon key"
The `NEXT_PUBLIC_SUPABASE_ANON_KEY` must match the same Supabase project as the URL.

**Fix**: Verify both values are from the same project in Supabase dashboard.

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
4. Check "Use existing Build Cache" is OFF

### Database Connection Issues
If using Prisma/database features:
- Ensure you're using the **Session Pooler** connection string (port 5432)
- The pooler is required for serverless environments like Vercel
- Format: `postgresql://[user]:[password]@[host]:5432/postgres`
