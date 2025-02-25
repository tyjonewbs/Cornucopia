import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Analytics } from '@/lib/analytics'
import { Status } from '@prisma/client'

export async function GET() {
  try {
    // Create test user
    const user = await prisma.user.create({
      data: {
        id: "test-user",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        profileImage: "https://via.placeholder.com/150",
        role: "USER"
      }
    })

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

    // Track the setup in PostHog
    Analytics.track('test_setup_completed', {
      userId: user.id,
      standId: stand.id,
      productCount: products.length
    })

    return NextResponse.json({ 
      success: true, 
      data: {
        user,
        stand,
        products
      }
    })
  } catch (error) {
    console.error('Error creating test data:', error)
    return NextResponse.json({ error: 'Failed to create test data' }, { status: 500 })
  }
}
