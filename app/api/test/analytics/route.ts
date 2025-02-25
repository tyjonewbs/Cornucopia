import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Analytics } from '@/lib/analytics'

export async function GET() {
  try {
    // Create test market stand
    const stand = await prisma.marketStand.create({
      data: {
        name: "Test Stand",
        description: "A test market stand",
        images: [],
        tags: ["test"],
        latitude: 37.7749,
        longitude: -122.4194,
        locationName: "San Francisco",
        locationGuide: "Test location",
        isActive: true,
        userId: "test-user", // You'll need to replace this with a real user ID
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

    // Track the event in PostHog
    Analytics.track('test_data_created', {
      standId: stand.id
    })

    return NextResponse.json({ success: true, stand })
  } catch (error) {
    console.error('Error creating test data:', error)
    return NextResponse.json({ error: 'Failed to create test data' }, { status: 500 })
  }
}
