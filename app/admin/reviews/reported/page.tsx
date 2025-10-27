import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import prisma from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { formatDistanceToNow } from 'date-fns'
import { ReviewModerationActions } from '@/components/admin/ReviewModerationActions'

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
    firstName: string
    lastName: string
    email: string
  }
  itemName: string
}

const columns: ColumnDef<ReportedReview>[] = [
  {
    id: "review",
    header: "Review",
    cell: ({ row }) => {
      const review = row.original
      return (
        <div className="flex flex-col max-w-md">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={review.type === 'product' ? 'default' : 'secondary'}>
              {review.type}
            </Badge>
            <span className="text-sm font-medium">{review.itemName}</span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">Rating: {review.rating}/5</span>
          </div>
        </div>
      )
    }
  },
  {
    id: "author",
    header: "Author",
    cell: ({ row }) => {
      const { user } = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{`${user.firstName} ${user.lastName}`}</span>
          <span className="text-xs text-gray-500">{user.email}</span>
        </div>
      )
    }
  },
  {
    id: "reports",
    header: "Reports",
    accessorFn: row => row.reportCount,
    cell: ({ row }) => {
      const count = row.getValue("reports") as number
      return (
        <Badge variant="destructive" className="font-bold">
          {count} {count === 1 ? 'report' : 'reports'}
        </Badge>
      )
    }
  },
  {
    id: "status",
    header: "Status",
    accessorFn: row => row.isVisible,
    cell: ({ row }) => {
      const isVisible = row.getValue("status") as boolean
      return (
        <Badge variant={isVisible ? 'default' : 'secondary'}>
          {isVisible ? 'Visible' : 'Hidden'}
        </Badge>
      )
    }
  },
  {
    id: "createdAt",
    header: "Posted",
    accessorFn: row => row.createdAt,
    cell: ({ row }) => {
      return formatDistanceToNow(new Date(row.getValue("createdAt")), { addSuffix: true })
    }
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const review = row.original
      return (
        <ReviewModerationActions
          reviewId={review.id}
          reviewType={review.type}
          isVisible={review.isVisible}
        />
      )
    }
  }
]

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
