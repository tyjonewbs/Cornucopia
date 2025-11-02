'use client'

import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { formatDistanceToNow } from 'date-fns'
import { ReviewModerationActions } from '@/components/admin/ReviewModerationActions'

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

export const columns: ColumnDef<ReportedReview>[] = [
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
