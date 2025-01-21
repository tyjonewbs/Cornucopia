import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRateLimiter } from './lib/rate-limit';

const protectedRoutes = [
  '/sell',
  '/settings',
  '/billing',
  '/product',
  '/dashboard/market-stand',
  '/dashboard/sell',
  '/dashboard/settings'
];

// Public routes that should never redirect
const publicRoutes = ['/', '/login', '/signup', '/auth-error'];

export async function middleware(request: NextRequest) {
  try {
    // Check if this is an API route that needs rate limiting
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // Get IP for rate limiting
      const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
      
      // Create a rate limiter for this route
      const limiter = await getRateLimiter(ip, request.nextUrl.pathname);
      
      // Try to rate limit
      const { success, pending, limit, reset, remaining } = await limiter.limit(ip);
      
      if (!success) {
        return new NextResponse(JSON.stringify({
          error: 'Too many requests',
          limit,
          remaining: 0,
          reset,
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
          },
        });
      }
      
      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', reset.toString());
      
      return response;
    }

    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });

    // Get the current session
    console.log('[Middleware] Checking auth for path:', request.nextUrl.pathname);
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[Middleware] Session error:', sessionError);
      return NextResponse.redirect(new URL('/auth-error', request.url));
    }
    
    // Serialize session state before logging or passing to response
    const serializedSession = session ? JSON.parse(JSON.stringify({
      hasSession: true,
      accessToken: session.access_token ? '(present)' : null,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      }
    })) : {
      hasSession: false,
      accessToken: null,
      user: null
    };
    
    console.log('[Middleware] Session state:', serializedSession);
    
    const pathname = request.nextUrl.pathname;

    // Handle /dashboard redirect
    if (pathname === '/dashboard') {
      if (!session) {
        console.log('[Middleware] No session, redirecting to home');
        return NextResponse.redirect(new URL('/', request.url));
      }
      console.log('[Middleware] Has session, redirecting to dashboard/market-stand');
      return NextResponse.redirect(new URL('/dashboard/market-stand', request.url));
    }

    // Check if the request is for a protected route
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    );
    console.log('[Middleware] Route protection:', {
      path: pathname,
      isProtected: isProtectedRoute
    });

// Check if it's a public route
const isPublicRoute = publicRoutes.some(route => 
  pathname === route || pathname.startsWith(route)
);
console.log('[Middleware] Route access:', {
  path: pathname,
  isPublic: isPublicRoute
});

// Handle protected routes
if (isProtectedRoute) {
  if (!session) {
    console.log('[Middleware] Protected route access denied, redirecting to login');
    const returnUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/?returnUrl=${returnUrl}`, request.url));
  }
  // User is authenticated, allow access to protected route
  return response;
}

// For public routes, continue
if (isPublicRoute) {
  return response;
}

// For all other routes, continue if authenticated
if (session) {
  return response;
}

// Redirect to home for unauthenticated users
return NextResponse.redirect(new URL('/', request.url));

  } catch (e) {
    console.error('Middleware error:', e);
    return NextResponse.redirect(new URL('/auth-error', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
