import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // Check if this is an admin route
    if (pathname.startsWith('/admin')) {
      if (!session?.user) {
        return NextResponse.redirect(new URL('/auth/admin/login', request.url));
      }

      // Check user role from metadata
      const userRole = session.user.user_metadata?.role;
      if (!userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        console.log('[Middleware] Non-admin access attempt:', userRole);
        return NextResponse.redirect(new URL('/auth/admin/login', request.url));
      }

      return response;
    }

    // Handle other protected routes
    if (
      pathname.startsWith('/dashboard') || 
    pathname.startsWith('/account') ||
      pathname.startsWith('/market-stand/setup') ||
      pathname.startsWith('/local/setup')
    ) {
      if (!session) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Handle auth routes
    if (pathname.startsWith('/auth')) {
      // Allow access to admin login page
      if (pathname === '/auth/admin/login') {
        return response;
      }

      // Allow access to complete-profile page for authenticated users
      if (pathname === '/auth/complete-profile') {
        return response;
      }

      // Redirect authenticated users from login/callback pages
      if (session && !pathname.startsWith('/auth/callback')) {
        const returnTo = request.nextUrl.searchParams.get('returnTo') || '/dashboard/market-stand';
        return NextResponse.redirect(new URL(returnTo, request.url));
      }
    }

    return response;
  } catch (error) {
    console.error('[Middleware] Error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Match admin and protected routes
    '/admin/:path*',
    '/dashboard/:path*',
    '/auth/:path*',
    '/account/:path*',
    '/market-stand/setup/:path*',
    '/local/setup/:path*'
  ]
};
