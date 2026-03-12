"use client"

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Status } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type StatusHistoryItem = {
  id: string
  oldStatus: Status
  newStatus: Status
  note: string
  createdAt: Date
  changedBy: {
    firstName: string | null
    lastName: string | null
    email: string
  }
}

type ProductWithRelations = {
  id: string
  name: string
  price: number
  inventory: number
  status: Status
  isActive: boolean
  createdAt: Date
  averageRating: number | null
  totalReviews: number
  deliveryAvailable: boolean
  tags: string[]
  user: {
    firstName: string | null
    lastName: string | null
    email: string
  }
  marketStand: {
    id: string
    name: string
  } | null
  statusHistory: StatusHistoryItem[]
}

function ProductStatusDropdown({ product }: { product: ProductWithRelations }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = (newStatus: Status) => {
    setSelectedStatus(newStatus)
    setIsDialogOpen(true)
  }

  const confirmStatusChange = async () => {
    if (!selectedStatus) return

    setIsLoading(true)
    try {
      let endpoint: string
      if (selectedStatus === 'APPROVED') {
        endpoint = '/api/admin/product/approve'
      } else if (selectedStatus === 'REJECTED') {
        endpoint = '/api/admin/product/reject'
      } else {
        endpoint = '/api/admin/product/suspend'
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          note: note || `Status changed to ${selectedStatus}`
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update status')
      }

      const data = await response.json()
      toast.success(data.message || 'Status updated successfully')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setIsLoading(false)
      setIsDialogOpen(false)
      setNote('')
      setSelectedStatus(null)
    }
  }

  const availableStatuses = (['APPROVED', 'REJECTED', 'SUSPENDED'] as Status[])
    .filter(s => s !== product.status)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none">
            <Badge
              variant={
                product.status === 'APPROVED' ? 'default' :
                product.status === 'PENDING' ? 'secondary' :
                product.status === 'REJECTED' ? 'destructive' :
                'outline'
              }
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              {product.status.toLowerCase()}
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableStatuses.map(status => (
            <DropdownMenuItem key={status} onClick={() => handleStatusChange(status)}>
              {status === 'APPROVED' ? 'Approve' : status === 'REJECTED' ? 'Reject' : 'Suspend'}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Change <strong>{product.name}</strong> status to{' '}
                <strong>{selectedStatus?.toLowerCase()}</strong>?
              </p>
              <div>
                <label htmlFor="note" className="text-sm font-medium text-gray-700">
                  Note {(selectedStatus === 'REJECTED' || selectedStatus === 'SUSPENDED') && '(required)'}:
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter reason for status change..."
                  className="mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={isLoading || ((selectedStatus === 'REJECTED' || selectedStatus === 'SUSPENDED') && !note.trim())}
            >
              {isLoading ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ProductStatusHistory({ product }: { product: ProductWithRelations }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (product.statusHistory.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="text-xs">
          {product.statusHistory.length} {product.statusHistory.length === 1 ? 'change' : 'changes'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 pl-5 border-l-2 border-gray-200">
          {product.statusHistory.map((history) => (
            <div key={history.id} className="text-xs space-y-1 pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {history.oldStatus} → {history.newStatus}
                </Badge>
                <span className="text-gray-500">
                  {formatDistanceToNow(new Date(history.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="text-gray-600">
                <span className="font-medium">
                  {history.changedBy.firstName && history.changedBy.lastName
                    ? `${history.changedBy.firstName} ${history.changedBy.lastName}`
                    : history.changedBy.email}
                </span>
              </div>
              {history.note && (
                <div className="text-gray-700 bg-gray-50 p-2 rounded">
                  {history.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const columns: ColumnDef<ProductWithRelations>[] = [
  {
    id: "name",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{product.name}</span>
          <span className="text-sm text-gray-500">
            ${(product.price / 100).toFixed(2)}
          </span>
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {product.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{product.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      )
    }
  },
  {
    id: "owner",
    header: "Owner",
    cell: ({ row }) => {
      const user = row.original.user
      const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || 'Unknown'
      return (
        <div className="flex flex-col">
          <span className="font-medium">{displayName}</span>
          <span className="text-sm text-gray-500">{user.email}</span>
        </div>
      )
    }
  },
  {
    id: "stand",
    header: "Stand",
    cell: ({ row }) => {
      const stand = row.original.marketStand
      if (!stand) return <span className="text-sm text-gray-400">None</span>
      return <span className="text-sm">{stand.name}</span>
    }
  },
  {
    id: "inventory",
    header: "Stock",
    cell: ({ row }) => {
      const inventory = row.original.inventory
      return (
        <div className="text-center">
          <span className={`font-medium ${inventory === 0 ? 'text-red-600' : ''}`}>
            {inventory}
          </span>
        </div>
      )
    }
  },
  {
    id: "status",
    header: "Status",
    accessorFn: row => row.status,
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="space-y-2">
          <ProductStatusDropdown product={product} />
          <ProductStatusHistory product={product} />
        </div>
      )
    }
  },
  {
    id: "reviews",
    header: "Reviews",
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="text-center">
          <div className="font-medium">{product.totalReviews}</div>
          {product.averageRating !== null && product.totalReviews > 0 && (
            <div className="text-xs text-gray-500">
              {product.averageRating.toFixed(1)}/5
            </div>
          )}
        </div>
      )
    }
  },
  {
    id: "createdAt",
    header: "Created",
    accessorFn: row => row.createdAt,
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date
      return (
        <span className="text-sm text-gray-600">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </span>
      )
    }
  }
]
