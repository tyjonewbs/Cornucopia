"use client"

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Status } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
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
    firstName: string
    lastName: string
    email: string
  }
}

type MarketStandWithRelations = {
  id: string
  name: string
  locationName: string
  status: Status
  isActive: boolean
  createdAt: Date
  averageRating: number | null
  totalReviews: number
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  products: Array<{
    id: string
    isActive: boolean
  }>
  reviews: Array<{
    id: string
  }>
  statusHistory: StatusHistoryItem[]
}

// Status Badge with Dropdown Component
function StatusBadgeDropdown({ stand }: { stand: MarketStandWithRelations }) {
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
      const endpoint = selectedStatus === 'APPROVED' 
        ? '/api/admin/stand/approve'
        : '/api/admin/stand/reject'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: stand.id, 
          note: note || `Status changed to ${selectedStatus}` 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const data = await response.json()
      toast.success(data.message || 'Status updated successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to update status')
      console.error(error)
    } finally {
      setIsLoading(false)
      setIsDialogOpen(false)
      setNote('')
      setSelectedStatus(null)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none">
            <Badge 
              variant={
                stand.status === 'APPROVED' ? 'default' :
                stand.status === 'PENDING' ? 'secondary' :
                stand.status === 'REJECTED' ? 'destructive' :
                'outline'
              }
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              {stand.status.toLowerCase()}
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleStatusChange('APPROVED')}>
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('REJECTED')}>
            Reject
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('SUSPENDED')}>
            Suspend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Are you sure you want to change the status of <strong>{stand.name}</strong> to{' '}
                <strong>{selectedStatus?.toLowerCase()}</strong>?
              </p>
              <div>
                <label htmlFor="note" className="text-sm font-medium text-gray-700">
                  Note/Reason {selectedStatus === 'REJECTED' && '(required)'}:
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter reason for status change..."
                  className="mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={selectedStatus === 'REJECTED'}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={isLoading || (selectedStatus === 'REJECTED' && !note.trim())}
            >
              {isLoading ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Expandable Row for Status History
function StatusHistoryRow({ stand }: { stand: MarketStandWithRelations }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (stand.statusHistory.length === 0) {
    return null
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="text-xs">
          {stand.statusHistory.length} status {stand.statusHistory.length === 1 ? 'change' : 'changes'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 pl-5 border-l-2 border-gray-200">
          {stand.statusHistory.map((history) => (
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
                  {history.changedBy.firstName} {history.changedBy.lastName}
                </span>
              </div>
              <div className="text-gray-700 bg-gray-50 p-2 rounded">
                {history.note}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const columns: ColumnDef<MarketStandWithRelations>[] = [
  {
    id: "name",
    header: "Market Stand",
    cell: ({ row }) => {
      const stand = row.original
      return (
        <div className="flex flex-col">
          <Link 
            href={`/market-stand/${stand.id}`}
            className="font-medium hover:underline text-blue-600"
          >
            {stand.name}
          </Link>
          <span className="text-sm text-gray-500">{stand.locationName}</span>
        </div>
      )
    }
  },
  {
    id: "owner",
    header: "Owner",
    cell: ({ row }) => {
      const user = row.original.user
      return (
        <div className="flex flex-col">
          <span className="font-medium">{`${user.firstName} ${user.lastName}`}</span>
          <span className="text-sm text-gray-500">{user.email}</span>
        </div>
      )
    }
  },
  {
    id: "status",
    header: "Status",
    accessorFn: row => row.status,
    cell: ({ row }) => {
      const stand = row.original
      return (
        <div className="space-y-2">
          <StatusBadgeDropdown stand={stand} />
          <StatusHistoryRow stand={stand} />
        </div>
      )
    }
  },
  {
    id: "active",
    header: "Active",
    accessorFn: row => row.isActive,
    cell: ({ row }) => {
      const isActive = row.getValue("active") as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Yes' : 'No'}
        </Badge>
      )
    }
  },
  {
    id: "products",
    header: "Products",
    accessorFn: row => row.products,
    cell: ({ row }) => {
      const products = row.original.products
      return (
        <div className="text-center">
          <span className="font-medium">{products.length}</span>
          {products.length > 0 && (
            <div className="text-xs text-gray-500">
              {products.filter(p => p.isActive).length} active
            </div>
          )}
        </div>
      )
    }
  },
  {
    id: "reviews",
    header: "Reviews",
    cell: ({ row }) => {
      const stand = row.original
      return (
        <div className="text-center">
          <div className="font-medium">{stand.totalReviews}</div>
          {stand.averageRating !== null && stand.totalReviews > 0 && (
            <div className="text-xs text-gray-500">
              ⭐ {stand.averageRating.toFixed(1)}
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
