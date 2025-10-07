import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createRouteHandlerClient } from '@/lib/supabase-route'

export async function GET() {
  try {
    // Check authentication and admin role
    const supabase = createRouteHandlerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch dashboard statistics
    const [
      totalUsers,
      pendingStands,
      pendingProducts,
      reportedReviews
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Pending stands (those awaiting approval)
      prisma.marketStand.count({
        where: {
          status: 'PENDING',
          isActive: true
        }
      }),

      // Pending products (those awaiting review)
      prisma.product.count({
        where: {
          status: 'PENDING',
          isActive: true
        }
      }),

      // Reported reviews (those flagged for attention)
      Promise.all([
        prisma.productReview.count({
          where: {
            reportCount: { gt: 0 },
            isVisible: true
          }
        }),
        prisma.standReview.count({
          where: {
            reportCount: { gt: 0 },
            isVisible: true
          }
        })
      ]).then(([productReviews, standReviews]) => productReviews + standReviews)
    ])

    return NextResponse.json({
      totalUsers,
      pendingStands,
      pendingProducts,
      reportedReviews
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
