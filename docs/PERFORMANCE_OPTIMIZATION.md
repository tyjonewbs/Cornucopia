# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Cornucopia application, including caching strategies, database optimizations, and query performance monitoring.

## Table of Contents

1. [Overview](#overview)
2. [Redis Caching Strategy](#redis-caching-strategy)
3. [Database Connection Pooling](#database-connection-pooling)
4. [Query Optimization](#query-optimization)
5. [Performance Monitoring](#performance-monitoring)
6. [Environment Configuration](#environment-configuration)
7. [Best Practices](#best-practices)

## Overview

The performance optimization implementation focuses on three key areas:

- **Caching**: Redis-based caching to reduce database load
- **Connection Management**: Optimized database connection pooling
- **Query Optimization**: Improved indexes and N+1 query prevention

### Key Improvements

- ✅ Reduced N+1 queries through proper includes/selects
- ✅ Implemented Redis caching for frequently accessed data
- ✅ Optimized database connection pooling
- ✅ Added composite indexes for common query patterns
- ✅ Implemented query performance monitoring
- ✅ Added cache invalidation strategies

## Redis Caching Strategy

### Cache Configuration

Located in `lib/cache/redis.ts`, the caching system uses Upstash Redis with the following TTL configurations:

```typescript
CACHE_TTL = {
  PRODUCT_LISTING: 5 * 60,      // 5 minutes
  MARKET_STAND_DATA: 10 * 60,   // 10 minutes
  USER_PROFILE: 15 * 60,        // 15 minutes
  STATIC_CONTENT: 60 * 60,      // 1 hour
  USER_SESSION: 24 * 60 * 60,   // 24 hours
}
```

### Cached Data Types

#### 1. Product Listings
- **Cache Key Pattern**: `products:list:{filters}`
- **TTL**: 5 minutes
- **Invalidation**: On product create/update/delete

#### 2. Market Stand Data
- **Cache Key Pattern**: `stand:{id}` or `stands:list:{filters}`
- **TTL**: 10 minutes
- **Invalidation**: On market stand create/update/delete

#### 3. Location-Based Queries
- **Cache Key Pattern**: `stands:location:{lat}:{lng}:{radius}`
- **TTL**: 10 minutes
- **Note**: Coordinates rounded to 2 decimal places to improve cache hit rate

### Cache-Aside Pattern

The implementation uses a cache-aside pattern with the following flow:

```typescript
async function cacheAside<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // 1. Check cache
  const cached = await getCached<T>(key);
  if (cached !== null) return cached;

  // 2. Cache miss - fetch from database
  const data = await fetchFn();

  // 3. Store in cache (async, non-blocking)
  setCached(key, data, ttl);

  return data;
}
```

### Cache Invalidation

Cache invalidation occurs automatically on:

- Product creation/update/deletion
- Market stand creation/update/deletion
- Inventory updates
- Status changes

Invalidation is performed asynchronously to avoid blocking the main operation:

```typescript
// Invalidate caches asynchronously
invalidateProductCaches(id).catch(err => {
  console.error('Cache invalidation error:', err);
});
```

## Database Connection Pooling

### Configuration

The Prisma client is configured with optimized connection pooling:

```typescript
new PrismaClient({
  log: isDevelopment 
    ? ['query', 'error', 'warn', 'info']
    : ['error', 'warn'],
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});
```

### Connection Pool Settings

Configure via `DATABASE_URL` connection string:

```
postgresql://user:password@host:5432/database?connection_limit=10&pool_timeout=20
```

**Recommended Settings:**
- Pool size: 5-10 connections (adjust based on load)
- Connection timeout: 20 seconds
- Query timeout: 15 seconds

### Retry Logic

Database operations include automatic retry logic with exponential backoff:

```typescript
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T>
```

## Query Optimization

### N+1 Query Prevention

All repository queries use proper `include` and `select` statements:

```typescript
// ✅ GOOD - Single query with include
const products = await prisma.product.findMany({
  include: {
    marketStand: {
      select: {
        id: true,
        name: true,
        locationName: true,
        latitude: true,
        longitude: true,
      },
    },
  },
});

// ❌ BAD - N+1 query pattern
const products = await prisma.product.findMany();
for (const product of products) {
  const stand = await prisma.marketStand.findUnique({
    where: { id: product.marketStandId }
  });
}
```

### Database Indexes

Optimized composite indexes for common query patterns:

```sql
-- Product queries
CREATE INDEX "product_status_active_idx" 
  ON "Product"("status", "isActive", "createdAt" DESC);

CREATE INDEX "product_stand_status_idx" 
  ON "Product"("marketStandId", "status", "isActive");

-- Market stand location queries
CREATE INDEX "market_stand_location_active_idx" 
  ON "MarketStand"("isActive", "latitude", "longitude");

-- Review queries
CREATE INDEX "product_review_visible_created_idx" 
  ON "ProductReview"("isVisible", "createdAt" DESC);
```

### Cursor-Based Pagination

The repository layer supports cursor-based pagination for efficient large dataset handling:

```typescript
async findMany(filters: ProductQueryFilters) {
  const { cursor, limit = 50 } = filters;
  
  return prisma.product.findMany({
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    // ... rest of query
  });
}
```

## Performance Monitoring

### Query Performance Tracking

The `monitoredQuery` wrapper logs slow queries:

```typescript
export async function monitoredQuery<T>(
  queryName: string,
  operation: () => Promise<T>,
  slowQueryThresholdMs: number = 1000
): Promise<T>
```

**Output:**
- Logs queries exceeding 1000ms threshold
- Tracks query duration in development mode
- Logs errors with timing information

### Performance API Endpoint

Monitor system performance via API:

```bash
GET /api/admin/performance
```

**Response:**
```json
{
  "timestamp": "2025-01-06T12:00:00Z",
  "database": {
    "metrics": { /* Prisma metrics */ },
    "status": "healthy"
  },
  "cache": {
    "redis": {
      "status": "healthy"
    }
  },
  "recommendations": [
    "All systems operating normally."
  ]
}
```

### Metrics Available

- Database connection pool metrics
- Query execution times
- Cache hit/miss rates (via Redis)
- Slow query detection

## Environment Configuration

### Required Environment Variables

Add to `.env.local`:

```bash
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Database Connection (with pooling)
DATABASE_URL=postgresql://user:password@host:5432/database?connection_limit=10&pool_timeout=20
```

### Optional Settings

```bash
# Enable Prisma query logging in development
# (Automatically enabled based on NODE_ENV)

# Slow query threshold (milliseconds)
SLOW_QUERY_THRESHOLD=1000
```

## Best Practices

### 1. Cache Strategy

✅ **DO:**
- Cache frequently accessed, relatively static data
- Use appropriate TTLs based on data volatility
- Invalidate caches on data mutations
- Round coordinates for location queries to improve hit rates

❌ **DON'T:**
- Cache user-specific sensitive data without encryption
- Use very long TTLs for frequently changing data
- Forget to invalidate caches on updates

### 2. Database Queries

✅ **DO:**
- Use `include` and `select` to prevent N+1 queries
- Implement cursor-based pagination for large datasets
- Use composite indexes for multi-column filters
- Monitor slow queries regularly

❌ **DON'T:**
- Fetch all columns when only a few are needed
- Use offset pagination for large datasets
- Create too many indexes (balance read vs write performance)
- Ignore query performance in development

### 3. Connection Management

✅ **DO:**
- Configure appropriate pool sizes based on load
- Implement retry logic for transient failures
- Monitor connection pool metrics
- Use transactions for related operations

❌ **DON'T:**
- Create new Prisma clients on every request
- Use very large connection pools (increases overhead)
- Retry on constraint violations or validation errors
- Leave long-running connections open

## Running the Optimizations

### 1. Apply Database Migrations

```bash
npx prisma migrate deploy
```

This will apply the optimized indexes from:
`prisma/migrations/20250106_optimize_indexes/migration.sql`

### 2. Configure Redis

Set up Upstash Redis account and add credentials to `.env.local`

### 3. Restart Application

```bash
npm run dev
```

### 4. Monitor Performance

Check the performance endpoint:

```bash
curl http://localhost:3000/api/admin/performance
```

## Troubleshooting

### Cache Issues

**Problem**: Cache not working
- Verify Redis credentials in `.env.local`
- Check Redis health: `await checkRedisHealth()`
- Review error logs for connection issues

**Problem**: Stale cache data
- Verify cache invalidation is working
- Check TTL configurations
- Manually clear cache if needed: `await deleteByPattern('*')`

### Database Issues

**Problem**: Slow queries
- Check query logs for missing indexes
- Review `monitoredQuery` output
- Consider adding indexes for common filters

**Problem**: Connection pool exhaustion
- Increase `connection_limit` in DATABASE_URL
- Monitor pool metrics via performance API
- Check for connection leaks

## Performance Metrics

### Expected Improvements

- **Query Response Time**: 50-80% reduction for cached queries
- **Database Load**: 40-60% reduction in query volume
- **API Response Time**: 30-50% improvement for list endpoints
- **Concurrent Users**: 2-3x increase in capacity

### Monitoring Checklist

- [ ] Monitor cache hit rates
- [ ] Track slow query logs
- [ ] Review connection pool metrics
- [ ] Check Redis memory usage
- [ ] Analyze query patterns
- [ ] Monitor API response times

## Future Optimizations

### Planned Improvements

1. **Read Replicas**: Distribute read load across multiple databases
2. **CDN Integration**: Cache static assets and API responses
3. **Query Result Streaming**: For very large datasets
4. **Advanced Caching**: Implement cache warming strategies
5. **Database Sharding**: For horizontal scaling

### Experimental Features

- Prisma Accelerate for global caching
- PostgreSQL materialized views for analytics
- Time-series data optimization
- GraphQL federation for distributed data

## Support

For questions or issues related to performance optimization:

1. Check this documentation
2. Review error logs
3. Use the performance monitoring API
4. Contact the development team

---

**Last Updated**: January 6, 2025
**Version**: 1.0.0
