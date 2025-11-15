# Vercel Database Configuration Fix

## Problem
The homepage is timing out because it's using Supabase's **session pooler** (port 5432) which is too slow for Vercel's serverless functions.

## Solution
Switch to Supabase's **transaction pooler** (port 6543) which is optimized for serverless environments.

## Required Vercel Environment Variable Updates

Update these variables in Vercel (Project Settings → Environment Variables):

### 1. DATABASE_URL
**Current (Session Pooler - SLOW):**
```
postgresql://postgres.swhinhgrtcowjmpstozh:YOUR_PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**Change to (Transaction Pooler - FAST):**
```
postgresql://postgres.swhinhgrtcowjmpstozh:YOUR_PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 2. DIRECT_URL
**Current (Session Pooler):**
```
postgresql://postgres.swhinhgrtcowjmpstozh:YOUR_PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**Change to (Direct Connection for migrations):**
```
postgresql://postgres.swhinhgrtcowjmpstozh:YOUR_PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```
*Note: DIRECT_URL should stay on port 5432 (session pooler) as it's used for migrations which need direct access.*

## Steps to Update

1. Go to your Vercel dashboard
2. Navigate to your project → Settings → Environment Variables
3. Find `DATABASE_URL` and click Edit
4. Change the port from `5432` to `6543`
5. Add `?pgbouncer=true` to the end
6. Click Save
7. Redeploy your application

## Why This Fixes the Issue

- **Transaction Pooler (6543)**: Fast, lightweight connections perfect for serverless
  - Connects in <100ms
  - No persistent connections
  - Designed for Vercel/serverless

- **Session Pooler (5432)**: Slower, meant for long-running servers
  - Can take 1-5 seconds to connect
  - Requires persistent connections
  - Causes timeouts in serverless

## Local Development

Update your `.env.local` file:

```env
DATABASE_URL="postgresql://postgres.swhinhgrtcowjmpstozh:YOUR_PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.swhinhgrtcowjmpstozh:YOUR_PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

**Note:** Replace `YOUR_PASSWORD` with your actual Supabase database password.

## Expected Results After Fix

✅ Homepage loads in <2 seconds
✅ No more "Connection closed" errors  
✅ No more "Task timed out" errors
✅ Stable database connections

## Additional Code Changes Made

1. **lib/db.ts**: Added `pgbouncer=true` parameter and reduced timeout to 5s
2. **app/page.tsx**: Added 8s timeout wrapper to prevent Vercel's 10s limit
