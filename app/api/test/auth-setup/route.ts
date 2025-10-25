import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Analytics } from '@/lib/analytics'
import { createRouteHandlerClient } from '@/lib/supabase-route'
import { createClient } from '@supabase/supabase-js'
import { Status } from '@prisma/client'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

const TEST_USER_EMAIL = 'test@example.com'
const TEST_USER_PASSWORD = 'test123456'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient()

    // Create or sign in user with admin client
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

    // Try to sign in first
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    })

    // If user doesn't exist, create one
    if (signInError && signInError.message.includes('Invalid login credentials')) {
      // Create user with admin role
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: 'Test',
          last_name: 'User',
          role: 'ADMIN'
        }
      })

      if (createError) {
        throw createError
      }

      // Sign in with the newly created user
      const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      })

      if (newSignInError) {
        throw newSignInError
      }

      signInData = newSignInData
    } else if (signInError) {
      throw signInError
    }

    if (!signInData.user) {
      throw new Error('Failed to create or retrieve user')
    }

    // Update user metadata in Supabase
    await adminClient.auth.admin.updateUserById(
      signInData.user.id,
      {
        user_metadata: {
          role: 'ADMIN',
          firstName: 'Test',
          lastName: 'User'
        }
      }
    )

    // Create or update user in our database with admin role
    const user = await prisma.user.upsert({
      where: { id: signInData.user.id },
      update: {
        role: 'ADMIN',
        firstName: 'Test',
        lastName: 'User',
        profileImage: 'https://via.placeholder.com/150'
      },
      create: {
        id: signInData.user.id,
        email: TEST_USER_EMAIL,
        firstName: 'Test',
        lastName: 'User',
        profileImage: 'https://via.placeholder.com/150',
        role: 'ADMIN'
      }
    })

    // Ensure user metadata is up to date
    await adminClient.auth.admin.updateUserById(
      signInData.user.id,
      {
        user_metadata: {
          first_name: 'Test',
          last_name: 'User',
          role: 'ADMIN'
        }
      }
    )

    // Refresh session to include updated metadata
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
    if (refreshedSession) {
      signInData.session = refreshedSession
    }

    // Refresh session to include updated metadata
    await supabase.auth.refreshSession()

    // Create test market stand
    const stand = await prisma.marketStand.create({
      data: {
        name: "Test Farm Stand",
        description: "A test market stand for analytics",
        images: [],
        tags: ["organic", "local"],
        latitude: 37.7749,
        longitude: -122.4194,
        locationName: "San Francisco",
        locationGuide: "Test location",
        isActive: true,
        userId: user.id,
        metrics: {
          create: {
            dailyMetrics: {
              create: Array.from({ length: 30 }).map((_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                orders: Math.floor(Math.random() * 20),
                revenue: Math.floor(Math.random() * 10000),
                views: Math.floor(Math.random() * 100),
                uniqueViews: Math.floor(Math.random() * 50)
              }))
            }
          }
        }
      }
    })

    // Create test products
    const products = await Promise.all(
      Array.from({ length: 5 }).map((_, i) => 
        prisma.product.create({
          data: {
            name: `Test Product ${i + 1}`,
            price: Math.floor(Math.random() * 5000) + 500, // $5-$55
            description: `Description for test product ${i + 1}`,
            images: [],
            tags: ["test"],
            inventory: Math.floor(Math.random() * 100),
            isActive: true,
            userId: user.id,
            marketStandId: stand.id,
            status: [Status.APPROVED, Status.PENDING, Status.REJECTED][Math.floor(Math.random() * 3)]
          }
        })
      )
    )

    // Track setup in PostHog
    Analytics.track('test_auth_setup_completed', {
      userId: user.id,
      standId: stand.id,
      productCount: products.length
    })

    // Create response with session data and set cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Test user created and authenticated',
      data: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        user,
        stand,
        products,
        session: signInData.session
      }
    })

    // Set auth cookie with session
    if (signInData.session) {
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/(?:\/\/|^)(.*?)\.supabase/)?.[1];
      if (!projectRef) throw new Error('Could not determine project ref');

      // Set the session cookie using the same format as Supabase
      response.cookies.set(`sb-${projectRef}-auth-token`, JSON.stringify({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: signInData.user
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 // 1 hour
      });

      // Also set the refresh token cookie
      response.cookies.set(`sb-${projectRef}-refresh-token`, signInData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    return response
  } catch (error) {
    console.error('Error in auth setup:', error)
    return NextResponse.json({ error: 'Failed to setup test auth' }, { status: 500 })
  }
}
