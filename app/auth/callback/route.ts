import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Exchange the code for a session
    let { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
    }

    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
    }

    // Get user role from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    // Update user metadata with role
    if (user && session) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      await adminClient.auth.admin.updateUserById(
        session.user.id,
        {
          user_metadata: {
            ...session.user.user_metadata,
            role: user.role
          }
        }
      )

      // Get fresh session with updated metadata
      const { data: { session: updatedSession } } = await supabase.auth.refreshSession()
      session = updatedSession || session
    }

    const response = NextResponse.redirect(new URL('/dashboard/analytics', requestUrl.origin))

    // Set auth cookies
    if (session) {
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/(?:\/\/|^)(.*?)\.supabase/)?.[1];
      if (!projectRef) throw new Error('Could not determine project ref');

      // Set the session cookie using the same format as Supabase
      response.cookies.set(`sb-${projectRef}-auth-token`, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: session.user
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 // 1 hour
      });

      // Also set the refresh token cookie
      response.cookies.set(`sb-${projectRef}-refresh-token`, session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    return response
  }

  // URL to redirect to after sign in process completes
  const redirectTo = requestUrl.searchParams.get('returnTo') || '/dashboard/market-stand'
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
}
