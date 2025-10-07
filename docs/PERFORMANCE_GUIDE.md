# Cornucopia Performance Optimization Guide

Complete guide to performance optimizations implemented in the Cornucopia application.

## 📚 Documentation Index

This is the master performance guide. For detailed information, see:

- **[Backend Performance](./PERFORMANCE_OPTIMIZATION.md)**: Database, caching, and API optimization
- **[Frontend Performance](./FRONTEND_PERFORMANCE.md)**: React, images, and UI optimization
- **[Performance Summary](./PERFORMANCE_OPTIMIZATION_SUMMARY.md)**: Quick reference guide

## 🎯 Quick Start

### For Developers

1. **Read Backend Guide** for database and API optimizations
2. **Read Frontend Guide** for React and UI optimizations
3. **Follow Best Practices** outlined in each guide
4. **Monitor Performance** using provided tools

### For DevOps

1. Configure environment variables (see below)
2. Apply database migrations
3. Set up Redis cache
4. Configure CDN for static assets
5. Enable monitoring

## 🚀 Performance Improvements Summary

### Backend Optimizations

✅ **Database**
- Optimized indexes for common queries
- N+1 query prevention
- Connection pooling
- Cursor-based pagination

✅ **Caching**
- Redis caching for frequently accessed data
- 5-60 minute TTLs based on data volatility
- Automatic cache invalidation
- Location-based query caching

✅ **API Performance**
- Query performance monitoring
- Slow query detection (>1000ms)
- Retry logic for transient failures
- Efficient data serialization

### Frontend Optimizations

✅ **React Architecture**
- Server Components by default
- Client Components only when needed
- Suspense boundaries for streaming
- ISR with 60s revalidation

✅ **Asset Optimization**
- Next.js Image optimization
- WebP/AVIF format support
- Responsive images
- Blur placeholders

✅ **Loading Experience**
- Skeleton screens
- Progressive rendering
- Streaming with Suspense
- Instant feedback

✅ **Offline Support**
- Service Worker implementation
- Smart caching strategy
- Offline page
- Background sync

## 📊 Expected Performance Metrics

### Before Optimization
- Page Load: 3-5 seconds
- Time to Interactive: 4-6 seconds
- API Response: 500-1000ms
- Database Queries: 100-500ms

### After Optimization
- Page Load: 1-2 seconds (50-60% improvement)
- Time to Interactive: 2-3 seconds (40-50% improvement)
- API Response: 100-300ms (70-80% improvement for cached)
- Database Queries: 20-100ms (70-80% improvement)

### Core Web Vitals Targets
- **LCP** (Largest Contentful Paint): < 2.5s ✅
- **FID** (First Input Delay): < 100ms ✅
- **CLS** (Cumulative Layout Shift): < 0.1 ✅

## 🛠️ Setup Instructions

### 1. Environment Configuration

Add to `.env.local`:

```bash
# Database (with connection pooling)
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=10&pool_timeout=20"

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Optional: Performance monitoring
SLOW_QUERY_THRESHOLD=1000
```

### 2. Database Setup

```bash
# Apply optimized indexes
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 3. Development Server

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### 4. Production Build

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

## 📈 Monitoring & Analytics

### Performance Monitoring

Check system health:
```bash
curl http://localhost:3000/api/admin/performance
```

Response includes:
- Database metrics
- Cache health
- Performance recommendations

### Browser DevTools

Monitor client-side performance:
1. Open DevTools → Performance tab
2. Record page load
3. Check Core Web Vitals
4. Analyze bundle sizes (Network tab)

### Production Monitoring

Recommended tools:
- **Vercel Analytics**: Page load metrics
- **PostHog**: User behavior analytics
- **Sentry**: Error tracking
- **Upstash**: Redis metrics

## 🎨 Implementation Examples

### Server Component with Streaming

```typescript
// app/products/page.tsx
import { Suspense } from 'react';
import { ProductGrid } from './ProductGrid';
import { ProductGridSkeleton } from '@/components/skeletons';

export const revalidate = 60; // ISR

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductGrid />
    </Suspense>
  );
}
```

### Optimized Image

```typescript
import Image from 'next/image';

<Image
  src="/products/image.jpg"
  alt="Product"
  width={800}
  height={600}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  quality={85}
  placeholder="blur"
/>
```

### Cache Revalidation

```typescript
'use server'

import { revalidateProduct } from '@/lib/cache/revalidation';

export async function updateProduct(id: string, data: ProductData) {
  await productService.update(id, data);
  revalidateProduct(id);
  return { success: true };
}
```

### Cached Data Fetching

```typescript
import { unstable_cache } from 'next/cache';

const getProducts = unstable_cache(
  async () => {
    return await productService.findAll();
  },
  ['products'],
  { revalidate: 60, tags: ['products'] }
);
```

## ✅ Performance Checklist

### Development
- [ ] Use Server Components by default
- [ ] Add 'use client' only when necessary
- [ ] Implement skeleton screens for loading states
- [ ] Optimize images with next/image
- [ ] Use appropriate cache revalidation times
- [ ] Add error boundaries
- [ ] Test on slow network (throttle to 3G)

### Database
- [ ] Use proper indexes
- [ ] Prevent N+1 queries with includes
- [ ] Implement cursor pagination for large datasets
- [ ] Monitor slow queries
- [ ] Configure connection pooling

### Caching
- [ ] Set up Redis for frequently accessed data
- [ ] Configure appropriate TTLs
- [ ] Implement cache invalidation
- [ ] Use cache tags for granular control

### Testing
- [ ] Test offline functionality
- [ ] Verify service worker registration
- [ ] Check Core Web Vitals
- [ ] Measure bundle sizes
- [ ] Test cache invalidation
- [ ] Verify image optimization

### Deployment
- [ ] Enable compression in next.config
- [ ] Configure CDN
- [ ] Set cache headers
- [ ] Enable monitoring
- [ ] Set up error tracking
- [ ] Apply database migrations

## 🔧 Troubleshooting

### Common Issues

**Issue: Slow page loads**
- Check Network tab for large assets
- Verify images are optimized
- Check database query performance
- Verify Redis connection

**Issue: High database load**
- Check for N+1 queries
- Verify indexes are applied
- Increase cache TTLs
- Review connection pool settings

**Issue: Service worker not updating**
- Increment cache version in sw.js
- Use "Update on reload" in DevTools
- Clear browser cache
- Check console for errors

**Issue: Cache not invalidating**
- Verify revalidation functions called
- Check cache tags match
- Review TTL settings
- Monitor Redis connection

## 🎯 Best Practices

### Do's ✅
- Use Server Components by default
- Implement proper loading states
- Optimize all images
- Cache frequently accessed data
- Monitor performance metrics
- Set appropriate revalidation times
- Use TypeScript for type safety

### Don'ts ❌
- Don't use 'use client' everywhere
- Don't skip loading states
- Don't use raw <img> tags
- Don't cache everything forever
- Don't ignore performance metrics
- Don't use force-dynamic unnecessarily
- Don't fetch data in client components

## 📚 Additional Resources

### Documentation
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Web Vitals](https://web.dev/vitals/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Redis Insight](https://redis.io/insight/)

## 🔄 Maintenance

### Weekly
- [ ] Review slow query logs
- [ ] Check cache hit rates
- [ ] Monitor error rates
- [ ] Review Core Web Vitals

### Monthly
- [ ] Update dependencies
- [ ] Review bundle sizes
- [ ] Optimize database indexes
- [ ] Audit cache strategies

### Quarterly
- [ ] Performance audit
- [ ] Database optimization review
- [ ] Cache strategy review
- [ ] User experience testing

## 📞 Support

For performance-related questions:

1. Check this guide and related documentation
2. Review error logs and monitoring data
3. Use performance monitoring API
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: January 6, 2025  
**Maintained By**: Cornucopia Development Team
