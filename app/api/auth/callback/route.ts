export const dynamic = 'force-dynamic';

import { createRouteHandlerClient } from '@/lib/supabase-route';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const returnTo = requestUrl.searchParams.get('returnTo');

    if (!code) {
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    }

    const supabase = await createRouteHandlerClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Callback] Session exchange error:', error);
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    }

    // Use getUser() for secure validation that session was established
    const { data: { user } } = await supabase.auth.getUser();

    // Only redirect to protected routes if we have a validated user
    if (user) {
      const redirectPath = returnTo || '/dashboard/market-stand';
      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
    } else {
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    }
  } catch (error) {
    console.error('[Auth Callback] Error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
