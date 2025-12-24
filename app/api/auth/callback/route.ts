export const dynamic = 'force-dynamic';

import { createRouteHandlerClient } from '@/lib/supabase-route';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const returnTo = requestUrl.searchParams.get('returnTo');

    console.log('[Auth Callback] Processing with code:', code ? 'present' : 'missing');
    console.log('[Auth Callback] Return path:', returnTo || 'default');

    if (!code) {
      console.error('[Auth Callback] No code provided');
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    }

    const supabase = createRouteHandlerClient();
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Callback] Session exchange error:', error);
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    }

    // Use getUser() for secure validation that session was established
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[Auth Callback] User authenticated:', user ? 'yes' : 'no');

    // Only redirect to protected routes if we have a validated user
    if (user) {
      const redirectPath = returnTo || '/dashboard/market-stand';
      console.log('[Auth Callback] Redirecting to:', redirectPath);
      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
    } else {
      console.log('[Auth Callback] No session, redirecting to home');
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    }
  } catch (error) {
    console.error('[Auth Callback] Error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
