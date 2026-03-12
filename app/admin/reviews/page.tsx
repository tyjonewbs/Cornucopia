import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import prisma from '@/lib/db'
import { columns } from './columns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ReviewItem = {
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

async function getAllReviews() {
  const [productReviews, standReviews] = await Promise.all([
    prisma.productReview.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        product: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.standReview.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        marketStand: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  const allReviews: ReviewItem[] = [
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

  return allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export default async function AllReviewsPage() {
  const reviews = await getAllReviews()

  const totalReviews = reviews.length
  const productReviews = reviews.filter(r => r.type === 'product').length
  const standReviews = reviews.filter(r => r.type === 'stand').length
  const reportedReviews = reviews.filter(r => r.reportCount > 0).length
  const hiddenReviews = reviews.filter(r => !r.isVisible).length
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0'

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">All Reviews</h1>
          <p className="text-gray-500 mt-1">Manage all product and market stand reviews</p>
        </div>
        <Link href="/admin/reviews/reported">
          <Button variant="outline" className="text-red-600">
            View Reported ({reportedReviews})
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{productReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stand Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{standReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{avgRating}/5</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{hiddenReviews}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No reviews yet</div>
          ) : (
            <DataTable columns={columns} data={reviews} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
