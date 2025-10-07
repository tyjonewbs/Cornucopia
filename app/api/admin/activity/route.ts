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

    // Fetch recent activity
    const [
      recentStandStatusChanges,
      recentProductStatusChanges
    ] = await Promise.all([
      // Recent stand status changes
      prisma.standStatusHistory.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          marketStand: {
            select: { name: true }
          },
          changedBy: {
            select: { firstName: true, lastName: true }
          }
        }
      }),

      // Recent product status changes
      prisma.productStatusHistory.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { name: true }
          },
          changedBy: {
            select: { firstName: true, lastName: true }
          }
        }
      })
    ])

    // Combine and sort activities
    const activities = [
      ...recentStandStatusChanges.map(change => ({
        type: 'stand',
        name: change.marketStand.name,
        oldStatus: change.oldStatus,
        newStatus: change.newStatus,
        changedBy: `${change.changedBy.firstName} ${change.changedBy.lastName}`,
        note: change.note,
        createdAt: change.createdAt
      })),
      ...recentProductStatusChanges.map(change => ({
        type: 'product',
        name: change.product.name,
        oldStatus: change.oldStatus,
        newStatus: change.newStatus,
        changedBy: `${change.changedBy.firstName} ${change.changedBy.lastName}`,
        note: change.note,
        createdAt: change.createdAt
      }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching admin activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
