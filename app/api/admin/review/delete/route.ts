import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createRouteHandlerClient } from '@/lib/supabase-route'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
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

    const body = await request.json()
    const { id, type } = body

    if (!id || !type) {
      return NextResponse.json({ error: 'Review ID and type are required' }, { status: 400 })
    }

    if (type === 'product') {
      // Get the review to update product stats
      const review = await prisma.productReview.findUnique({
        where: { id },
        select: { productId: true }
      })

      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }

      await prisma.productReview.delete({ where: { id } })

      // Update product review count and average
      const stats = await prisma.productReview.aggregate({
        where: { productId: review.productId },
        _avg: { rating: true },
        _count: true
      })

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          averageRating: stats._avg.rating,
          totalReviews: stats._count
        }
      })
    } else if (type === 'stand') {
      const review = await prisma.standReview.findUnique({
        where: { id },
        select: { marketStandId: true }
      })

      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }

      await prisma.standReview.delete({ where: { id } })

      // Update stand review count and average
      const stats = await prisma.standReview.aggregate({
        where: { marketStandId: review.marketStandId },
        _avg: { rating: true },
        _count: true
      })

      await prisma.marketStand.update({
        where: { id: review.marketStandId },
        data: {
          averageRating: stats._avg.rating,
          totalReviews: stats._count
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid review type' }, { status: 400 })
    }

    revalidatePath('/admin/reviews/reported')
    revalidatePath('/admin')

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
