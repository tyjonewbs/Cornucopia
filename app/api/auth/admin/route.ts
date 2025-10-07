import { createRouteHandlerClient } from '@/lib/supabase-route'
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const supabase = createRouteHandlerClient()

    // Sign in user
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Set auth cookie
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: user.role
      }
    })

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/(?:\/\/|^)(.*?)\.supabase/)?.[1];
    if (!projectRef) throw new Error('Could not determine project ref');

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

    return response
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
