"use client"

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Status } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { useState, ReactElement } from 'react'
import { ChevronDown, ChevronRight, Tag, X, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
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
  updatedAt: Date
  averageRating: number | null
  totalReviews: number
  deliveryAvailable: boolean
  tags: string[]
  adminTags: string[]
  inventoryUpdatedAt: Date | null
  images: string[]
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  marketStand: {
    id: string
    name: string
    locationName: string | null
  } | null
  standListings: {
    marketStandId: string
    customInventory: number | null
    isActive: boolean
    marketStand: {
      id: string
      name: string
    }
  }[]
  deliveryZone: {
    id: string
    name: string
    zipCodes: string[]
    deliveryDays: string[]
    deliveryFee: number
  } | null
  deliveryListings: {
    dayOfWeek: string
    inventory: number
    deliveryZoneId: string
  }[]
  local: {
    id: string
    name: string
    slug: string | null
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

const AVAILABLE_ADMIN_TAGS = [
  { value: 'fresh-today', label: 'Fresh Today', color: 'bg-emerald-500' },
  { value: 'fresh-this-hour', label: 'Fresh This Hour', color: 'bg-green-400' },
  { value: 'limited-stock', label: 'Limited Stock', color: 'bg-amber-500' },
  { value: 'last-few', label: 'Last Few!', color: 'bg-red-500' },
  { value: 'new-arrival', label: 'New Arrival', color: 'bg-blue-500' },
  { value: 'pre-order', label: 'Pre-Order', color: 'bg-indigo-500' },
  { value: 'seasonal', label: 'Seasonal', color: 'bg-orange-400' },
  { value: 'back-in-stock', label: 'Back in Stock', color: 'bg-teal-500' },
  { value: 'popular', label: 'Popular', color: 'bg-pink-500' },
  { value: 'vendor-verified', label: 'Verified Fresh', color: 'bg-emerald-600' },
] as const

function ProductBadgePicker({ product }: { product: ProductWithRelations }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [localTags, setLocalTags] = useState<string[]>(product.adminTags)

  const toggleTag = async (tagValue: string) => {
    const newTags = localTags.includes(tagValue)
      ? localTags.filter(t => t !== tagValue)
      : [...localTags, tagValue]

    setLocalTags(newTags)
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/product/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, tags: newTags }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update badges')
      }

      toast.success('Badges updated')
      router.refresh()
    } catch (error: any) {
      // Revert on error
      setLocalTags(product.adminTags)
      toast.error(error.message || 'Failed to update badges')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      {/* Current badges */}
      <div className="flex flex-wrap gap-1">
        {localTags.map(tag => {
          const config = AVAILABLE_ADMIN_TAGS.find(t => t.value === tag)
          return (
            <span
              key={tag}
              className={`inline-flex items-center gap-0.5 text-[10px] text-white px-1.5 py-0.5 rounded-full font-medium ${config?.color || 'bg-gray-500'}`}
            >
              {config?.label || tag}
              <button
                onClick={() => toggleTag(tag)}
                disabled={isLoading}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )
        })}
      </div>

      {/* Add badge dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isLoading}
          >
            <Tag className="h-3 w-3" />
            {localTags.length === 0 ? 'Add badge' : 'Edit'}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {AVAILABLE_ADMIN_TAGS.map(tag => {
            const isActive = localTags.includes(tag.value)
            return (
              <DropdownMenuItem
                key={tag.value}
                onClick={(e) => {
                  e.preventDefault()
                  toggleTag(tag.value)
                }}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${tag.color}`} />
                  <span className="text-sm">{tag.label}</span>
                </div>
                {isActive && <Check className="h-3.5 w-3.5 text-green-600" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function getInventoryBadgeColor(inventory: number): string {
  if (inventory === 0) return 'bg-gray-400 text-white'
  if (inventory < 3) return 'bg-red-500 text-white'
  if (inventory <= 10) return 'bg-amber-500 text-white'
  return 'bg-green-600 text-white'
}

export const columns: ColumnDef<ProductWithRelations>[] = [
  {
    id: "product",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original
      const thumbnail = product.images?.[0]
      return (
        <div className="flex gap-2 min-w-0">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={product.name}
              className="w-10 h-10 rounded object-cover flex-shrink-0"
            />
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{product.name}</span>
            <span className="text-sm text-gray-500">
              ${(product.price / 100).toFixed(2)}
            </span>
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {product.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
                {product.tags.length > 2 && (
                  <span className="text-xs text-gray-400">+{product.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }
  },
  {
    id: "producer",
    header: "Producer",
    cell: ({ row }) => {
      const user = row.original.user
      const local = row.original.local
      const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || 'Unknown'
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{displayName}</span>
          <span className="text-xs text-gray-500">{user.email}</span>
          {local && (
            <Link
              href={`/local/${local.slug || local.id}`}
              target="_blank"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
            >
              🌱 {local.name} <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>
      )
    }
  },
  {
    id: "locations",
    header: "Locations",
    cell: ({ row }) => {
      const product = row.original
      const elements: ReactElement[] = []

      // Add stand listings
      product.standListings.forEach((listing, idx) => {
        const inventory = listing.customInventory ?? product.inventory
        elements.push(
          <div key={`stand-${idx}`} className="text-sm">
            <span className="font-medium">📍 {listing.marketStand.name}</span>
            <span className="text-gray-600 ml-1">({inventory})</span>
          </div>
        )
      })

      // Add delivery zone
      if (product.deliveryAvailable && product.deliveryZone) {
        const totalDeliveryInventory = product.deliveryListings.reduce(
          (sum, listing) => sum + listing.inventory,
          0
        )
        const days = product.deliveryZone.deliveryDays.slice(0, 2).join(', ')
        const moreDays = product.deliveryZone.deliveryDays.length > 2
          ? ` +${product.deliveryZone.deliveryDays.length - 2}`
          : ''
        const zipCount = product.deliveryZone.zipCodes.length
        elements.push(
          <div key="delivery" className="text-sm">
            <span className="font-medium">🚚 {product.deliveryZone.name}</span>
            <div className="text-xs text-gray-600">
              {days}{moreDays} • {zipCount} zip{zipCount !== 1 ? 's' : ''} • {totalDeliveryInventory} units
            </div>
          </div>
        )
      }

      if (elements.length === 0) {
        return <span className="text-sm text-gray-400">No location</span>
      }

      return (
        <div className="flex flex-col gap-2 max-w-xs">
          {elements}
        </div>
      )
    }
  },
  {
    id: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const product = row.original

      // Calculate stand inventory
      let standInventory = 0
      if (product.standListings.length > 0) {
        standInventory = product.standListings.reduce((sum, listing) => {
          return sum + (listing.customInventory ?? product.inventory)
        }, 0)
      } else {
        standInventory = product.inventory
      }

      // Calculate delivery inventory
      const deliveryInventory = product.deliveryListings.reduce(
        (sum, listing) => sum + listing.inventory,
        0
      )

      return (
        <div className="flex flex-col gap-1 text-xs">
          {standInventory > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Stand:</span>
              <Badge className={`text-xs px-1.5 py-0 ${getInventoryBadgeColor(standInventory)}`}>
                {standInventory}
              </Badge>
            </div>
          )}
          {deliveryInventory > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Delivery:</span>
              <Badge className={`text-xs px-1.5 py-0 ${getInventoryBadgeColor(deliveryInventory)}`}>
                {deliveryInventory}
              </Badge>
            </div>
          )}
          {standInventory === 0 && deliveryInventory === 0 && (
            <Badge className="text-xs px-1.5 py-0 bg-gray-400 text-white">
              Out of stock
            </Badge>
          )}
        </div>
      )
    }
  },
  {
    id: "badges",
    header: "Badges",
    cell: ({ row }) => {
      const product = row.original
      return <ProductBadgePicker product={product} />
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
    id: "updatedAt",
    header: "Last Updated",
    accessorFn: row => row.updatedAt,
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as Date
      return (
        <span className="text-sm text-gray-600">
          {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
        </span>
      )
    }
  }
]
