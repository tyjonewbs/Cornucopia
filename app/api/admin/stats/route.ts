import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createRouteHandlerClient } from '@/lib/supabase-route'

export async function GET() {
  try {
    // Check authentication and admin role
    const supabase = createRouteHandlerClient()
    // Use getUser() for secure server-side auth validation
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
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
      reportedReviews,
      totalOrders,
      activeDeliveries,
      pendingIssues,
      totalRevenue
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
      ]).then(([productReviews, standReviews]) => productReviews + standReviews),

      // Total orders
      prisma.order.count(),

      // Active deliveries (orders in progress)
      prisma.order.count({
        where: {
          type: 'DELIVERY',
          status: {
            in: ['PENDING', 'CONFIRMED', 'READY']
          }
        }
      }),

      // Pending issues (those needing resolution)
      prisma.orderIssue.count({
        where: {
          status: 'PENDING'
        }
      }),

      // Total revenue from completed orders
      prisma.order.aggregate({
        where: {
          status: {
            in: ['DELIVERED', 'COMPLETED']
          }
        },
        _sum: {
          totalAmount: true
        }
      }).then(result => result._sum.totalAmount || 0)
    ])

    return NextResponse.json({
      totalUsers,
      pendingStands,
      pendingProducts,
      reportedReviews,
      totalOrders,
      activeDeliveries,
      pendingIssues,
      totalRevenue
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
