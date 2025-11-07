import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import prisma from '@/lib/db'
import { columns } from './columns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ReportedReview = {
  id: string
  rating: number
  comment: string
  reportCount: number
  isVisible: boolean
  createdAt: Date
  type: 'product' | 'stand'
  user: {
    firstName: string | null
    lastName: string | null
    email: string
  }
  itemName: string
}

async function getReportedReviews() {
  const [productReviews, standReviews] = await Promise.all([
    prisma.productReview.findMany({
      where: {
        reportCount: { gt: 0 }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        product: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        reportCount: 'desc'
      }
    }),
    prisma.standReview.findMany({
      where: {
        reportCount: { gt: 0 }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        marketStand: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        reportCount: 'desc'
      }
    })
  ])

  // Combine and transform the reviews
  const allReviews: ReportedReview[] = [
    ...productReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reportCount: review.reportCount,
      isVisible: review.isVisible,
      createdAt: review.createdAt,
      type: 'product' as const,
      user: review.user,
      itemName: review.product.name
    })),
    ...standReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reportCount: review.reportCount,
      isVisible: review.isVisible,
      createdAt: review.createdAt,
      type: 'stand' as const,
      user: review.user,
      itemName: review.marketStand.name
    }))
  ]

  // Sort by report count descending
  return allReviews.sort((a, b) => b.reportCount - a.reportCount)
}

export default async function ReportedReviewsPage() {
  const reviews = await getReportedReviews()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reported Reviews</h1>
          <p className="text-gray-500 mt-1">Moderate reviews that have been flagged by users</p>
        </div>
        <div className="text-sm text-gray-500">
          {reviews.length} reported
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reviews Requiring Moderation</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reported reviews to moderate
            </div>
          ) : (
            <DataTable columns={columns} data={reviews} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
