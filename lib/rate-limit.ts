import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter that allows 10 requests per 10 seconds by default
export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// Different rate limits for different routes
export const routeRateLimits = {
  // Market stand routes
  "/api/market-stand": { requests: 20, duration: "60s" },
  "/api/market-stand/[id]": { requests: 30, duration: "60s" },
  
  // Product routes
  "/api/product": { requests: 20, duration: "60s" },
  "/api/product/inventory": { requests: 30, duration: "60s" },
  
  // Auth routes - more permissive
  "/api/auth": { requests: 5, duration: "60s" }, // Stricter for auth attempts
  
  // Upload routes
  "/api/upload": { requests: 10, duration: "60s" },
  
  // Stripe routes
  "/api/stripe": { requests: 10, duration: "60s" },
  
  // Default rate limit for other routes
  default: { requests: 10, duration: "10s" }
} as const;

export async function getRateLimiter(identifier: string, route: string) {
  // Get the rate limit configuration for the route, or use default
  const config = routeRateLimits[route as keyof typeof routeRateLimits] || routeRateLimits.default;
  
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(
      config.requests,
      config.duration
    ),
    analytics: true,
    prefix: `@upstash/ratelimit/${route}`,
  });
}
