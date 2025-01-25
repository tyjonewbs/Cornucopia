import { getSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/dashboard';

    // Handle email confirmation for sign up
    const type = requestUrl.searchParams.get('type');
    if (type === 'signup' && !code) {
      return NextResponse.redirect(
        `${requestUrl.origin}/?message=Please check your email to confirm your account`
      );
    }

    // Validate the code parameter for other auth flows
    if (!code) {
      return NextResponse.redirect(`${requestUrl.origin}/auth-error?error=no_code`);
    }

    const supabase = getSupabaseServer();

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      return NextResponse.redirect(`${requestUrl.origin}/auth-error?error=session_error`);
    }

    if (!data.session) {
      return NextResponse.redirect(`${requestUrl.origin}/auth-error?error=no_session`);
    }

    // Set session before redirecting
    await supabase.auth.setSession(data.session);

    // Redirect to the next parameter or fall back to dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    // Include error details in the redirect for better debugging
    const errorMessage = encodeURIComponent((error as Error).message);
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth-error?error=unexpected&message=${errorMessage}`
    );
  }
}
