import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
const protectedRoutes = [
  '/sell',
  '/settings',
  '/billing',
  '/dashboard/market-stand',
  '/dashboard/sell',
  '/dashboard/settings'
];

// Public routes that should never redirect
const publicRoutes = ['/', '/login', '/signup', '/auth-error'];

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });

    // Get the current session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.redirect(new URL('/auth-error', request.url));
    }
    
    const pathname = request.nextUrl.pathname;

    // Handle /dashboard redirect
    if (pathname === '/dashboard') {
      if (!session) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard/market-stand', request.url));
    }

    // Check if the request is for a protected route
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    );

    // Check if it's a public route
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(route)
    );

    // Handle protected routes
    if (isProtectedRoute) {
      if (!session) {
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

  } catch {
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
