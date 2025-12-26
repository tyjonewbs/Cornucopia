import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkRedisHealth } from '@/lib/cache/redis';
import { refreshStaticProductsCache } from '@/app/actions/cached-products';

/**
 * Warm-up endpoint for keeping serverless functions warm
 * 
 * This endpoint should be called every 5 minutes by an external service
 * (e.g., Upstash QStash, cron-job.org, or similar)
 * 
 * URL: https://cornucopialocal.com/api/health/warmup
 * 
 * What it does:
 * 1. Initializes/verifies Prisma connection pool
 * 2. Executes a minimal database query to keep connection alive
 * 3. Checks Redis cache connection
 * 
 * On Vercel Hobby plan (10s timeout), this prevents cold starts
 * by ensuring the function stays "warm" between user requests.
 */

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Minimal timeout since this is a health check
export const maxDuration = 10;

export async function GET(request: Request) {
  const startTime = Date.now();
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Optional: Verify the request is from a trusted source
  // You can add a secret token for production security
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.WARMUP_SECRET_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    // If a token is configured but doesn't match, still warm up
    // but don't expose detailed results
    try {
      await warmupConnections();
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch {
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }
  }

  try {
    // 1. Warm up Prisma connection with minimal query
    const dbStart = Date.now();
    try {
      // Simple count query - minimal overhead
      const productCount = await prisma.product.count({
        where: { isActive: true },
        take: 1, // Limit even on count for fastest response
      });
      results.checks = {
        ...results.checks as object,
        database: {
          status: 'ok',
          latencyMs: Date.now() - dbStart,
          productCount,
        },
      };
    } catch (dbError) {
      results.checks = {
        ...results.checks as object,
        database: {
          status: 'error',
          latencyMs: Date.now() - dbStart,
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
      };
    }

    // 2. Warm up Redis connection
    const redisStart = Date.now();
    try {
      const redisHealthy = await checkRedisHealth();
      results.checks = {
        ...results.checks as object,
        redis: {
          status: redisHealthy ? 'ok' : 'degraded',
          latencyMs: Date.now() - redisStart,
        },
      };
    } catch (redisError) {
      results.checks = {
        ...results.checks as object,
        redis: {
          status: 'error',
          latencyMs: Date.now() - redisStart,
          error: redisError instanceof Error ? redisError.message : 'Unknown error',
        },
      };
    }

    // 3. Refresh products cache (in background, don't block response)
    // Only refresh if we have time remaining (within 8s of 10s timeout)
    const timeElapsed = Date.now() - startTime;
    if (timeElapsed < 6000) {
      const cacheStart = Date.now();
      try {
        const cacheRefreshed = await refreshStaticProductsCache();
        results.checks = {
          ...results.checks as object,
          productsCache: {
            status: cacheRefreshed ? 'ok' : 'failed',
            latencyMs: Date.now() - cacheStart,
          },
        };
      } catch (cacheError) {
        results.checks = {
          ...results.checks as object,
          productsCache: {
            status: 'error',
            latencyMs: Date.now() - cacheStart,
            error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
          },
        };
      }
    } else {
      results.checks = {
        ...results.checks as object,
        productsCache: {
          status: 'skipped',
          reason: 'Time constraint - ran warmup only',
        },
      };
    }

    // Calculate total latency
    results.totalLatencyMs = Date.now() - startTime;
    results.status = 'ok';

    return NextResponse.json(results, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    results.status = 'error';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.totalLatencyMs = Date.now() - startTime;

    return NextResponse.json(results, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}

/**
 * Simple warmup without detailed results
 */
async function warmupConnections() {
  await Promise.all([
    prisma.product.count({ take: 1 }),
    checkRedisHealth(),
  ]);
}

/**
 * POST method for external cron services that prefer POST
 */
export async function POST(request: Request) {
  return GET(request);
}
