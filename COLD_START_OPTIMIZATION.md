# Cold Start Optimization Guide

This document explains the cold start optimizations implemented to prevent timeout errors on Vercel Hobby plan (10-second limit).

## Problem

On Vercel Hobby plan, serverless functions timeout after 10 seconds. Cold starts can take 5-12+ seconds due to:
- Prisma client initialization (~1-2s)
- Database connection via Supabase Pooler (~1-3s)
- PostGIS geo-query for products (~1-3s)
- Auth checks (~1-2s)

## Solution Architecture

We've implemented a multi-layered approach:

### 1. Warm-Up Endpoint (`/api/health/warmup`)

A dedicated endpoint that keeps serverless functions warm by:
- Initializing Prisma connection pool
- Testing Redis cache connection
- Refreshing the static products cache

**Setup: Schedule this endpoint to be called every 5 minutes**

### 2. Redis Caching Layer

Products are cached in Upstash Redis for instant retrieval:
- Cache TTL: 1 hour for static products
- Sub-100ms response time from cache
- Background cache refresh on warm-up

### 3. Timeout-Based Fallback Strategy

The home page uses a cascading timeout approach:
1. Try geo products with 6s timeout
2. If timeout, fall back to fast cached products (2s timeout)
3. If both fail, render empty state (UI still loads)

### 4. Production Optimizations

- Minimal logging in production
- Lazy Prisma connection (connects on first query)
- Deferred auth checks (only when `returnUrl` param exists)

---

## Setup Instructions

### Step 1: Verify Upstash Redis Configuration

Ensure these environment variables are set in Vercel:

```
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Step 2: Set Up Warm-Up Cron Job

Choose one of these services to ping your warm-up endpoint every 5 minutes:

#### Option A: Upstash QStash (Recommended)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a QStash schedule
3. Configure:
   - URL: `https://cornucopialocal.com/api/health/warmup`
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - Method: GET

#### Option B: cron-job.org (Free)

1. Go to [cron-job.org](https://cron-job.org/)
2. Create a free account
3. Add new cron job:
   - URL: `https://cornucopialocal.com/api/health/warmup`
   - Schedule: Every 5 minutes
   - Request method: GET

#### Option C: GitHub Actions

Add this workflow to `.github/workflows/warmup.yml`:

```yaml
name: Keep Warm
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  warmup:
    runs-on: ubuntu-latest
    steps:
      - name: Ping warm-up endpoint
        run: |
          curl -s -o /dev/null -w "%{http_code}" \
            https://cornucopialocal.com/api/health/warmup
```

### Step 3: (Optional) Secure the Warm-Up Endpoint

Add a secret token to prevent unauthorized access:

1. Add to Vercel environment variables:
   ```
   WARMUP_SECRET_TOKEN=your-random-secret-here
   ```

2. Update your cron job to include the Authorization header:
   ```
   Authorization: Bearer your-random-secret-here
   ```

---

## Monitoring & Verification

### Test Warm-Up Endpoint

```bash
curl https://cornucopialocal.com/api/health/warmup
```

Expected response:
```json
{
  "timestamp": "2024-12-23T20:00:00.000Z",
  "checks": {
    "database": {
      "status": "ok",
      "latencyMs": 150,
      "productCount": 42
    },
    "redis": {
      "status": "ok",
      "latencyMs": 50
    },
    "productsCache": {
      "status": "ok",
      "latencyMs": 200
    }
  },
  "totalLatencyMs": 420,
  "status": "ok"
}
```

### Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Functions tab
2. Filter by function name containing "page" or "warmup"
3. Check for timeout errors or slow response times

---

## Future Improvements

If cold starts continue to be an issue:

1. **Upgrade to Vercel Pro** - Gets 60 second timeout limit
2. **Add more caching** - Cache individual product pages, market stands
3. **Use Edge Functions** - For read-only pages without database access
4. **Pre-render static pages** - Use `generateStaticParams()` for popular products
5. **Database optimization** - Add indexes, consider read replicas

---

## Files Modified

| File | Purpose |
|------|---------|
| `app/api/health/warmup/route.ts` | Warm-up endpoint |
| `app/actions/cached-products.ts` | Fast product caching |
| `app/page.tsx` | Timeout-based loading strategy |
| `lib/db.ts` | Optimized Prisma client |
| `lib/cache/redis.ts` | Redis caching utilities |

---

## Troubleshooting

### Still getting timeouts?

1. Check if cron job is running (verify in your cron service dashboard)
2. Verify Redis credentials are correct
3. Check Vercel function logs for errors
4. Ensure `revalidate = 60` is set on the page

### Cache not working?

1. Test Redis connection: `curl https://cornucopialocal.com/api/health/warmup`
2. Check if `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
3. Verify cache TTL hasn't expired

### Products not appearing?

1. Check if products exist with `status: 'APPROVED'` and `isActive: true`
2. Verify market stands have `status: 'APPROVED'`
3. Check PostGIS functions are installed on Supabase
