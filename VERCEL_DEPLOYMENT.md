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
# Database Connection
DATABASE_URL=postgresql://postgres.swhinhgrtcowjmpstozh:JxdbOlO57Tra5sVi@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres.swhinhgrtcowjmpstozh:JxdbOlO57Tra5sVi@db.swhinhgrtcowjmpstozh.supabase.co:5432/postgres

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://swhinhgrtcowjmpstozh.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bGVsa2xuaWJqenBncnF1enJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTYwNjcsImV4cCI6MjA1MDYzMjA2N30.TEaKFsDU7JJwmX70KTRX740oH43wEDQjn1tguG0n7_o

SUPABASE_JWT_SECRET=ZYPX7/BjldmstZS0Wr9udSv3GboYOule1ef30W4N14OgXKNsXedq+X/kep/YZIN9O+97J3/frs3wi8Z1+Mo2FA==

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Important:** Replace `https://your-domain.vercel.app` with your actual Vercel deployment URL.

3. **Set Environment Scope**
   - For each variable, select which environments it applies to:
     - ✓ Production
     - ✓ Preview
     - ✓ Development (optional)

4. **Additional Variables (if needed)**
   - If you have Stripe integration: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - If you have other API keys: Add them similarly

## Changes Made to Fix Deployment

### Problem
The original `lib/env.server.mjs` tried to read `.env` and `.env.local` files from the filesystem during build, which caused failures on Vercel because:
- These files are gitignored (correctly)
- They don't exist on Vercel's servers
- Vercel provides environment variables through `process.env` directly

### Solution
Refactored `lib/env.server.mjs` to:
- ✓ Remove file-reading logic (no more `dotenv.config()`)
- ✓ Use `process.env` directly (works with Vercel's environment injection)
- ✓ Keep validation logic to ensure required variables exist
- ✓ Maintain default values for local development fallback

## Local Development

For local development, you still use `.env.local` (which is gitignored):

```bash
# .env.local (this file stays on your machine, never committed to git)
DATABASE_URL=your_local_database_url
DIRECT_URL=your_direct_database_url
# ... other variables
```

Next.js automatically loads `.env.local` during local development.

## Deployment Process

1. **Commit and push your changes** to GitHub:
   ```bash
   git add .
   git commit -m "Fix Vercel deployment environment variable handling"
   git push origin main
   ```

2. **Vercel will automatically deploy** from your GitHub repository

3. **Monitor the build logs** in Vercel dashboard to ensure successful deployment

## Troubleshooting

### Build still fails?
- Check that all required environment variables are set in Vercel dashboard
- Ensure variable names match exactly (case-sensitive)
- Check build logs for specific missing variables

### Variables not updating?
- After changing environment variables in Vercel, redeploy:
  - Go to Deployments tab
  - Click "..." menu on latest deployment
  - Select "Redeploy"

### Local development issues?
- Ensure `.env.local` exists in project root
- Restart your development server after changing environment variables
- Check that `.env.local` is in your `.gitignore` (it should be)
