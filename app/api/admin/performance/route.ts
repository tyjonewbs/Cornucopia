import { NextRequest, NextResponse } from 'next/server';
import { getConnectionMetrics } from '@/lib/db';
import { checkRedisHealth } from '@/lib/cache/redis';

/**
 * Performance Monitoring API Endpoint
 * Provides insights into database and cache performance
 * Requires admin authentication
 */

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const { createRouteHandlerClient } = await import('@/lib/supabase-route');
    const supabase = createRouteHandlerClient();
    // Use getUser() for secure server-side auth validation
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { default: prisma } = await import('@/lib/db');
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [dbMetrics, redisHealthy] = await Promise.all([
      getConnectionMetrics(),
      checkRedisHealth(),
    ]);

    const performanceData = {
      timestamp: new Date().toISOString(),
      database: {
        metrics: dbMetrics,
        status: dbMetrics ? 'healthy' : 'degraded',
      },
      cache: {
        redis: {
          status: redisHealthy ? 'healthy' : 'unhealthy',
        },
      },
      recommendations: generateRecommendations(dbMetrics, redisHealthy),
    };

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * Generate performance recommendations based on metrics
 */
function generateRecommendations(
  dbMetrics: any,
  redisHealthy: boolean
): string[] {
  const recommendations: string[] = [];

  if (!redisHealthy) {
    recommendations.push('Redis cache is unhealthy. Check connection configuration.');
  }

  if (!dbMetrics) {
    recommendations.push('Unable to retrieve database metrics. Monitoring may be disabled.');
  }

  // Add more sophisticated recommendations based on actual metrics
  if (dbMetrics?.counters) {
    const queryCount = dbMetrics.counters['prisma_client_queries_total'];
    if (queryCount > 10000) {
      recommendations.push('High query volume detected. Consider implementing more aggressive caching.');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems operating normally.');
  }

  return recommendations;
}
