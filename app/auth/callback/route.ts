import { createRouteHandlerClient } from '@/lib/supabase-route'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient()
    
    // Exchange the code for a session
    let { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
    }

    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
    }

    // Ensure user exists in database (create if not exists)
    const user = await prisma.user.upsert({
      where: { id: session.user.id },
      update: {
        email: session.user.email || '',
        firstName: session.user.user_metadata?.first_name || session.user.user_metadata?.firstName || null,
        lastName: session.user.user_metadata?.last_name || session.user.user_metadata?.lastName || null,
        profileImage: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
      },
      create: {
        id: session.user.id,
        email: session.user.email || '',
        firstName: session.user.user_metadata?.first_name || session.user.user_metadata?.firstName || null,
        lastName: session.user.user_metadata?.last_name || session.user.user_metadata?.lastName || null,
        profileImage: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
        role: 'USER',
        profileComplete: false, // Default to false for new users
      },
      select: { 
        role: true, 
        profileComplete: true,
        username: true 
      }
    } as any)

    // Log for debugging
    console.log('Auth callback - User data:', { 
      id: session.user.id, 
      email: session.user.email,
      profileComplete: user.profileComplete,
      username: user.username 
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

    // Check if profile needs to be completed
    // User must have username AND profileComplete = true to skip onboarding
    const needsProfileCompletion = !user.profileComplete || !user.username;
    const redirectUrl = needsProfileCompletion
      ? '/auth/complete-profile'
      : '/dashboard/analytics';
    
    console.log('Auth callback - Redirect decision:', {
      needsProfileCompletion,
      redirectUrl,
      profileComplete: user.profileComplete,
      hasUsername: !!user.username
    })
    
    const response = NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))

    // Set auth cookies
    if (session) {
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/(?:\/\/|^)(.*?)\.supabase/)?.[1];
      if (!projectRef) throw new Error('Could not determine project ref');

      // Set the session cookie using the same format as Supabase
      response.cookies.set(`sb-${projectRef}-auth-token`, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
        expires_in: 60 * 60 * 24 * 7, // 7 days
        token_type: 'bearer',
        user: session.user
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      // Also set the refresh token cookie with longer expiration
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
